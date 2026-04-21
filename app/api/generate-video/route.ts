import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fal } from '@fal-ai/client'
import { calcularCreditos, FAL_MODELS } from '@/lib/creditos'
import type { Modo, AspectRatio } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
fal.config({ credentials: process.env.FAL_KEY })

const MAX_IMAGE_SIZE = 14 * 1024 * 1024  // ~10MB decoded
const MAX_VIDEO_SIZE = 70 * 1024 * 1024  // ~50MB decoded

const SYSTEM_PROMPTS: Record<Modo, string> = {
  standard: "You are an expert at creating prompts for AI video generation in real estate. Convert the Portuguese description into a professional English prompt for generating realistic real estate videos. Focus on architectural transformation, construction, landscaping, lighting, and cinematic camera movement. Under 200 characters. No people or faces.",
  pro: "You are an expert at creating prompts for AI video generation in real estate. Convert the Portuguese description into a professional English prompt for generating realistic real estate videos. Focus on architectural transformation, construction, landscaping, lighting, and cinematic camera movement. Under 200 characters. No people or faces.",
  antes_depois: "You are an expert at creating prompts for AI video generation transitions in real estate. Convert the Portuguese description into a professional English prompt for animating a transformation between two real estate images. Focus on smooth transition, construction progress, or renovation journey. Under 200 characters.",
  video_video: "You are an expert at creating prompts for AI video-to-video transformation in real estate. Convert the Portuguese description into a professional English prompt for transforming existing real estate footage. Focus on environmental changes, renovation effects, or visual improvements. Under 200 characters.",
}

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()
    const {
      modo,
      imageBase64,
      imageMimeType,
      tailImageBase64,
      tailImageMimeType,
      videoBase64,
      videoMimeType,
      promptPortugues,
      duracao,
      aspectRatio = '16:9',
    } = body

    // Validações
    if (!modo || !promptPortugues || !duracao) {
      return NextResponse.json({ error: 'Dados em falta.' }, { status: 400 })
    }

    const modos: Modo[] = ['standard', 'pro', 'antes_depois', 'video_video']
    if (!modos.includes(modo)) {
      return NextResponse.json({ error: 'Modo inválido.' }, { status: 400 })
    }

    const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1']
    if (!aspectRatios.includes(aspectRatio)) {
      return NextResponse.json({ error: 'Formato inválido.' }, { status: 400 })
    }

    const duracaoNum = Math.min(Math.max(Math.floor(Number(duracao)), 1), 30)

    // Validar uploads por modo
    if (['standard', 'pro'].includes(modo)) {
      if (!imageBase64 || !imageMimeType) return NextResponse.json({ error: 'Imagem em falta.' }, { status: 400 })
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageMimeType))
        return NextResponse.json({ error: 'Por favor carrega uma imagem válida (JPG, PNG ou WEBP)' }, { status: 400 })
      if (imageBase64.length > MAX_IMAGE_SIZE)
        return NextResponse.json({ error: 'A imagem não pode ter mais de 10MB.' }, { status: 400 })
    }

    if (modo === 'antes_depois') {
      if (!imageBase64 || !tailImageBase64)
        return NextResponse.json({ error: 'Precisas de carregar as duas fotos.' }, { status: 400 })
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageMimeType) || !['image/jpeg', 'image/png', 'image/webp'].includes(tailImageMimeType))
        return NextResponse.json({ error: 'Formato de ficheiro não suportado. Aceites: JPG, PNG, WEBP' }, { status: 400 })
    }

    if (modo === 'video_video') {
      if (!videoBase64 || !videoMimeType)
        return NextResponse.json({ error: 'Vídeo em falta.' }, { status: 400 })
      if (!['video/mp4', 'video/quicktime'].includes(videoMimeType))
        return NextResponse.json({ error: 'Formato de vídeo não suportado. Aceites: MP4, MOV (máx. 50MB)' }, { status: 400 })
      if (videoBase64.length > MAX_VIDEO_SIZE)
        return NextResponse.json({ error: 'O vídeo não pode ter mais de 50MB.' }, { status: 400 })
    }

    // Calcular créditos
    const creditosNecessarios = calcularCreditos(modo as Modo, duracaoNum)

    // Verificar créditos
    const { data: profile } = await supabase
      .from('profiles').select('creditos, plano').eq('id', session.user.id).single()

    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

    if (profile.creditos < creditosNecessarios) {
      return NextResponse.json({
        error: `Não tens créditos suficientes para gerar este vídeo. Precisas de ${creditosNecessarios} créditos e tens ${profile.creditos} disponíveis.`
      }, { status: 402 })
    }

    // Otimizar prompt com Claude
    let promptOtimizado = `Professional real estate video: ${promptPortugues}`
    try {
      const claudeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        system: SYSTEM_PROMPTS[modo as Modo],
        messages: [{ role: 'user', content: promptPortugues }],
      })
      if (claudeRes.content[0].type === 'text') promptOtimizado = claudeRes.content[0].text.trim()
    } catch (err) {
      console.error('Claude error:', err)
    }

    // Preparar input do fal.ai por modo
    const falModel = FAL_MODELS[modo as Modo]
    const falInput: Record<string, unknown> = {
      prompt: promptOtimizado,
      duration: duracaoNum <= 5 ? 5 : 10,
      aspect_ratio: aspectRatio,
    }

    if (modo === 'standard' || modo === 'pro') {
      falInput.image_url = `data:${imageMimeType};base64,${imageBase64}`
      falInput.enable_audio = false
    } else if (modo === 'antes_depois') {
      falInput.image_url = `data:${imageMimeType};base64,${imageBase64}`
      falInput.tail_image_url = `data:${tailImageMimeType};base64,${tailImageBase64}`
    } else if (modo === 'video_video') {
      falInput.video_url = `data:${videoMimeType};base64,${videoBase64}`
      falInput.enable_audio = false
    }

    // Submeter job ao fal.ai de forma assíncrona
    let falRequestId: string | null = null
    try {
      const { request_id } = await fal.queue.submit(falModel, { input: falInput })
      falRequestId = request_id
    } catch (err) {
      console.error('Fal.ai submit error:', err)
      return NextResponse.json({ error: 'Erro ao submeter o vídeo para geração. Tenta novamente.' }, { status: 500 })
    }

    // Criar registo
    const { data: videoRecord, error: insertError } = await supabase
      .from('videos')
      .insert({
        user_id: session.user.id,
        prompt_original: promptPortugues,
        prompt_otimizado: promptOtimizado,
        duracao: duracaoNum,
        creditos_gastos: creditosNecessarios,
        qualidade: ['starter', 'team', 'agency'].includes(profile.plano) ? 'pro' : 'std',
        modo,
        aspect_ratio: aspectRatio,
        modelo_usado: falModel,
        fal_request_id: falRequestId,
        status: 'processing',
      })
      .select().single()

    if (insertError || !videoRecord) {
      return NextResponse.json({ error: 'Erro ao criar registo do vídeo.' }, { status: 500 })
    }

    // Debitar créditos
    await supabase.from('profiles')
      .update({ creditos: profile.creditos - creditosNecessarios })
      .eq('id', session.user.id)

    return NextResponse.json({ videoId: videoRecord.id, status: 'processing', creditosGastos: creditosNecessarios })

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

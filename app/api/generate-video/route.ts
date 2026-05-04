import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fal } from '@fal-ai/client'
import { calcularCreditos, FAL_MODELS } from '@/lib/creditos'
import type { Modo, AspectRatio } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const FAL_KEY = process.env.FAL_KEY!
fal.config({ credentials: FAL_KEY })

const MAX_IMAGE_SIZE = 14 * 1024 * 1024
const MAX_VIDEO_SIZE = 70 * 1024 * 1024

const SYSTEM_PROMPTS: Record<Modo, string> = {
  standard:         'You are a prompt engineer for Kling 3.0 Pro image-to-video. Convert the Portuguese description into a single clean English sentence, maximum 200 characters. No formatting, no bullet points, no headers, no special characters. Describe the visual result and camera movement. No people or faces. Output only the sentence.',
  pro:              'You are a prompt engineer for Seedance 2.0 image-to-video. The uploaded photo is referenced as @Image1 in the prompt. Convert the Portuguese description into a single clean English sentence referencing @Image1 as the main subject. Maximum 200 characters. No formatting, no bullet points, no headers, no special characters. Describe the visual result and cinematic camera movement in detail. No people or faces. Output only the sentence.',
  antes_depois:     'You are a prompt engineer for Kling AI transition video. Convert the Portuguese description into a single clean English sentence, maximum 200 characters. No formatting, no bullet points, no headers. Describe the visual transition between the two images. No people or faces. Output only the sentence.',
  video_video:      'You are a prompt engineer for Kling AI video transformation. Convert the Portuguese description into a single clean English sentence, maximum 200 characters. No formatting, no bullet points, no headers. Describe the visual transformation to apply to the footage. No people or faces. Output only the sentence.',
  projeto_aprovado: 'You are an expert at creating prompts for Seedance 2.0 AI video generation of architectural projects. @Image1 is the terrain photo and @Image2 is the architectural plan or 3D render. Create a professional English prompt that references @Image1 and @Image2, instructing the AI to build the structure from @Image2 on the terrain in @Image1. Focus on: realistic placement on the exact terrain, drone aerial perspective, photorealistic quality, same scale as neighboring buildings. Under 200 characters. No people or faces.',
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

// Upload base64 para o CDN do fal.ai usando o SDK oficial
async function uploadToFalCDN(base64: string, mimeType: string, fileName: string): Promise<string> {
  const binaryBuffer = Buffer.from(base64, 'base64')
  const blob = new Blob([binaryBuffer], { type: mimeType })
  const file = new File([blob], fileName, { type: mimeType })
  const cdnUrl = await fal.storage.upload(file)
  return cdnUrl
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
      planImageBase64,
      planImageMimeType,
      videoBase64,
      videoMimeType,
      promptPortugues,
      duracao,
      aspectRatio = '16:9',
    } = body

    if (!modo || !promptPortugues || !duracao)
      return NextResponse.json({ error: 'Dados em falta.' }, { status: 400 })

    const modos: Modo[] = ['standard', 'pro', 'antes_depois', 'video_video', 'projeto_aprovado']
    if (!modos.includes(modo))
      return NextResponse.json({ error: 'Modo inválido.' }, { status: 400 })

    const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1']
    if (!aspectRatios.includes(aspectRatio))
      return NextResponse.json({ error: 'Formato inválido.' }, { status: 400 })

    const MODO_MAX: Record<string, number> = {
      standard: 30, pro: 10, antes_depois: 10, video_video: 30, projeto_aprovado: 10,
    }
    const maxDuracao = MODO_MAX[modo] || 10
    const duracaoNum = Math.min(Math.max(Math.floor(Number(duracao)), 1), maxDuracao)

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

    if (modo === 'projeto_aprovado') {
      if (!imageBase64 || !imageMimeType)
        return NextResponse.json({ error: 'Foto do terreno em falta.' }, { status: 400 })
      if (!planImageBase64 || !planImageMimeType)
        return NextResponse.json({ error: 'Planta do projeto em falta.' }, { status: 400 })
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageMimeType))
        return NextResponse.json({ error: 'Formato inválido para a foto do terreno. Aceites: JPG, PNG, WEBP' }, { status: 400 })
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(planImageMimeType))
        return NextResponse.json({ error: 'Formato inválido para a planta. Aceites: JPG, PNG, WEBP' }, { status: 400 })
      if (imageBase64.length > MAX_IMAGE_SIZE || planImageBase64.length > MAX_IMAGE_SIZE)
        return NextResponse.json({ error: 'As imagens não podem ter mais de 10MB cada.' }, { status: 400 })
    }

    const creditosNecessarios = calcularCreditos(modo as Modo, duracaoNum)

    const { data: profile } = await supabase
      .from('profiles').select('creditos, plano').eq('id', session.user.id).single()

    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

    if (profile.creditos < creditosNecessarios) {
      return NextResponse.json({
        error: `Não tens créditos suficientes. Precisas de ${creditosNecessarios} e tens ${profile.creditos}.`
      }, { status: 402 })
    }

    // Otimizar prompt com Claude
    let promptOtimizado = `Professional real estate video: ${promptPortugues}`
    try {
      const claudeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: SYSTEM_PROMPTS[modo as Modo],
        messages: [{ role: 'user', content: `User description: ${promptPortugues}\nVideo mode: ${modo}\nGenerate the optimised English prompt.` }],
      })
      if (claudeRes.content[0].type === 'text') promptOtimizado = claudeRes.content[0].text.trim()
    } catch (err) {
      console.error('Claude error:', err)
    }

    // Upload ficheiros para o CDN do fal.ai
    const falModel = FAL_MODELS[modo as Modo]
    const isSeedance = modo === 'pro' || modo === 'projeto_aprovado'

    // Duration: Seedance uses number (5 or 10), Kling v3 uses string number, Kling v1.6 uses "5"/"10"
    let durationParam: string | number
    if (isSeedance) {
      durationParam = duracaoNum <= 5 ? 5 : 10
    } else if (modo === 'standard') {
      durationParam = String(duracaoNum)
    } else {
      durationParam = duracaoNum <= 5 ? '5' : '10'
    }

    // Base falInput — Seedance uses resolution+audio, Kling uses aspect_ratio
    const falInput: Record<string, unknown> = isSeedance
      ? { prompt: promptOtimizado, duration: durationParam, resolution: '720p', audio: false }
      : { prompt: promptOtimizado, duration: durationParam, aspect_ratio: aspectRatio, enable_audio: false }

    try {
      if (modo === 'standard') {
        const ext = imageMimeType.split('/')[1] || 'jpg'
        const url = await uploadToFalCDN(imageBase64, imageMimeType, `image.${ext}`)
        console.log('Standard image CDN URL:', url)
        falInput.image_url = url
      } else if (modo === 'pro') {
        const ext = imageMimeType.split('/')[1] || 'jpg'
        const url = await uploadToFalCDN(imageBase64, imageMimeType, `image.${ext}`)
        console.log('Pro image CDN URL:', url)
        falInput.image_urls = [url]
      } else if (modo === 'antes_depois') {
        const ext = imageMimeType.split('/')[1] || 'jpg'
        const extTail = tailImageMimeType.split('/')[1] || 'jpg'
        falInput.image_url = await uploadToFalCDN(imageBase64, imageMimeType, `image_start.${ext}`)
        falInput.tail_image_url = await uploadToFalCDN(tailImageBase64, tailImageMimeType, `image_end.${extTail}`)
        console.log('Antes/depois CDN URLs uploaded')
      } else if (modo === 'video_video') {
        const ext = videoMimeType === 'video/quicktime' ? 'mov' : 'mp4'
        falInput.video_url = await uploadToFalCDN(videoBase64, videoMimeType, `video.${ext}`)
        console.log('Video CDN URL uploaded')
      } else if (modo === 'projeto_aprovado') {
        const extTerrain = imageMimeType.split('/')[1] || 'jpg'
        const extPlan = planImageMimeType.split('/')[1] || 'jpg'
        const terrainUrl = await uploadToFalCDN(imageBase64, imageMimeType, `terrain.${extTerrain}`)
        const planUrl = await uploadToFalCDN(planImageBase64, planImageMimeType, `plan.${extPlan}`)
        falInput.image_urls = [terrainUrl, planUrl]  // @Image1=terreno, @Image2=planta
        console.log('Projeto aprovado CDN URLs uploaded')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Fal CDN upload error:', msg)
      return NextResponse.json({ error: `Erro ao enviar ficheiro: ${msg}` }, { status: 500 })
    }

    // Submeter job ao fal.ai
    let falRequestId: string | null = null
    try {
      console.log('Submitting to fal.ai:', falModel, 'input keys:', Object.keys(falInput))
      const falRes = await fetch(`https://queue.fal.run/${falModel}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(falInput),
      })
      const falData = await falRes.json() as Record<string, unknown>
      console.log('Fal submit response:', JSON.stringify(falData).substring(0, 400))
      if (!falRes.ok) {
        const errMsg = (falData?.detail as string) || (falData?.error as string) || JSON.stringify(falData)
        return NextResponse.json({ error: `Fal.ai: ${errMsg}` }, { status: 500 })
      }
      falRequestId = falData.request_id as string
      if (!falRequestId)
        return NextResponse.json({ error: 'Fal.ai não devolveu request_id.' }, { status: 500 })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Fal submit error:', msg)
      return NextResponse.json({ error: `Fal.ai: ${msg}` }, { status: 500 })
    }

    // Criar registo na DB
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

    if (insertError || !videoRecord)
      return NextResponse.json({ error: 'Erro ao criar registo do vídeo.' }, { status: 500 })

    await supabase.from('profiles')
      .update({ creditos: profile.creditos - creditosNecessarios })
      .eq('id', session.user.id)

    return NextResponse.json({ videoId: videoRecord.id, status: 'processing', creditosGastos: creditosNecessarios })

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

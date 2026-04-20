import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fal } from '@fal-ai/client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
fal.config({ credentials: process.env.FAL_KEY })

const MAX_BASE64_SIZE = 14 * 1024 * 1024

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await request.json()
    const { imageBase64, imageMimeType, promptPortugues, duracao } = body

    if (!imageBase64 || !promptPortugues || !duracao) {
      return NextResponse.json({ error: 'Dados em falta.' }, { status: 400 })
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageMimeType)) {
      return NextResponse.json({ error: 'Por favor carrega uma imagem válida (JPG, PNG ou WEBP)' }, { status: 400 })
    }

    if (imageBase64.length > MAX_BASE64_SIZE) {
      return NextResponse.json({ error: 'A imagem não pode ter mais de 10MB.' }, { status: 400 })
    }

    const duracaoNum = Math.min(Math.max(Math.floor(Number(duracao)), 1), 20)

    // Verificar créditos
    const { data: profile } = await supabase
      .from('profiles')
      .select('creditos, plano')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.creditos < duracaoNum) {
      return NextResponse.json({ error: 'Não tens créditos suficientes. Faz upgrade do teu plano.' }, { status: 402 })
    }

    const qualidade = ['pro', 'agency'].includes(profile.plano) ? 'pro' : 'std'

    // Otimizar prompt com Claude
    let promptOtimizado = `Professional real estate video: ${promptPortugues}`
    try {
      const claudeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: "You are an expert at creating prompts for AI video generation in real estate. Convert the user's Portuguese description into a professional English prompt optimized for generating realistic real estate videos. Focus on: architectural transformation, construction progress, landscaping, lighting quality, and cinematic camera movement. The prompt must be vivid, specific and under 200 characters. Never mention people or faces. Reply with only the prompt, no explanations.",
        messages: [{ role: 'user', content: promptPortugues }],
      })
      if (claudeRes.content[0].type === 'text') {
        promptOtimizado = claudeRes.content[0].text.trim()
      }
    } catch (err) {
      console.error('Claude error:', err)
    }

    // Criar registo do vídeo
    const { data: videoRecord, error: insertError } = await supabase
      .from('videos')
      .insert({
        user_id: session.user.id,
        prompt_original: promptPortugues,
        prompt_otimizado: promptOtimizado,
        duracao: duracaoNum,
        creditos_gastos: duracaoNum,
        qualidade,
        status: 'processing',
      })
      .select()
      .single()

    if (insertError || !videoRecord) {
      return NextResponse.json({ error: 'Erro ao criar registo do vídeo.' }, { status: 500 })
    }

    // Debitar créditos
    await supabase
      .from('profiles')
      .update({ creditos: profile.creditos - duracaoNum })
      .eq('id', session.user.id)

    // Gerar vídeo com Fal.ai
    try {
      const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`

      const result = await fal.subscribe('fal-ai/kling-video-v2-5-image-to-video', {
        input: {
          image_url: imageDataUrl,
          prompt: promptOtimizado,
          duration: duracaoNum <= 5 ? '5' : '10',
          aspect_ratio: '16:9',
        },
        logs: false,
      })

      const anyResult = result as Record<string, unknown>
      const videoUrl =
        (anyResult?.video as { url?: string })?.url ||
        ((anyResult?.data as Record<string, unknown>)?.video as { url?: string })?.url ||
        null

      if (videoUrl) {
        await supabase
          .from('videos')
          .update({ video_url: videoUrl, status: 'completed' })
          .eq('id', videoRecord.id)

        return NextResponse.json({ videoId: videoRecord.id, status: 'completed', videoUrl })
      } else {
        throw new Error('URL do vídeo não recebida')
      }
    } catch (falError) {
      // Devolver créditos
      await supabase
        .from('profiles')
        .update({ creditos: profile.creditos })
        .eq('id', session.user.id)

      await supabase
        .from('videos')
        .update({ status: 'failed' })
        .eq('id', videoRecord.id)

      console.error('Fal.ai error:', falError)
      return NextResponse.json(
        { error: 'Ocorreu um erro na geração do vídeo. Os teus créditos foram devolvidos.' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

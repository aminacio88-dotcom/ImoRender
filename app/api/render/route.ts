import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fal } from '@fal-ai/client'
import { CREDITOS_RENDER_IA } from '@/lib/creditos'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const FAL_KEY = process.env.FAL_KEY!
fal.config({ credentials: FAL_KEY })

const MAX_IMAGE_SIZE = 14 * 1024 * 1024

const FAL_MODEL_PRIMARY = 'fal-ai/nano-banana-pro'
const FAL_MODEL_FALLBACK = 'fal-ai/ideogram/v3'

const RENDER_STYLES: Record<string, string> = {
  'Moderno Minimalista': 'modern minimalist interior design, clean lines, neutral tones, uncluttered spaces',
  'Contemporâneo':       'contemporary interior design, sleek finishes, open layout, stylish furniture',
  'Mediterrâneo':        'mediterranean interior design, warm terracotta tones, arched windows, natural textures',
  'Industrial':          'industrial interior design, exposed brick and concrete, metal accents, raw materials',
  'Clássico':            'classic interior design, ornate details, rich fabrics, traditional furniture, elegant decor',
}

const SYSTEM_PROMPT = `You are an expert architectural visualization prompt engineer. Your task is to create a photorealistic interior rendering prompt based on the user's floor plan or sketch. Write a single clean English sentence describing a beautiful photorealistic interior render of this space. Include: the style requested, natural lighting through windows, high-quality materials, realistic shadows and reflections. Return ONLY the prompt text, under 200 characters, no formatting.`

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

async function uploadToFalCDN(base64: string, mimeType: string, fileName: string): Promise<string> {
  const binaryBuffer = Buffer.from(base64, 'base64')
  const blob = new Blob([binaryBuffer], { type: mimeType })
  const file = new File([blob], fileName, { type: mimeType })
  return await fal.storage.upload(file)
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()
    const { imageBase64, imageMimeType, style, promptPortugues } = body

    if (!imageBase64 || !imageMimeType || !style)
      return NextResponse.json({ error: 'Dados em falta.' }, { status: 400 })

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageMimeType))
      return NextResponse.json({ error: 'Formato inválido. Aceites: JPG, PNG, WEBP' }, { status: 400 })

    if (imageBase64.length > MAX_IMAGE_SIZE)
      return NextResponse.json({ error: 'A imagem não pode ter mais de 10MB.' }, { status: 400 })

    const validStyles = Object.keys(RENDER_STYLES)
    if (!validStyles.includes(style))
      return NextResponse.json({ error: 'Estilo inválido.' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles').select('creditos').eq('id', session.user.id).single()

    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

    if (profile.creditos < CREDITOS_RENDER_IA) {
      return NextResponse.json({
        error: `Não tens créditos suficientes. Precisas de ${CREDITOS_RENDER_IA} e tens ${profile.creditos}.`
      }, { status: 402 })
    }

    // Build base prompt
    const styleDesc = RENDER_STYLES[style]
    const userContext = promptPortugues ? ` Additional context: ${promptPortugues}` : ''

    // Optimize prompt with Claude
    let promptOtimizado = `Photorealistic interior render, ${styleDesc}, architectural visualization, 8K quality`
    try {
      const claudeRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: SYSTEM_PROMPT + ` Style requested: ${style} — ${styleDesc}.`,
        messages: [{ role: 'user', content: `Floor plan/sketch to render. Style: ${style}.${userContext} Create a photorealistic render prompt.` }],
      })
      if (claudeRes.content[0].type === 'text') promptOtimizado = claudeRes.content[0].text.trim()
    } catch (err) {
      console.error('Claude error:', err)
    }

    // Upload image to fal.ai CDN
    let imageUrl: string
    try {
      const ext = imageMimeType.split('/')[1] || 'jpg'
      imageUrl = await uploadToFalCDN(imageBase64, imageMimeType, `floor_plan.${ext}`)
      console.log('Render image CDN URL:', imageUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: `Erro ao enviar imagem: ${msg}` }, { status: 500 })
    }

    // Submit to fal.ai queue (try primary, fallback to secondary)
    let falRequestId: string | null = null
    let modeloUsado = FAL_MODEL_PRIMARY

    const falInput = { prompt: promptOtimizado, image_url: imageUrl }

    for (const model of [FAL_MODEL_PRIMARY, FAL_MODEL_FALLBACK]) {
      try {
        console.log('Submitting render to fal.ai:', model)
        const falRes = await fetch(`https://queue.fal.run/${model}`, {
          method: 'POST',
          headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(falInput),
        })
        const falData = await falRes.json() as Record<string, unknown>
        console.log('Fal render submit response:', JSON.stringify(falData).substring(0, 400))

        if (falRes.ok && falData.request_id) {
          falRequestId = falData.request_id as string
          modeloUsado = model
          break
        }
        console.warn(`Model ${model} failed:`, falData)
      } catch (err) {
        console.error(`Model ${model} error:`, err)
      }
    }

    if (!falRequestId)
      return NextResponse.json({ error: 'Fal.ai não devolveu request_id.' }, { status: 500 })

    // Create record in renders table
    const { data: renderRecord, error: insertError } = await supabase
      .from('renders')
      .insert({
        user_id: session.user.id,
        input_image_url: imageUrl,
        style,
        prompt_original: promptPortugues || '',
        prompt_otimizado: promptOtimizado,
        creditos_gastos: CREDITOS_RENDER_IA,
        modelo_usado: modeloUsado,
        fal_request_id: falRequestId,
        status: 'processing',
      })
      .select().single()

    if (insertError || !renderRecord) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Erro ao criar registo do render.' }, { status: 500 })
    }

    // Debit credits
    await supabase.from('profiles')
      .update({ creditos: profile.creditos - CREDITOS_RENDER_IA })
      .eq('id', session.user.id)

    return NextResponse.json({ renderId: renderRecord.id, status: 'processing', creditosGastos: CREDITOS_RENDER_IA })

  } catch (err) {
    console.error('Render API error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const FAL_KEY = process.env.FAL_KEY!
fal.config({ credentials: FAL_KEY })

const TIMEOUT_MINUTES = 15

// Service role client para operações de storage (bypass RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
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

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: video } = await supabase
    .from('videos').select('*').eq('id', params.id).eq('user_id', session.user.id).single()

  if (!video) return NextResponse.json({ error: 'Vídeo não encontrado.' }, { status: 404 })

  if (video.status === 'completed' || video.status === 'failed') {
    return NextResponse.json(video)
  }

  if (video.status === 'processing' && video.fal_request_id && video.modelo_usado) {
    // Timeout de 15 minutos
    const createdAt = new Date(video.created_at).getTime()
    const ageMinutes = (Date.now() - createdAt) / 60000
    if (ageMinutes > TIMEOUT_MINUTES) {
      console.warn(`Video ${video.id} stuck for ${ageMinutes.toFixed(1)} min — marking failed`)
      await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
      await devolverCreditos(supabase, session.user.id, video.creditos_gastos)
      return NextResponse.json({ ...video, status: 'failed' })
    }

    try {
      // Status URL uses base model (first 2 path segments) — fal.ai queue routing
      const baseModel = video.modelo_usado.split('/').slice(0, 2).join('/')
      const statusUrl = `https://queue.fal.run/${baseModel}/requests/${video.fal_request_id}/status`
      console.log('Checking status:', statusUrl)

      const statusRes = await fetch(statusUrl, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      })

      if (!statusRes.ok) {
        const errText = await statusRes.text()
        console.error(`Status HTTP ${statusRes.status}:`, errText)
        if (statusRes.status === 404) {
          await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
          await devolverCreditos(supabase, session.user.id, video.creditos_gastos)
          return NextResponse.json({ ...video, status: 'failed' })
        }
        return NextResponse.json({ ...video, status: 'processing' })
      }

      const statusData = await statusRes.json() as { status: string }
      console.log('Fal status:', statusData.status)

      if (statusData.status === 'COMPLETED') {
        // Resultado via SDK
        console.log('Fetching result via SDK for model:', video.modelo_usado)
        const result = await fal.queue.result(video.modelo_usado, {
          requestId: video.fal_request_id,
        })
        const anyResult = result as Record<string, unknown>

        const falVideoUrl =
          (anyResult?.video as { url?: string })?.url ||
          ((anyResult?.data as Record<string, unknown>)?.video as { url?: string })?.url ||
          (anyResult?.video_url as string) ||
          null

        console.log('Fal video URL:', falVideoUrl)

        if (!falVideoUrl) {
          console.error('No video URL in result:', JSON.stringify(anyResult).substring(0, 500))
          await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
          await devolverCreditos(supabase, session.user.id, video.creditos_gastos)
          return NextResponse.json({ ...video, status: 'failed' })
        }

        // Download do vídeo do fal.ai e upload para Supabase Storage (sem fallback para URL temporário)
        const serviceClient = getServiceClient()
        const fileName = `${session.user.id}/${video.id}.mp4`
        let finalVideoUrl: string | null = null

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Downloading video from fal.ai (attempt ${attempt})...`)
            const videoRes = await fetch(falVideoUrl)
            if (!videoRes.ok) {
              console.error(`Download failed (${videoRes.status}), attempt ${attempt}`)
              continue
            }
            const videoBuffer = await videoRes.arrayBuffer()
            const { error: uploadError } = await serviceClient.storage
              .from('videos')
              .upload(fileName, videoBuffer, { contentType: 'video/mp4', upsert: true })
            if (uploadError) {
              console.error(`Storage upload error attempt ${attempt}:`, uploadError.message)
              continue
            }
            const { data: publicData } = serviceClient.storage.from('videos').getPublicUrl(fileName)
            finalVideoUrl = publicData.publicUrl
            console.log('Stored in Supabase Storage:', finalVideoUrl)
            break
          } catch (err) {
            console.error(`Storage attempt ${attempt} failed:`, err)
          }
        }

        if (!finalVideoUrl) {
          console.error('All storage upload attempts failed — marking video as failed and refunding credits')
          await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
          await devolverCreditos(supabase, session.user.id, video.creditos_gastos)
          return NextResponse.json({ ...video, status: 'failed' })
        }

        await supabase.from('videos').update({ video_url: finalVideoUrl, status: 'completed' }).eq('id', video.id)
        return NextResponse.json({ ...video, status: 'completed', video_url: finalVideoUrl })
      }

      if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
        console.error('Fal job failed:', statusData)
        await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
        await devolverCreditos(supabase, session.user.id, video.creditos_gastos)
        return NextResponse.json({ ...video, status: 'failed' })
      }

      return NextResponse.json({ ...video, status: 'processing' })

    } catch (err) {
      console.error('Status/result error:', err)
      return NextResponse.json({ ...video, status: 'processing' })
    }
  }

  return NextResponse.json(video)
}

async function devolverCreditos(supabase: ReturnType<typeof createServerClient>, userId: string, creditos: number) {
  const { data: profile } = await supabase.from('profiles').select('creditos').eq('id', userId).single()
  if (profile) {
    await supabase.from('profiles').update({ creditos: profile.creditos + creditos }).eq('id', userId)
  }
}

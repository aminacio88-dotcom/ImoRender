import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

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
    try {
      const statusResult = await fal.queue.status(video.modelo_usado, {
        requestId: video.fal_request_id,
        logs: false,
      })

      if (statusResult.status === 'COMPLETED') {
        const result = await fal.queue.result(video.modelo_usado, { requestId: video.fal_request_id })
        const anyResult = result as Record<string, unknown>
        const videoUrl =
          (anyResult?.video as { url?: string })?.url ||
          ((anyResult?.data as Record<string, unknown>)?.video as { url?: string })?.url ||
          (anyResult?.video_url as string) ||
          null

        if (videoUrl) {
          await supabase.from('videos').update({ video_url: videoUrl, status: 'completed' }).eq('id', video.id)
          return NextResponse.json({ ...video, status: 'completed', video_url: videoUrl })
        } else {
          await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
          await devolverCreditos(supabase, session.user.id, video.creditos_gastos)
          return NextResponse.json({ ...video, status: 'failed' })
        }
      }

      if ((statusResult.status as string) === 'FAILED') {
        await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
        await devolverCreditos(supabase, session.user.id, video.creditos_gastos)
        return NextResponse.json({ ...video, status: 'failed' })
      }

      return NextResponse.json({ ...video, status: 'processing' })
    } catch (err) {
      console.error('Fal status error:', err)
      return NextResponse.json(video)
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

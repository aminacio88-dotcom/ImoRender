import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const FAL_MODEL = 'fal-ai/kling-video/v2.6/standard/image-to-video'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createServerClient(
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

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: video } = await supabase
    .from('videos')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!video) {
    return NextResponse.json({ error: 'Vídeo não encontrado.' }, { status: 404 })
  }

  // Se já está concluído ou falhou, retornar estado actual
  if (video.status === 'completed' || video.status === 'failed') {
    return NextResponse.json(video)
  }

  // Se está em processamento e temos o fal request_id, verificar estado no fal.ai
  if (video.status === 'processing' && video.fal_request_id) {
    try {
      const statusResult = await fal.queue.status(FAL_MODEL, {
        requestId: video.fal_request_id,
        logs: false,
      })

      if (statusResult.status === 'COMPLETED') {
        // Obter o resultado
        const result = await fal.queue.result(FAL_MODEL, {
          requestId: video.fal_request_id,
        })

        const anyResult = result as Record<string, unknown>
        const videoUrl =
          (anyResult?.video as { url?: string })?.url ||
          ((anyResult?.data as Record<string, unknown>)?.video as { url?: string })?.url ||
          ((anyResult as Record<string, unknown>)?.video_url as string) ||
          null

        if (videoUrl) {
          await supabase
            .from('videos')
            .update({ video_url: videoUrl, status: 'completed' })
            .eq('id', video.id)

          return NextResponse.json({ ...video, status: 'completed', video_url: videoUrl })
        } else {
          // Resultado sem URL — falha
          await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
          await devolvercreditos(supabase, session.user.id, video.creditos_gastos)
          return NextResponse.json({ ...video, status: 'failed' })
        }
      }

      if ((statusResult.status as string) === 'FAILED') {
        await supabase.from('videos').update({ status: 'failed' }).eq('id', video.id)
        await devolvercreditos(supabase, session.user.id, video.creditos_gastos)
        return NextResponse.json({ ...video, status: 'failed' })
      }

      // Ainda em processamento (IN_QUEUE ou IN_PROGRESS)
      return NextResponse.json({ ...video, status: 'processing' })

    } catch (err) {
      console.error('Fal status check error:', err)
      // Retornar estado atual sem alterar
      return NextResponse.json(video)
    }
  }

  return NextResponse.json(video)
}

async function devolvercreditos(supabase: ReturnType<typeof createServerClient>, userId: string, creditos: number) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('creditos')
    .eq('id', userId)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({ creditos: profile.creditos + creditos })
      .eq('id', userId)
  }
}

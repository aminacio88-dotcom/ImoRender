import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
    .select('id, status, video_url, prompt_original, duracao, created_at')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!video) {
    return NextResponse.json({ error: 'Vídeo não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(video)
}

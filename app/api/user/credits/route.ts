import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('creditos, creditos_total, plano')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(profile)
}

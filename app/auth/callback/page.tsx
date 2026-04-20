'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState('A confirmar a tua conta...')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Handle hash-based tokens (implicit flow) — #access_token=...
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.replace('#', ''))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (error) {
              setMessage('Erro ao confirmar a conta. Tenta fazer login.')
              setTimeout(() => router.push('/auth/login'), 2000)
              return
            }
            setMessage('Conta confirmada! A redirecionar...')
            setTimeout(() => router.push('/dashboard'), 500)
            return
          }
        }

        // Handle code-based flow (PKCE) — ?code=...
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setMessage('Erro ao confirmar a conta. Tenta fazer login.')
            setTimeout(() => router.push('/auth/login'), 2000)
            return
          }
          setMessage('Conta confirmada! A redirecionar...')
          setTimeout(() => router.push('/dashboard'), 500)
          return
        }

        // Se não há token nem code, verificar se já tem sessão
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
        } else {
          router.push('/auth/login')
        }
      } catch {
        setMessage('Erro inesperado. A redirecionar para o login...')
        setTimeout(() => router.push('/auth/login'), 2000)
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '16px' }}>
          <svg style={{ width: '40px', height: '40px', color: '#00d4aa', animation: 'spin 1s linear infinite' }}
            className="animate-spin" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{message}</p>
      </div>
    </div>
  )
}

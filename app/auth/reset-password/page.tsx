'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase envia o token via hash (#access_token=...) ou code (?code=...)
    async function init() {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', ''))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          setReady(true)
          return
        }
      }
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
        setReady(true)
        return
      }
      // Sem token — redireciona para login
      router.push('/auth/login')
    }
    init()
  }, [router, supabase])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setError('As palavras-passe não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Erro ao atualizar a palavra-passe. Tenta novamente.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)' }}>
        <svg className="w-8 h-8 animate-spin" style={{ color: '#00D4AA' }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)' }}>
              <span className="font-bold text-white text-sm">IR</span>
            </div>
            <span className="font-bold text-xl" style={{ color: '#1A1A2E' }}>ImoRender</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E' }}>Nova palavra-passe</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Define uma nova palavra-passe para a tua conta</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Nova palavra-passe</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6} placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E' }}
                onFocus={e => e.target.style.borderColor = '#00D4AA'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Confirmar palavra-passe</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required minLength={6} placeholder="Repete a nova palavra-passe"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E' }}
                onFocus={e => e.target.style.borderColor = '#00D4AA'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: '#00D4AA', color: '#FFFFFF' }}>
              {loading ? 'A guardar...' : 'Guardar nova palavra-passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

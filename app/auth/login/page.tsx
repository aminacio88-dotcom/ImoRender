'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou palavra-passe incorretos.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: 'https://imorender.pt/auth/reset-password',
    })
    if (error) {
      setForgotError('Erro ao enviar email. Verifica o endereço e tenta novamente.')
      setForgotLoading(false)
      return
    }
    setForgotSent(true)
    setForgotLoading(false)
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
          {!forgotMode ? (
            <>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E' }}>Bem-vindo de volta</h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>Entra na tua conta para continuar</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E' }}>Recuperar palavra-passe</h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>Enviamos um link para o teu email</p>
            </>
          )}
        </div>

        <div className="p-8 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {!forgotMode ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="o.teu@email.com"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E' }}
                  onFocus={e => e.target.style.borderColor = '#00D4AA'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold" style={{ color: '#374151' }}>Palavra-passe</label>
                  <button type="button" onClick={() => { setForgotMode(true); setForgotEmail(email) }}
                    className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: '#00D4AA' }}>
                    Esqueci a palavra-passe
                  </button>
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
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
                {loading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>
          ) : forgotSent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✉️</div>
              <p className="font-semibold mb-2" style={{ color: '#1A1A2E' }}>Email enviado!</p>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                Verifica a caixa de entrada de <strong>{forgotEmail}</strong> e clica no link para definir uma nova palavra-passe.
              </p>
              <button onClick={() => { setForgotMode(false); setForgotSent(false) }}
                className="text-sm font-semibold hover:opacity-80" style={{ color: '#00D4AA' }}>
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Email da conta</label>
                <input
                  type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  required placeholder="o.teu@email.com"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E' }}
                  onFocus={e => e.target.style.borderColor = '#00D4AA'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              {forgotError && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  {forgotError}
                </div>
              )}

              <button type="submit" disabled={forgotLoading}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00D4AA', color: '#FFFFFF' }}>
                {forgotLoading ? 'A enviar...' : 'Enviar link de recuperação'}
              </button>

              <button type="button" onClick={() => setForgotMode(false)}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ color: '#6B7280' }}>
                Voltar ao login
              </button>
            </form>
          )}
        </div>

        {!forgotMode && (
          <p className="text-center mt-5 text-sm" style={{ color: '#6B7280' }}>
            Não tens conta?{' '}
            <Link href="/auth/register" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#00D4AA' }}>
              Regista-te grátis
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

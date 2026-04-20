'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered' ? 'Este email já está registado.' : 'Ocorreu um erro. Tenta novamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold mb-3">Confirma o teu email</h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Enviámos um email de confirmação para <strong style={{ color: '#fff' }}>{email}</strong>.<br />
            Clica no link do email para ativar a tua conta.
          </p>
          <Link href="/auth/login" className="text-sm font-medium" style={{ color: '#00d4aa' }}>
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)' }}>
              <span className="font-bold" style={{ color: '#000' }}>IR</span>
            </div>
            <span className="font-semibold text-xl">ImoRender</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Cria a tua conta</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>10 créditos grátis · Sem cartão de crédito</p>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                placeholder="O teu nome"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#00d4aa'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="o.teu@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#00d4aa'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#00d4aa'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: '#00d4aa', color: '#000' }}
            >
              {loading ? 'A criar conta...' : 'Criar conta grátis'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Já tens conta?{' '}
          <Link href="/auth/login" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#00d4aa' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

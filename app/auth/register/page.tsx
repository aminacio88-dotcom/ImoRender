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
      email, password,
      options: { data: { nome }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      if (error.message === 'User already registered') {
        setError('Este email já está registado.')
      } else {
        setError(error.message || 'Ocorreu um erro. Tenta novamente.')
      }
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)' }}>
        <div className="w-full max-w-md text-center p-8 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#1A1A2E' }}>Confirma o teu email</h1>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            Enviámos um email de confirmação para <strong style={{ color: '#1A1A2E' }}>{email}</strong>.<br />
            Clica no link do email para ativar a tua conta.
          </p>
          <Link href="/auth/login" className="text-sm font-semibold" style={{ color: '#00D4AA' }}>
            Voltar ao login
          </Link>
        </div>
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
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E' }}>Cria a tua conta</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>50 créditos grátis · Sem cartão de crédito</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Nome</label>
              <input
                type="text" value={nome} onChange={e => setNome(e.target.value)}
                required placeholder="O teu nome"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E' }}
                onFocus={e => e.target.style.borderColor = '#00D4AA'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
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
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Palavra-passe</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6} placeholder="Mínimo 6 caracteres"
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
              {loading ? 'A criar conta...' : 'Criar conta grátis'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: '#6B7280' }}>
          Já tens conta?{' '}
          <Link href="/auth/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#00D4AA' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

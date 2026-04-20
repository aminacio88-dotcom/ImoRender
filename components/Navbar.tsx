'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface NavbarProps {
  profile?: Profile | null
  showAuth?: boolean
}

export default function Navbar({ profile, showAuth = true }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)' }}>
            <span className="text-black font-bold text-sm">IR</span>
          </div>
          <span className="font-semibold text-white text-lg">ImoRender</span>
        </Link>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link href="/planos" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
                Planos
              </Link>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
                <span className="text-accent text-xs font-medium" style={{ color: '#00d4aa' }}>{profile.creditos} créditos</span>
              </div>
              <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition-colors">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Sair
              </button>
            </>
          ) : showAuth ? (
            <>
              <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                style={{ background: '#00d4aa', color: '#000' }}
              >
                Começar Grátis
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  )
}

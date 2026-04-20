import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()

  const { data: statsData } = await supabase
    .from('videos')
    .select('creditos_gastos, status')
    .eq('user_id', session.user.id)

  const totalVideos = statsData?.length || 0
  const videosCompletos = statsData?.filter(v => v.status === 'completed').length || 0
  const creditosGastos = statsData?.reduce((acc, v) => acc + (v.creditos_gastos || 0), 0) || 0

  const planoLabel: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    agency: 'Agency',
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)' }}>
              <span className="font-bold text-sm" style={{ color: '#000' }}>IR</span>
            </div>
            <span className="font-semibold text-lg">ImoRender</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Dashboard</Link>
            <Link href="/planos" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Planos</Link>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-16 px-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">O meu perfil</h1>

        {/* Info da conta */}
        <div className="p-6 rounded-2xl mb-6" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Informações da conta</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Nome</span>
              <span className="text-sm font-medium">{profile?.nome || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</span>
              <span className="text-sm font-medium">{profile?.email || session.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Membro desde</span>
              <span className="text-sm font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Plano e créditos */}
        <div className="p-6 rounded-2xl mb-6" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plano e créditos</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Plano atual</span>
              <span className="text-sm font-semibold capitalize" style={{ color: '#00d4aa' }}>{planoLabel[profile?.plano || 'free']}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Créditos disponíveis</span>
              <span className="text-sm font-bold" style={{ color: '#00d4aa' }}>{profile?.creditos || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total do plano</span>
              <span className="text-sm font-medium">{profile?.creditos_total || 0} créditos/mês</span>
            </div>
            {profile && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span>Utilização</span>
                  <span>{Math.round(((profile.creditos_total - profile.creditos) / profile.creditos_total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round((profile.creditos / profile.creditos_total) * 100)}%`, background: '#00d4aa' }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <Link href="/planos" className="text-sm font-medium" style={{ color: '#00d4aa' }}>
              Ver planos disponíveis →
            </Link>
          </div>
        </div>

        {/* Estatísticas de uso */}
        <div className="p-6 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Histórico de uso</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl" style={{ background: '#0a0a0f' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#00d4aa' }}>{totalVideos}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Vídeos criados</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: '#0a0a0f' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#00d4aa' }}>{videosCompletos}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Concluídos</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: '#0a0a0f' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#00d4aa' }}>{creditosGastos}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Créditos gastos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

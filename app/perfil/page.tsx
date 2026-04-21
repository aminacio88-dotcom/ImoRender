import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
  const { data: statsData } = await supabase.from('videos').select('creditos_gastos, status').eq('user_id', session.user.id)

  const totalVideos = statsData?.length || 0
  const videosCompletos = statsData?.filter(v => v.status === 'completed').length || 0
  const creditosGastos = statsData?.reduce((acc, v) => acc + (v.creditos_gastos || 0), 0) || 0

  const planoLabel: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency', enterprise: 'Enterprise' }

  return (
    <div style={{ background: '#F8F9FA', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)' }}>
              <span className="font-bold text-sm text-white">IR</span>
            </div>
            <span className="font-bold text-lg" style={{ color: '#1A1A2E' }}>ImoRender</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium" style={{ color: '#6B7280' }}>Dashboard</Link>
            <Link href="/planos" className="text-sm font-medium" style={{ color: '#6B7280' }}>Planos</Link>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-16 px-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8" style={{ color: '#1A1A2E' }}>O meu perfil</h1>

        {/* Info da conta */}
        <div className="p-6 rounded-2xl mb-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Informações da conta</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: '#6B7280' }}>Nome</span>
              <span className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>{profile?.nome || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: '#6B7280' }}>Email</span>
              <span className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>{profile?.email || session.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: '#6B7280' }}>Membro desde</span>
              <span className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Plano e créditos */}
        <div className="p-6 rounded-2xl mb-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Plano e créditos</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: '#6B7280' }}>Plano atual</span>
              <span className="text-sm font-bold" style={{ color: '#00D4AA' }}>{planoLabel[profile?.plano || 'free']}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: '#6B7280' }}>Créditos disponíveis</span>
              <span className="text-sm font-bold" style={{ color: '#00D4AA' }}>{profile?.creditos || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: '#6B7280' }}>Total do plano</span>
              <span className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>{profile?.creditos_total || 0} créditos/mês</span>
            </div>
            {profile && (
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: '#9CA3AF' }}>
                  <span>Utilização</span>
                  <span>{Math.round(((profile.creditos_total - profile.creditos) / profile.creditos_total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F1F3F5' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((profile.creditos / profile.creditos_total) * 100)}%`, background: '#00D4AA' }} />
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
            <Link href="/planos" className="text-sm font-semibold" style={{ color: '#00D4AA' }}>
              Ver planos disponíveis →
            </Link>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="p-6 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Histórico de uso</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Vídeos criados', value: totalVideos },
              { label: 'Concluídos', value: videosCompletos },
              { label: 'Créditos gastos', value: creditosGastos },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 rounded-xl" style={{ background: '#F8F9FA', border: '1px solid #E5E7EB' }}>
                <div className="text-2xl font-bold mb-1" style={{ color: '#00D4AA' }}>{s.value}</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

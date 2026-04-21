import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLANO_WAIT } from '@/lib/creditos'

const PLANOS = [
  {
    id: 'free', nome: 'Free', preco: 0, creditos: 50, popular: false,
    target: 'Para experimentar',
    wait: PLANO_WAIT.free,
    watermark: true,
    features: [
      '50 créditos (1 vídeo de teste)',
      'Modo Standard apenas',
      'Tempo de espera até 15 min',
      'Marca de água ImoRender',
      'Download em MP4',
    ],
  },
  {
    id: 'starter', nome: 'Starter', preco: 24.99, creditos: 1000, popular: false,
    target: 'Para consultores individuais',
    wait: PLANO_WAIT.starter,
    watermark: false,
    features: [
      '1.000 créditos/mês',
      '~10 vídeos Pro de 10s/mês',
      'Todos os modos de geração',
      'Tempo de espera até 5 min',
      'Sem marca de água',
      'Compra de créditos extra',
      'Suporte por email',
    ],
  },
  {
    id: 'team', nome: 'Team', preco: 59.99, creditos: 4000, popular: true,
    target: 'Para equipas de até 15 consultores',
    wait: PLANO_WAIT.team,
    watermark: false,
    features: [
      '4.000 créditos/mês',
      '~40 vídeos Pro de 10s/mês',
      'Todos os modos de geração',
      'Tempo de espera até 2 min',
      'Sem marca de água',
      'Compra de créditos extra',
      'Suporte prioritário',
    ],
  },
  {
    id: 'agency', nome: 'Agency', preco: 169.99, creditos: 12000, popular: false,
    target: 'Para agências com 15 a 50 consultores',
    wait: PLANO_WAIT.agency,
    watermark: false,
    features: [
      '12.000 créditos/mês',
      '~120 vídeos Pro de 10s/mês',
      'Todos os modos de geração',
      'Processamento prioritário',
      'Sem marca de água',
      'Compra de créditos extra',
      'Suporte dedicado',
    ],
  },
]

const PACKS = [
  { id: 'small',  nome: 'Small',  creditos: 200,  preco: 3.99 },
  { id: 'medium', nome: 'Medium', creditos: 500,  preco: 7.99 },
  { id: 'large',  nome: 'Large',  creditos: 1500, preco: 19.99 },
]

export default async function PlanosPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('plano').eq('id', session.user.id).single()
  const planoAtual = profile?.plano || 'free'
  const isPaid = ['starter', 'team', 'agency'].includes(planoAtual)

  return (
    <div style={{ background: '#F8F9FA', minHeight: '100vh' }}>
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
            <Link href="/perfil" className="text-sm font-medium" style={{ color: '#6B7280' }}>Perfil</Link>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#1A1A2E' }}>Planos e Preços</h1>
          <p className="text-base mb-1" style={{ color: '#6B7280' }}>
            Plano atual: <span className="font-bold" style={{ color: '#00D4AA' }}>{PLANOS.find(p => p.id === planoAtual)?.nome || planoAtual}</span>
          </p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Sem contratos. Cancela quando quiseres. Começa grátis.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {PLANOS.map(plano => {
            const isAtual = plano.id === planoAtual
            return (
              <div key={plano.id} className="relative p-6 rounded-2xl flex flex-col"
                style={{
                  background: '#FFFFFF',
                  border: isAtual ? '2px solid #00D4AA' : plano.popular ? '2px solid #00D4AA' : '1px solid #E5E7EB',
                  boxShadow: plano.popular ? '0 8px 32px rgba(0,212,170,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                {plano.popular && !isAtual && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: '#00D4AA', color: '#FFFFFF' }}>
                    Mais Popular
                  </div>
                )}
                {isAtual && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: '#00D4AA', color: '#FFFFFF' }}>
                    Plano atual
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="font-bold text-xl mb-0.5" style={{ color: '#1A1A2E' }}>{plano.nome}</h3>
                  <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{plano.target}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold" style={{ color: '#1A1A2E' }}>
                      €{plano.preco % 1 === 0 ? plano.preco : plano.preco.toFixed(2)}
                    </span>
                    <span className="text-sm mb-1" style={{ color: '#9CA3AF' }}>/mês</span>
                  </div>
                  <div className="text-sm mt-1.5 font-semibold" style={{ color: '#00D4AA' }}>{plano.creditos.toLocaleString('pt-PT')} créditos</div>
                </div>
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plano.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: '#374151' }}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#00D4AA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {isAtual ? (
                  <div className="w-full py-2.5 rounded-lg text-sm font-semibold text-center" style={{ background: '#F0FDF9', color: '#00D4AA', border: '1px solid #00D4AA' }}>
                    Plano atual
                  </div>
                ) : (
                  <div className="w-full py-2.5 rounded-lg text-sm font-semibold text-center" style={{ background: '#F1F3F5', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                    Em breve
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#9CA3AF' }}>
          Os créditos são flexíveis — podes usá-los em vídeos Standard, Pro, Antes/Depois ou Vídeo→Vídeo. Cada modo consome créditos diferentes consoante a duração e qualidade.
        </p>

        {/* Credit packs — só para planos pagos */}
        {isPaid && (
          <div className="mt-14">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A2E' }}>Créditos Extra</h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>Compra créditos adicionais a qualquer momento, sem fazer upgrade</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {PACKS.map(pack => (
                <div key={pack.id} className="p-5 rounded-2xl flex flex-col items-center text-center"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#F0FDF9' }}>
                    <svg className="w-5 h-5" style={{ color: '#00D4AA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: '#1A1A2E' }}>{pack.nome}</h3>
                  <p className="text-2xl font-bold mb-0.5" style={{ color: '#00D4AA' }}>{pack.creditos.toLocaleString('pt-PT')}</p>
                  <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>créditos</p>
                  <p className="text-lg font-bold mb-4" style={{ color: '#1A1A2E' }}>€{pack.preco.toFixed(2)}</p>
                  <div className="w-full py-2.5 rounded-lg text-sm font-semibold text-center" style={{ background: '#F1F3F5', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                    Em breve
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 p-5 rounded-2xl text-center" style={{ background: '#F0FDF9', border: '1px solid #00D4AA' }}>
          <p className="text-sm" style={{ color: '#374151' }}>
            💳 Os pagamentos serão integrados em breve. Para upgrades antecipados, contacta-nos em{' '}
            <span className="font-semibold" style={{ color: '#00D4AA' }}>suporte@imorender.pt</span>
          </p>
        </div>
      </div>
    </div>
  )
}

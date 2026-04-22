import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLANO_WAIT } from '@/lib/creditos'
import PlanosClient from './PlanosClient'

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
    id: 'starter', nome: 'Starter', preco: 20.99, creditos: 1000, popular: false,
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
    id: 'team', nome: 'Team', preco: 59.99, creditos: 3200, popular: true,
    target: 'Para equipas de até 15 consultores',
    wait: PLANO_WAIT.team,
    watermark: false,
    features: [
      '3.200 créditos/mês',
      '~32 vídeos Pro de 10s/mês',
      'Todos os modos de geração',
      'Tempo de espera até 2 min',
      'Sem marca de água',
      'Compra de créditos extra',
      'Suporte prioritário',
    ],
  },
  {
    id: 'agency', nome: 'Agency', preco: 179.99, creditos: 12000, popular: false,
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

        <PlanosClient planos={PLANOS} packs={PACKS} planoAtual={planoAtual} isPaid={isPaid} />
      </div>
    </div>
  )
}

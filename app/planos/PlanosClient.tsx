'use client'

import { useState, useEffect } from 'react'

type Plano = {
  id: string
  nome: string
  preco: number
  creditos: number
  popular: boolean
  target: string
  wait: string
  watermark: boolean
  features: string[]
}

type Pack = {
  id: string
  nome: string
  creditos: number
  preco: number
}

export default function PlanosClient({
  planos,
  packs,
  planoAtual,
  isPaid,
}: {
  planos: Plano[]
  packs: Pack[]
  planoAtual: string
  isPaid: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [canceled, setCanceled] = useState(false)

  useEffect(() => {
    setCanceled(new URLSearchParams(window.location.search).get('canceled') === 'true')
  }, [])

  async function handleCheckout(planoId: string) {
    setLoading(planoId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erro ao iniciar checkout. Tenta novamente.')
        setLoading(null)
      }
    } catch {
      alert('Erro ao iniciar checkout. Tenta novamente.')
      setLoading(null)
    }
  }

  return (
    <>
      {canceled && (
        <div className="mb-6 p-4 rounded-xl text-center text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
          O pagamento foi cancelado. Podes tentar novamente quando quiseres.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
        {planos.map(plano => {
          const isAtual = plano.id === planoAtual
          const isLoadingThis = loading === plano.id
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
              ) : plano.id === 'free' ? (
                <div className="w-full py-2.5 rounded-lg text-sm font-semibold text-center" style={{ background: '#F1F3F5', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                  Plano gratuito
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(plano.id)}
                  disabled={!!loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: plano.popular ? '#00D4AA' : '#1A1A2E', color: '#FFFFFF' }}>
                  {isLoadingThis ? 'A processar...' : 'Escolher plano →'}
                </button>
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
            {packs.map(pack => (
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
          Pagamentos processados com segurança pelo Stripe. Cancela ou gere a tua subscrição a qualquer momento.
        </p>
      </div>
    </>
  )
}

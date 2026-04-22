'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PerfilActions({ isPaid, isAgency }: { isPaid: boolean; isAgency: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erro ao abrir portal de subscrição.')
        setLoading(false)
      }
    } catch {
      alert('Erro ao abrir portal de subscrição.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 pt-4 flex flex-col sm:flex-row gap-3" style={{ borderTop: '1px solid #E5E7EB' }}>
      {!isAgency && (
        <Link href="/planos"
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center transition-all hover:opacity-90"
          style={{ background: '#00D4AA', color: '#FFFFFF' }}>
          Fazer upgrade →
        </Link>
      )}
      {isPaid && (
        <>
          <Link href="/planos"
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center"
            style={{ background: '#F1F3F5', color: '#374151', border: '1px solid #E5E7EB' }}>
            Comprar créditos extra
          </Link>
          <button
            onClick={handlePortal}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1A1A2E', color: '#FFFFFF' }}>
            {loading ? 'A abrir...' : 'Gerir subscrição'}
          </button>
        </>
      )}
    </div>
  )
}

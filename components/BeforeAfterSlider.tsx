'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const BEFORE_URL = 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200'
const AFTER_URL  = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200'

export default function BeforeAfterSlider() {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const calcPos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPos(Math.round((x / rect.width) * 100))
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (dragging.current) calcPos(e.clientX) }
    const onMouseUp   = () => { dragging.current = false }
    const container   = containerRef.current

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return
      e.preventDefault()
      calcPos(e.touches[0].clientX)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    window.addEventListener('touchend',  onMouseUp)
    container?.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      window.removeEventListener('touchend',  onMouseUp)
      container?.removeEventListener('touchmove', onTouchMove)
    }
  }, [calcPos])

  return (
    <section className="py-24 px-4" style={{ background: '#F1F3F5' }}>
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>
            Vê a diferença em tempo real
          </h2>
          <p className="text-base" style={{ color: '#6B7280' }}>
            Arrasta para descobrir o potencial de qualquer espaço
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl"
          style={{
            aspectRatio: '16/9',
            cursor: 'ew-resize',
            touchAction: 'none',
            userSelect: 'none',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}
          onMouseDown={e => { dragging.current = true; calcPos(e.clientX) }}
          onTouchStart={e => { dragging.current = true; calcPos(e.touches[0].clientX) }}
        >
          {/* Imagem DEPOIS (fundo completo) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AFTER_URL}
            alt="Depois"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ pointerEvents: 'none' }}
          />

          {/* Imagem ANTES (cortada à esquerda do slider) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BEFORE_URL}
            alt="Antes"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Linha divisória */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${pos}%`,
              transform: 'translateX(-50%)',
              width: 2,
              background: '#FFFFFF',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />

          {/* Círculo com ícone ↔ */}
          <div
            className="absolute top-1/2 flex items-center justify-center rounded-full"
            style={{
              left: `${pos}%`,
              transform: 'translate(-50%, -50%)',
              width: 42,
              height: 42,
              background: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              zIndex: 11,
              pointerEvents: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18L3 12l6-6" />
              <path d="M15 6l6 6-6 6" />
            </svg>
          </div>

          {/* Label ANTES */}
          <div
            className="absolute top-3 left-3"
            style={{ zIndex: 12, opacity: pos > 10 ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}
          >
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}>
              Antes
            </span>
          </div>

          {/* Label DEPOIS */}
          <div
            className="absolute top-3 right-3"
            style={{ zIndex: 12, opacity: pos < 90 ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}
          >
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}>
              Depois
            </span>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#9CA3AF' }}>
          Exemplo gerado com ImoRender Studio IA
        </p>
      </div>
    </section>
  )
}

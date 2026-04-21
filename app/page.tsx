'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, type Variants, type Transition } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } as Transition,
  }),
}

const PLANOS = [
  { id: 'free',       nome: 'Free',       preco: 0,     creditos: 5,    qualidade: 'STD', popular: false, features: ['5 créditos/mês', 'Modo Standard', 'Vídeos até 5s', 'Download em MP4'] },
  { id: 'starter',    nome: 'Starter',    preco: 19.99, creditos: 120,  qualidade: 'STD', popular: false, features: ['120 créditos/mês', 'Modos Standard e Pro', 'Vídeos até 10s', 'Download em MP4', 'Suporte por email'] },
  { id: 'pro',        nome: 'Pro',        preco: 39.99, creditos: 300,  qualidade: 'PRO', popular: false, features: ['300 créditos/mês', 'Todos os modos', 'Qualidade PRO', 'Vídeos até 20s', 'Download em MP4', 'Suporte prioritário'] },
  { id: 'agency',     nome: 'Agency',     preco: 79.99, creditos: 700,  qualidade: 'PRO', popular: false, features: ['700 créditos/mês', 'Todos os modos', 'Qualidade PRO', 'Vídeos até 30s', 'Download em MP4', 'Suporte dedicado'] },
  { id: 'enterprise', nome: 'Enterprise', preco: 299,   creditos: 3500, qualidade: 'PRO', popular: true,  features: ['3500 créditos/mês', 'Todos os modos', 'Qualidade PRO', 'Vídeos até 30s', 'Download em MP4', 'Gestor de conta dedicado'] },
]

const FAQS = [
  { q: 'O que é um crédito?', r: 'Os créditos são consumidos consoante o modo e duração do vídeo. No modo Standard custa 1 cr/s, Pro 2 cr/s, Antes/Depois 1,6 cr/s e Vídeo→Vídeo 1,2 cr/s.' },
  { q: 'Que tipos de imagens posso usar?', r: 'Aceitamos JPG, PNG e WEBP com tamanho máximo de 10MB. Funciona com fotos de imóveis, terrenos, interiores e exteriores.' },
  { q: 'Os créditos renovam mensalmente?', r: 'Sim, os créditos renovam automaticamente no início de cada mês de faturação.' },
  { q: 'Posso cancelar a qualquer momento?', r: 'Sim, podes cancelar ou mudar de plano a qualquer momento, sem compromisso.' },
  { q: 'Quanto tempo demora a gerar um vídeo?', r: 'Normalmente entre 1 a 3 minutos dependendo da duração e qualidade escolhida.' },
  { q: 'Posso usar os vídeos comercialmente?', r: 'Sim, todos os vídeos gerados são teus e podes usá-los livremente nas tuas campanhas imobiliárias.' },
]

export default function LandingPage() {
  const [anual, setAnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ background: '#F8F9FA', color: '#1A1A2E', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)' }}>
              <span className="font-bold text-sm text-white">IR</span>
            </div>
            <span className="font-bold text-lg" style={{ color: '#1A1A2E' }}>ImoRender</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium transition-colors" style={{ color: '#6B7280' }}>Entrar</Link>
            <Link href="/auth/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-all"
              style={{ background: '#00D4AA', color: '#FFFFFF' }}>
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(0,212,170,0.08), transparent)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: '#F0FDF9', border: '1px solid #00D4AA', color: '#00B894' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00D4AA' }} />
            Criado para o mercado imobiliário português
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#1A1A2E' }}>
            Transforma qualquer imóvel<br />
            <span style={{ color: '#00D4AA' }}>num vídeo profissional</span><br />
            em segundos
          </motion.h1>

          <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="text-lg max-w-2xl mx-auto mb-10" style={{ color: '#6B7280' }}>
            A ferramenta de IA criada especificamente para consultores imobiliários portugueses.
            Carrega uma foto, descreve em português o que queres ver e deixa a IA fazer o resto.
          </motion.p>

          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 hover:scale-105 transition-all"
              style={{ background: '#00D4AA', color: '#FFFFFF' }}>
              Experimentar Grátis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#374151' }}>
              Ver como funciona
            </a>
          </motion.div>

          <motion.p initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="mt-4 text-sm" style={{ color: '#9CA3AF' }}>
            5 créditos grátis · Sem cartão de crédito
          </motion.p>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-24 px-4" style={{ background: '#F1F3F5' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Como funciona</h2>
            <p className="text-lg" style={{ color: '#6B7280' }}>Três passos simples para criar o teu vídeo profissional</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', icon: '📸', titulo: 'Carrega uma foto', desc: 'Faz upload de qualquer foto de imóvel, terreno, interior ou exterior. JPG, PNG ou WEBP.' },
              { n: '02', icon: '✍️', titulo: 'Descreve o resultado', desc: 'Escreve em português o que queres ver. Ex: "Quero ver este terreno com uma moradia moderna construída".' },
              { n: '03', icon: '⬇️', titulo: 'Faz download do vídeo', desc: 'A IA gera um vídeo profissional em 1 a 3 minutos. Faz download e usa nas tuas campanhas.' },
            ].map((passo, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="text-4xl mb-4">{passo.icon}</div>
                <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#00D4AA' }}>{passo.n}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A2E' }}>{passo.titulo}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{passo.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Modos */}
      <section className="py-24 px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>4 modos de geração</h2>
            <p className="text-lg" style={{ color: '#6B7280' }}>Para cada necessidade do teu negócio imobiliário</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🖼️', nome: 'Standard', desc: 'Uma foto, movimento natural. Ideal para imóveis e terrenos.', cr: '1 cr/s' },
              { icon: '⭐', nome: 'Pro', desc: 'Uma foto, qualidade cinematográfica. Resultados premium.', cr: '2 cr/s' },
              { icon: '🔄', nome: 'Antes/Depois', desc: 'Duas fotos. O vídeo transforma a primeira na segunda.', cr: '1,6 cr/s' },
              { icon: '🎬', nome: 'Vídeo→Vídeo', desc: 'Transforma um vídeo existente com IA.', cr: '1,2 cr/s' },
            ].map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl"
                style={{ background: '#F8F9FA', border: '1px solid #E5E7EB' }}>
                <div className="text-3xl mb-3">{m.icon}</div>
                <h3 className="font-bold mb-1" style={{ color: '#1A1A2E' }}>{m.nome}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>{m.desc}</p>
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#F0FDF9', color: '#00B894' }}>{m.cr}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 px-4" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Planos e Preços</h2>
            <p className="text-lg mb-8" style={{ color: '#6B7280' }}>Escolhe o plano certo para o teu negócio</p>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <button onClick={() => setAnual(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={!anual ? { background: '#00D4AA', color: '#FFFFFF' } : { color: '#6B7280' }}>
                Mensal
              </button>
              <button onClick={() => setAnual(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={anual ? { background: '#00D4AA', color: '#FFFFFF' } : { color: '#6B7280' }}>
                Anual <span className="text-xs opacity-75">-20%</span>
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="relative p-5 rounded-2xl flex flex-col"
                style={{
                  background: '#FFFFFF',
                  border: plano.popular ? '2px solid #00D4AA' : '1px solid #E5E7EB',
                  boxShadow: plano.popular ? '0 8px 32px rgba(0,212,170,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                {plano.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: '#00D4AA', color: '#FFFFFF' }}>
                    Mais Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-1" style={{ color: '#1A1A2E' }}>{plano.nome}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold" style={{ color: '#1A1A2E' }}>
                      €{anual
                        ? (plano.preco * 0.8 % 1 === 0 ? (plano.preco * 0.8).toFixed(0) : (plano.preco * 0.8).toFixed(2))
                        : (plano.preco % 1 === 0 ? plano.preco : plano.preco.toFixed(2))}
                    </span>
                    <span className="text-sm mb-1" style={{ color: '#9CA3AF' }}>/mês</span>
                  </div>
                  <div className="text-sm mt-1 font-semibold" style={{ color: '#00D4AA' }}>{plano.creditos} créditos · {plano.qualidade}</div>
                </div>
                <ul className="flex-1 space-y-2 mb-5">
                  {plano.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: '#374151' }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#00D4AA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register"
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-all hover:opacity-90"
                  style={plano.popular
                    ? { background: '#00D4AA', color: '#FFFFFF' }
                    : { background: '#F1F3F5', color: '#374151', border: '1px solid #E5E7EB' }}>
                  {plano.preco === 0 ? 'Começar Grátis' : 'Escolher plano'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4" style={{ background: '#F8F9FA' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="rounded-xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <button className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>{faq.q}</span>
                  <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                    {faq.r}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl" style={{ background: 'linear-gradient(135deg, #F0FDF9, #FFFFFF)', border: '1px solid #00D4AA' }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Pronto para começar?</h2>
            <p className="mb-8" style={{ color: '#6B7280' }}>Cria a tua conta grátis hoje e recebe 5 créditos para experimentar.</p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all"
              style={{ background: '#00D4AA', color: '#FFFFFF' }}>
              Experimentar Grátis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4" style={{ background: '#1A1A2E' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#00D4AA' }}>
              <span className="font-bold text-xs text-white">IR</span>
            </div>
            <span className="text-sm font-semibold text-white">ImoRender</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>© 2026 ImoRender. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Entrar</Link>
            <Link href="/auth/register" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Registar</Link>
            <a href="#planos" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Planos</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

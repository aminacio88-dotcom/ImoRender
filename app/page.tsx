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
  { id: 'pro',        nome: 'Pro',        preco: 39.99, creditos: 300,  qualidade: 'PRO', popular: true,  features: ['300 créditos/mês', 'Todos os modos', 'Qualidade PRO', 'Vídeos até 20s', 'Download em MP4', 'Suporte prioritário'] },
  { id: 'agency',     nome: 'Agency',     preco: 79.99, creditos: 700,  qualidade: 'PRO', popular: false, features: ['700 créditos/mês', 'Todos os modos', 'Qualidade PRO', 'Vídeos até 30s', 'Download em MP4', 'Suporte dedicado'] },
  { id: 'enterprise', nome: 'Enterprise', preco: 299,   creditos: 3500, qualidade: 'PRO', popular: false, features: ['3500 créditos/mês', 'Todos os modos', 'Qualidade PRO', 'Vídeos até 30s', 'Download em MP4', 'Gestor de conta dedicado'] },
]

const FAQS = [
  { q: 'O que é um crédito?', r: 'Os créditos são consumidos consoante o modo e duração do vídeo. No modo Standard custa 1 cr/s, Pro 2 cr/s, Antes/Depois 1.6 cr/s e Vídeo→Vídeo 1.2 cr/s.' },
  { q: 'Que tipos de imagens posso usar?', r: 'Aceitamos JPG, PNG e WEBP com tamanho máximo de 10MB. Funciona com fotos de imóveis, terrenos, interiores e exteriores.' },
  { q: 'Os créditos renovam mensalmente?', r: 'Sim, os créditos renovam automaticamente no início de cada mês de faturação.' },
  { q: 'Posso cancelar a qualquer momento?', r: 'Sim, podes cancelar ou mudar de plano a qualquer momento, sem compromisso.' },
  { q: 'Quanto tempo demora a gerar um vídeo?', r: 'Normalmente entre 30 a 90 segundos dependendo da duração e qualidade escolhida.' },
  { q: 'Posso usar os vídeos comercialmente?', r: 'Sim, todos os vídeos gerados são teus e podes usá-los livremente nas tuas campanhas imobiliárias.' },
]

export default function LandingPage() {
  const [anual, setAnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ background: '#0a0a0f', color: '#fff', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)' }}>
              <span className="font-bold text-sm" style={{ color: '#000' }}>IR</span>
            </div>
            <span className="font-semibold text-lg">ImoRender</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors">Entrar</Link>
            <Link href="/auth/register" className="text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-all" style={{ background: '#00d4aa', color: '#000' }}>
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,170,0.12), transparent)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', color: '#00d4aa' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00d4aa' }} />
            Criado para o mercado imobiliário português
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Transforma qualquer imóvel<br />
            <span style={{ color: '#00d4aa' }}>num vídeo profissional</span><br />
            em segundos
          </motion.h1>

          <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
            A ferramenta de IA criada especificamente para consultores imobiliários portugueses.
            Carrega uma foto, descreve em português o que queres ver e deixa a IA fazer o resto.
          </motion.p>

          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 hover:scale-105 transition-all"
              style={{ background: '#00d4aa', color: '#000' }}>
              Experimentar Grátis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/10 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
              Ver como funciona
            </a>
          </motion.div>

          <motion.p initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            5 créditos grátis · Sem cartão de crédito
          </motion.p>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Como funciona</h2>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>Três passos simples para criar o teu vídeo profissional</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', icon: '📸', titulo: 'Carrega uma foto', desc: 'Faz upload de qualquer foto de imóvel, terreno, interior ou exterior. JPG, PNG ou WEBP.' },
              { n: '02', icon: '✍️', titulo: 'Descreve o resultado', desc: 'Escreve em português o que queres ver. Ex: "Quero ver este terreno com uma moradia moderna construída".' },
              { n: '03', icon: '⬇️', titulo: 'Faz download do vídeo', desc: 'A IA gera um vídeo profissional em segundos. Faz download e usa nas tuas campanhas.' },
            ].map((passo, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-4xl mb-4">{passo.icon}</div>
                <div className="text-xs font-mono mb-2" style={{ color: '#00d4aa' }}>{passo.n}</div>
                <h3 className="text-lg font-semibold mb-2">{passo.titulo}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{passo.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 px-4" style={{ background: 'rgba(26,26,46,0.3)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planos e Preços</h2>
            <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Escolhe o plano certo para o teu negócio</p>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl" style={{ background: '#1a1a2e' }}>
              <button onClick={() => setAnual(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={!anual ? { background: '#00d4aa', color: '#000' } : { color: 'rgba(255,255,255,0.6)' }}>
                Mensal
              </button>
              <button onClick={() => setAnual(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={anual ? { background: '#00d4aa', color: '#000' } : { color: 'rgba(255,255,255,0.6)' }}>
                Anual <span className="text-xs opacity-75">-20%</span>
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative p-5 rounded-2xl flex flex-col"
                style={{
                  background: plano.popular ? 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,184,148,0.08))' : '#1a1a2e',
                  border: plano.popular ? '1px solid rgba(0,212,170,0.4)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                {plano.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#00d4aa', color: '#000' }}>
                    Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">{plano.nome}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">€{anual ? (plano.preco * 0.8 % 1 === 0 ? (plano.preco * 0.8).toFixed(0) : (plano.preco * 0.8).toFixed(2)) : (plano.preco % 1 === 0 ? plano.preco : plano.preco.toFixed(2))}</span>
                    <span className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>/mês</span>
                  </div>
                  <div className="text-sm mt-1" style={{ color: '#00d4aa' }}>{plano.creditos} créditos · {plano.qualidade}</div>
                </div>
                <ul className="flex-1 space-y-2 mb-5">
                  {plano.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#00d4aa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register"
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-center transition-all hover:opacity-90"
                  style={plano.popular ? { background: '#00d4aa', color: '#000' } : { background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                  {plano.preco === 0 ? 'Começar Grátis' : 'Escolher plano'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="rounded-xl overflow-hidden"
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-medium text-sm">{faq.q}</span>
                  <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {faq.r}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(26,26,46,0.8))', border: '1px solid rgba(0,212,170,0.2)' }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pronto para começar?</h2>
            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>Cria a tua conta grátis hoje e recebe 5 créditos para experimentar.</p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all"
              style={{ background: '#00d4aa', color: '#000' }}>
              Experimentar Grátis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#00d4aa' }}>
              <span className="font-bold text-xs" style={{ color: '#000' }}>IR</span>
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>ImoRender</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 ImoRender. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="text-xs hover:text-white/70 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Entrar</Link>
            <Link href="/auth/register" className="text-xs hover:text-white/70 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Registar</Link>
            <a href="#planos" className="text-xs hover:text-white/70 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Planos</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

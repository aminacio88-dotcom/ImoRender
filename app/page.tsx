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
  {
    id: 'free', nome: 'Free', preco: 0, creditos: 50, popular: false,
    descricao: 'Experimenta sem compromisso',
    wait: 'até 15 min',
    watermark: true,
    features: [
      '50 créditos (1 vídeo de teste)',
      'Modo Standard apenas',
      'Tempo de espera até 15 min',
      'Marca de água ImoRender',
    ],
  },
  {
    id: 'starter', nome: 'Starter', preco: 20.99, creditos: 1000, popular: false,
    descricao: 'Ideal para o consultor individual',
    wait: 'até 5 min',
    watermark: false,
    features: [
      '1.000 créditos/mês',
      '~10 vídeos Pro de 10s/mês',
      'Tempo de espera até 5 min',
      'Sem marca de água',
      'Compra de créditos extra',
    ],
  },
  {
    id: 'team', nome: 'Team', preco: 59.99, creditos: 3200, popular: true,
    descricao: 'Para equipas de até 15 consultores',
    wait: 'até 2 min',
    watermark: false,
    features: [
      '4.000 créditos/mês',
      '~32 vídeos Pro de 10s/mês',
      'Tempo de espera até 2 min',
      'Sem marca de água',
      'Compra de créditos extra',
    ],
  },
  {
    id: 'agency', nome: 'Agency', preco: 179.99, creditos: 12000, popular: false,
    descricao: 'Para agências com 15 a 50 consultores',
    wait: 'prioritário',
    watermark: false,
    features: [
      '12.000 créditos/mês',
      '~120 vídeos Pro de 10s/mês',
      'Processamento prioritário',
      'Sem marca de água',
      'Compra de créditos extra',
      'Suporte dedicado',
    ],
  },
]

const FAQS = [
  { q: 'Preciso de saber usar ferramentas de IA?', r: 'Não. Escreves em português o que queres ver e o ImoRender trata do resto. É tão simples como enviar uma mensagem.' },
  { q: 'Que tipo de ficheiros posso carregar?', r: 'Aceitamos imagens JPG, PNG e WEBP até 10MB, e vídeos MP4 e MOV até 50MB.' },
  { q: 'Os vídeos ficam com marca de água?', r: 'Apenas no plano gratuito. Todos os planos pagos geram vídeos sem marca de água.' },
  { q: 'Posso cancelar a qualquer momento?', r: 'Sim, sem penalizações nem contratos. Cancelas quando quiseres.' },
  { q: 'O que são créditos e como funcionam?', r: 'Créditos são a moeda do ImoRender. Cada vídeo consome créditos consoante a duração e a qualidade escolhida. Podes ver sempre quantos créditos vais gastar antes de gerar.' },
  { q: 'Posso comprar créditos extra?', r: 'Sim, em todos os planos pagos podes comprar créditos adicionais a qualquer momento sem fazer upgrade de plano.' },
  { q: 'Qual a diferença entre Standard e Pro?', r: 'O modo Pro usa um modelo de IA mais avançado, gerando vídeos com maior detalhe arquitetónico, movimento de câmara mais cinematográfico e qualidade visual superior. Consome o dobro dos créditos.' },
]

export default function LandingPage() {
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
          <div className="hidden md:flex items-center gap-6">
            <a href="#funcionalidades" className="text-sm font-medium transition-colors" style={{ color: '#6B7280' }}>Funcionalidades</a>
            <a href="#planos" className="text-sm font-medium transition-colors" style={{ color: '#6B7280' }}>Planos</a>
            <a href="#faq" className="text-sm font-medium transition-colors" style={{ color: '#6B7280' }}>FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:block text-sm font-medium transition-colors" style={{ color: '#6B7280' }}>Entrar</Link>
            <Link href="/auth/register"
              className="text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-all"
              style={{ background: '#00D4AA', color: '#FFFFFF' }}>
              Experimentar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(0,212,170,0.07), transparent)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: '#F0FDF9', border: '1px solid #00D4AA', color: '#00B894' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00D4AA' }} />
            Criado especificamente para o imobiliário português
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#1A1A2E' }}>
            A única plataforma de vídeo IA<br />
            <span style={{ color: '#00D4AA' }}>criada especificamente</span><br />
            para imobiliário português
          </motion.h1>

          <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="text-lg max-w-2xl mx-auto mb-8" style={{ color: '#6B7280', lineHeight: '1.7' }}>
            Enquanto ferramentas genéricas geram vídeos comuns, o ImoRender foi treinado para entender imóveis, terrenos e transformações arquitetónicas — gerando vídeos que vendem.
          </motion.p>

          <motion.ul initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-10 text-sm">
            {[
              'Prompts otimizados automaticamente para imobiliário',
              'Resultados até 3x mais realistas que ferramentas genéricas',
              'Sem curva de aprendizagem — em português, para consultores',
            ].map((b, i) => (
              <li key={i} className="flex items-center gap-2" style={{ color: '#374151' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: '#00D4AA' }}>✓</span>
                {b}
              </li>
            ))}
          </motion.ul>

          <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 hover:scale-105 transition-all"
              style={{ background: '#00D4AA', color: '#FFFFFF' }}>
              Gerar o meu primeiro vídeo grátis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#374151' }}>
              Ver exemplos
            </a>
          </motion.div>

          <motion.p initial="hidden" animate="visible" custom={5} variants={fadeUp}
            className="mt-4 text-sm" style={{ color: '#9CA3AF' }}>
            50 créditos grátis · Sem cartão de crédito · Cancela quando quiseres
          </motion.p>
        </div>
      </section>

      {/* Porquê o ImoRender */}
      <section id="funcionalidades" className="py-24 px-4" style={{ background: '#F1F3F5' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>
              Não é mais uma ferramenta de IA.<br />É a ferramenta certa para imobiliário.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: '🧠',
                titulo: 'IA treinada para imobiliário',
                texto: 'O ImoRender não usa prompts genéricos. A nossa IA interpreta a tua descrição em português e gera automaticamente instruções técnicas otimizadas para vídeos imobiliários — arquitetura, iluminação, paisagismo e movimento de câmara cinematográfico.',
              },
              {
                icon: '📈',
                titulo: 'Vídeos que aumentam a conversão',
                texto: 'Imóveis com vídeo profissional recebem até 403% mais contactos do que anúncios só com fotos. O ImoRender permite que qualquer consultor produza vídeos de nível profissional em segundos, sem equipamento e sem custos de produção.',
              },
              {
                icon: '🇵🇹',
                titulo: '100% em português, 100% focado no teu mercado',
                texto: 'Interface, suporte e otimizações pensadas para o mercado imobiliário português. Descreve o que queres em português simples — nós tratamos do resto.',
              },
              {
                icon: '✨',
                titulo: 'Transforma o potencial em realidade visual',
                texto: 'Mostra ao cliente o que o imóvel pode ser — não apenas o que é. Terrenos transformados em moradias, espaços renovados, exteriores paisagísticos. Vende o sonho antes da obra começar.',
              },
            ].map((card, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="p-6 rounded-2xl"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1A1A2E' }}>{card.titulo}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{card.texto}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-24 px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>De foto a vídeo profissional em menos de 5 minutos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', icon: '📸', titulo: 'Carrega a tua foto', desc: 'Faz upload de uma foto do imóvel, terreno ou espaço. Aceitamos imagens de qualquer qualidade.' },
              { n: '02', icon: '✍️', titulo: 'Descreve o que queres', desc: 'Escreve simplesmente o que pretendes — "quero ver este terreno com uma moradia moderna e jardim". A nossa IA otimiza automaticamente o pedido.' },
              { n: '03', icon: '⬇️', titulo: 'Recebe o teu vídeo', desc: 'Em minutos tens um vídeo cinematográfico pronto a publicar no portal, nas redes sociais ou a partilhar diretamente com o cliente.' },
            ].map((passo, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl text-center"
                style={{ background: '#F8F9FA', border: '1px solid #E5E7EB' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: '#F0FDF9' }}>
                  {passo.icon}
                </div>
                <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#00D4AA' }}>{passo.n}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A2E' }}>{passo.titulo}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{passo.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* O que podes criar */}
      <section className="py-24 px-4" style={{ background: '#F1F3F5' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Para cada desafio imobiliário, uma solução visual</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🏗️', titulo: 'Terrenos e lotes',          desc: 'Mostra o potencial construtivo de qualquer terreno. O cliente vê a moradia antes de existir.' },
              { icon: '🔨', titulo: 'Remodelações e renovações', desc: 'Transforma espaços degradados em imóveis renovados. Vende a visão, não o estado atual.' },
              { icon: '🏠', titulo: 'Imóveis em construção',     desc: 'Dá vida a plantas e projetos. Apresenta o imóvel finalizado antes da obra terminar.' },
              { icon: '🔄', titulo: 'Before & After',             desc: 'O formato mais poderoso para mostrar transformações. Duas fotos, um vídeo impactante.' },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: '#1A1A2E' }}>{item.titulo}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#1A1A2E' }}>Escolhe o plano certo para o teu negócio</h2>
            <p className="text-base" style={{ color: '#6B7280' }}>Sem contratos. Cancela quando quiseres. Começa grátis.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANOS.map((plano, i) => (
              <motion.div key={plano.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="relative p-6 rounded-2xl flex flex-col"
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
                <div className="mb-5">
                  <h3 className="font-bold text-xl mb-0.5" style={{ color: '#1A1A2E' }}>{plano.nome}</h3>
                  <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{plano.descricao}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold" style={{ color: '#1A1A2E' }}>
                      €{plano.preco % 1 === 0 ? plano.preco : plano.preco.toFixed(2)}
                    </span>
                    <span className="text-sm mb-1" style={{ color: '#9CA3AF' }}>/mês</span>
                  </div>
                  <div className="text-sm mt-1.5 font-bold" style={{ color: '#00D4AA' }}>{plano.creditos.toLocaleString('pt-PT')} créditos</div>
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
                <Link href="/auth/register"
                  className="w-full py-3 rounded-lg text-sm font-bold text-center transition-all hover:opacity-90"
                  style={plano.popular
                    ? { background: '#00D4AA', color: '#FFFFFF' }
                    : { background: '#F1F3F5', color: '#374151', border: '1px solid #E5E7EB' }}>
                  {plano.preco === 0 ? 'Começar Grátis' : 'Escolher plano'}
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm mt-8" style={{ color: '#9CA3AF' }}>
            Os créditos são flexíveis — podes usá-los em vídeos Standard, Pro, Antes/Depois ou Vídeo→Vídeo.<br />Cada modo consome créditos diferentes consoante a duração e qualidade.
          </p>
        </div>
      </section>

      {/* Porquê confiar */}
      <section className="py-24 px-4" style={{ background: '#F8F9FA' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Tecnologia de ponta ao serviço do imobiliário</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', titulo: 'Powered by Kling AI', desc: 'Utilizamos o modelo de geração de vídeo número 1 em qualidade no mundo em 2026, combinado com inteligência específica para imobiliário.' },
              { icon: '⚡', titulo: 'Otimização automática com IA', desc: 'O teu pedido em português é analisado e otimizado por inteligência artificial antes de gerar o vídeo — garantindo resultados profissionais sem esforço técnico.' },
              { icon: '🔒', titulo: 'Seguro e privado', desc: 'Os teus imóveis e dados são privados. Nunca partilhamos ou utilizamos as tuas imagens para outros fins.' },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="p-6 rounded-2xl text-center"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg mb-3" style={{ color: '#1A1A2E' }}>{item.titulo}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="rounded-xl overflow-hidden"
                style={{ background: '#F8F9FA', border: '1px solid #E5E7EB' }}>
                <button className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>{faq.q}</span>
                  <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: '#6B7280' }}>{faq.r}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4" style={{ background: '#F8F9FA' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl" style={{ background: 'linear-gradient(135deg, #F0FDF9, #FFFFFF)', border: '1px solid #00D4AA' }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>Pronto para começar?</h2>
            <p className="mb-8 text-lg" style={{ color: '#6B7280' }}>Cria a tua conta grátis hoje e recebe 50 créditos para experimentar.</p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all"
              style={{ background: '#00D4AA', color: '#FFFFFF' }}>
              Gerar o meu primeiro vídeo grátis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <p className="mt-4 text-sm" style={{ color: '#9CA3AF' }}>Sem cartão de crédito · Cancela quando quiseres</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4" style={{ background: '#1A1A2E' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#00D4AA' }}>
                  <span className="font-bold text-xs text-white">IR</span>
                </div>
                <span className="font-bold text-lg text-white">ImoRender</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>A plataforma de vídeo IA para o imobiliário português</p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <a href="#planos" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Planos</a>
              <a href="#funcionalidades" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Funcionalidades</a>
              <a href="#faq" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>FAQ</a>
              <a href="mailto:suporte@imorender.pt" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Contacto</a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 ImoRender. Todos os direitos reservados.</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>suporte@imorender.pt</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

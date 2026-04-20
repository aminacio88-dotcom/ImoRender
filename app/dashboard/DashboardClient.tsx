'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Video } from '@/lib/types'

interface Props {
  profile: Profile | null
  videos: Video[]
}

export default function DashboardClient({ profile: initialProfile, videos: initialVideos }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState(initialProfile)
  const [videos, setVideos] = useState(initialVideos)
  const [dragOver, setDragOver] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [duracao, setDuracao] = useState(5)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pollingId, setPollingId] = useState<string | null>(null)

  // Polling para status de vídeo em processamento
  useEffect(() => {
    if (!pollingId) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/video-status/${pollingId}`)
      const data = await res.json()
      if (data.status === 'completed' || data.status === 'failed') {
        setPollingId(null)
        setLoading(false)
        if (data.status === 'failed') {
          setError('Ocorreu um erro na geração do vídeo. Os teus créditos foram devolvidos.')
        }
        // Refresh
        router.refresh()
        const { data: newVideos } = await supabase.from('videos').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(20)
        if (newVideos) setVideos(newVideos)
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile?.id).single()
        if (newProfile) setProfile(newProfile)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [pollingId, profile?.id, router, supabase])

  function handleFile(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Por favor carrega uma imagem válida (JPG, PNG ou WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem não pode ter mais de 10MB.')
      return
    }
    setError('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile || !prompt.trim()) return
    if (!profile) return

    if (profile.creditos < duracao) {
      setError(`Não tens créditos suficientes. Faz upgrade do teu plano.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1]

        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            imageMimeType: imageFile.type,
            promptPortugues: prompt,
            duracao,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Ocorreu um erro na geração do vídeo.')
          setLoading(false)
          return
        }

        if (data.videoId) {
          setPollingId(data.videoId)
          // Se já completou
          if (data.status === 'completed') {
            setPollingId(null)
            setLoading(false)
            const { data: newVideos } = await supabase.from('videos').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
            if (newVideos) setVideos(newVideos)
            const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
            if (newProfile) setProfile(newProfile)
          }
        }

        // Reset form
        setImageFile(null)
        setImagePreview(null)
        setPrompt('')
        setDuracao(5)
      }
      reader.readAsDataURL(imageFile)
    } catch {
      setError('Ocorreu um erro inesperado. Tenta novamente.')
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const creditosPct = profile ? Math.round((profile.creditos / profile.creditos_total) * 100) : 0

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
            {profile && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
                  <span className="text-xs font-medium" style={{ color: '#00d4aa' }}>{profile.creditos} créditos</span>
                </div>
                <Link href="/planos" className="text-sm hidden sm:block" style={{ color: 'rgba(255,255,255,0.6)' }}>Planos</Link>
                <Link href="/perfil" className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{profile.nome}</Link>
              </>
            )}
            <button onClick={handleLogout} className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {/* Boas vindas */}
        {profile && (
          <div className="mb-8 p-5 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold mb-1">Olá, {profile.nome}! 👋</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Plano <span className="capitalize font-medium" style={{ color: '#00d4aa' }}>{profile.plano}</span>
                </p>
              </div>
              <div className="sm:text-right">
                <div className="text-3xl font-bold" style={{ color: '#00d4aa' }}>{profile.creditos}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>créditos disponíveis</div>
                <div className="mt-2 h-1.5 rounded-full w-32 sm:ml-auto overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${creditosPct}%`, background: '#00d4aa' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário de geração */}
        <div className="mb-10 p-6 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-semibold mb-5">Gerar novo vídeo</h2>
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Upload de foto */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Foto do imóvel</label>
              <div
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${dragOver ? 'border-[#00d4aa] bg-[rgba(0,212,170,0.05)]' : 'border-white/10 hover:border-white/20'}`}
                style={{ minHeight: imagePreview ? 'auto' : '160px' }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Preview" className="w-full rounded-xl object-cover" style={{ maxHeight: '240px' }} />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                    >✕</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Arrasta uma foto ou clica para selecionar</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>JPG, PNG, WEBP · máx. 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Duração */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Duração do vídeo</label>
                <span className="text-sm font-semibold" style={{ color: '#00d4aa' }}>{duracao}s = {duracao} créditos</span>
              </div>
              <input
                type="range"
                min={1} max={20} step={1}
                value={duracao}
                onChange={e => setDuracao(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: '#00d4aa' }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span>1s</span><span>20s</span>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Descreve o que queres ver</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                required
                rows={3}
                placeholder="Ex: Quero ver este terreno limpo com uma moradia moderna construída, jardim cuidado e piscina..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#00d4aa'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            {loading && (
              <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-3" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>
                <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                A gerar o teu vídeo com IA... Pode demorar até 90 segundos.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !imageFile || !prompt.trim()}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#00d4aa', color: '#000' }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A gerar...
                </>
              ) : (
                <>Gerar Vídeo · {duracao} crédito{duracao !== 1 ? 's' : ''}</>
              )}
            </button>
          </form>
        </div>

        {/* Histórico de vídeos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Os teus vídeos</h2>
          {videos.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Ainda não geraste nenhum vídeo.<br />Usa o formulário acima para criar o teu primeiro.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video }: { video: Video }) {
  const statusColor: Record<string, string> = {
    completed: '#00d4aa',
    processing: '#f59e0b',
    pending: '#6b7280',
    failed: '#ef4444',
  }
  const statusLabel: Record<string, string> = {
    completed: 'Concluído',
    processing: 'A processar',
    pending: 'Na fila',
    failed: 'Erro',
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="aspect-video flex items-center justify-center" style={{ background: '#16213e' }}>
        {video.status === 'completed' && video.video_url ? (
          <video src={video.video_url} controls className="w-full h-full object-cover" />
        ) : video.status === 'processing' || video.status === 'pending' ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 animate-spin" style={{ color: '#00d4aa' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>A processar...</span>
          </div>
        ) : (
          <div className="text-3xl">❌</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{video.prompt_original}</p>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium" style={{ background: `${statusColor[video.status]}20`, color: statusColor[video.status] }}>
            {statusLabel[video.status]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {video.duracao}s · {new Date(video.created_at).toLocaleDateString('pt-PT')}
          </span>
          {video.status === 'completed' && video.video_url && (
            <a
              href={video.video_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa' }}
            >
              ⬇ Download
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

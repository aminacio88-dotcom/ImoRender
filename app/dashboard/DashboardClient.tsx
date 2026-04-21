'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularCreditos, MODO_LABELS, MODO_BADGE_COLORS, MODO_BADGE_TEXT } from '@/lib/creditos'
import type { Profile, Video, Modo, AspectRatio } from '@/lib/types'

interface Props { profile: Profile | null; videos: Video[] }

const MODOS = [
  { id: 'standard' as Modo,     icon: '🖼️', nome: 'Standard',       desc: 'Uma foto, movimento natural. Ideal para imóveis e terrenos.' },
  { id: 'pro' as Modo,          icon: '⭐', nome: 'Pro',             desc: 'Uma foto, qualidade cinematográfica. Resultados premium.' },
  { id: 'antes_depois' as Modo, icon: '🔄', nome: 'Antes/Depois',    desc: 'Duas fotos. O vídeo transforma a primeira na segunda.' },
  { id: 'video_video' as Modo,  icon: '🎬', nome: 'Vídeo→Vídeo',    desc: 'Transforma um vídeo existente com IA.' },
]

const FORMATOS: { id: AspectRatio; label: string; desc: string; w: number; h: number }[] = [
  { id: '16:9', label: '16:9', desc: 'Horizontal — Para site e apresentações', w: 16, h: 9 },
  { id: '9:16', label: '9:16', desc: 'Vertical — Para Instagram Stories e Reels', w: 9, h: 16 },
  { id: '1:1',  label: '1:1',  desc: 'Quadrado — Para feed Instagram', w: 1, h: 1 },
]

const PLACEHOLDERS: Record<Modo, string> = {
  standard:     'Ex: Quero ver este terreno limpo com uma moradia moderna construída e jardim bem cuidado',
  pro:          'Ex: Quero ver este terreno limpo com uma moradia moderna construída e jardim bem cuidado',
  antes_depois: 'Ex: Transformação gradual do terreno abandonado para moradia de luxo moderna',
  video_video:  'Ex: Adicionar céu azul, remover vegetação seca, adicionar jardim moderno',
}

export default function DashboardClient({ profile: initialProfile, videos: initialVideos }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(initialProfile)
  const [videos, setVideos] = useState(initialVideos)

  // Form state
  const [modo, setModo] = useState<Modo>('standard')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [duracao, setDuracao] = useState(5)
  const [prompt, setPrompt] = useState('')

  // Upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tailImageFile, setTailImageFile] = useState<File | null>(null)
  const [tailImagePreview, setTailImagePreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState<'main' | 'tail' | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pollingId, setPollingId] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const tailFileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)

  const creditosNecessarios = calcularCreditos(modo, duracao)
  const creditosInsuficientes = (profile?.creditos ?? 0) < creditosNecessarios

  // Reset uploads ao mudar modo
  useEffect(() => {
    setImageFile(null); setImagePreview(null)
    setTailImageFile(null); setTailImagePreview(null)
    setVideoFile(null); setError('')
  }, [modo])

  // Polling
  useEffect(() => {
    if (!pollingId) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/video-status/${pollingId}`)
      const data = await res.json()
      if (data.status === 'completed' || data.status === 'failed') {
        setPollingId(null)
        setLoading(false)
        if (data.status === 'failed') {
          setError(`Ocorreu um erro na geração. Os teus ${data.creditos_gastos || 0} créditos foram devolvidos automaticamente.`)
        }
        const { data: newVideos } = await supabase.from('videos').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(20)
        if (newVideos) setVideos(newVideos as Video[])
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile?.id).single()
        if (newProfile) setProfile(newProfile as Profile)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [pollingId, profile?.id, supabase])

  function handleImageFile(file: File, type: 'main' | 'tail') {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato de ficheiro não suportado. Aceites: JPG, PNG, WEBP'); return
    }
    if (file.size > 10 * 1024 * 1024) { setError('A imagem não pode ter mais de 10MB.'); return }
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      if (type === 'main') { setImageFile(file); setImagePreview(e.target?.result as string) }
      else { setTailImageFile(file); setTailImagePreview(e.target?.result as string) }
    }
    reader.readAsDataURL(file)
  }

  function handleVideoFile(file: File) {
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      setError('Formato de vídeo não suportado. Aceites: MP4, MOV (máx. 50MB)'); return
    }
    if (file.size > 50 * 1024 * 1024) { setError('O vídeo não pode ter mais de 50MB.'); return }
    setError(''); setVideoFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent, type: 'main' | 'tail') => {
    e.preventDefault(); setDragOver(null)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (modo === 'video_video') handleVideoFile(file)
    else handleImageFile(file, type)
  }, [modo])

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || loading) return
    setLoading(true); setError('')

    try {
      const bodyData: Record<string, unknown> = { modo, promptPortugues: prompt, duracao, aspectRatio }

      if (modo === 'standard' || modo === 'pro') {
        if (!imageFile) { setError('Carrega uma imagem.'); setLoading(false); return }
        bodyData.imageBase64 = await fileToBase64(imageFile)
        bodyData.imageMimeType = imageFile.type
      } else if (modo === 'antes_depois') {
        if (!imageFile || !tailImageFile) { setError('Precisas de carregar as duas fotos.'); setLoading(false); return }
        bodyData.imageBase64 = await fileToBase64(imageFile)
        bodyData.imageMimeType = imageFile.type
        bodyData.tailImageBase64 = await fileToBase64(tailImageFile)
        bodyData.tailImageMimeType = tailImageFile.type
      } else if (modo === 'video_video') {
        if (!videoFile) { setError('Carrega um vídeo.'); setLoading(false); return }
        bodyData.videoBase64 = await fileToBase64(videoFile)
        bodyData.videoMimeType = videoFile.type
      }

      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Erro ao gerar o vídeo.'); setLoading(false); return }

      setPollingId(data.videoId)
      setImageFile(null); setImagePreview(null)
      setTailImageFile(null); setTailImagePreview(null)
      setVideoFile(null); setPrompt('')

      const { data: newVideos } = await supabase.from('videos').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
      if (newVideos) setVideos(newVideos as Video[])
      const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
      if (newProfile) setProfile(newProfile as Profile)
    } catch {
      setError('Ocorreu um erro inesperado. Tenta novamente.')
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut(); router.push('/')
  }

  const creditosPct = profile ? Math.min(100, Math.round((profile.creditos / profile.creditos_total) * 100)) : 0
  const canGenerate = !loading && prompt.trim() && !creditosInsuficientes &&
    ((modo === 'standard' || modo === 'pro') ? !!imageFile :
     modo === 'antes_depois' ? (!!imageFile && !!tailImageFile) : !!videoFile)

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00d4aa,#00b894)' }}>
              <span className="font-bold text-sm" style={{ color: '#000' }}>IR</span>
            </div>
            <span className="font-semibold text-lg">ImoRender</span>
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#00d4aa' }}>{profile.creditos} créditos</span>
                </div>
                <Link href="/planos" className="text-xs px-2.5 py-1 rounded-md capitalize font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>{profile.plano}</Link>
                <Link href="/perfil" className="text-sm hidden sm:block" style={{ color: 'rgba(255,255,255,0.6)' }}>{profile.nome}</Link>
              </>
            )}
            <button onClick={handleLogout} className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Sair</button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {/* Boas-vindas */}
        {profile && (
          <div className="mb-6 p-5 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold mb-1">Olá, {profile.nome}! 👋</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Plano <span className="capitalize font-medium" style={{ color: '#00d4aa' }}>{profile.plano}</span>
                </p>
              </div>
              <div className="sm:text-right">
                <div className="text-3xl font-bold" style={{ color: '#00d4aa' }}>{profile.creditos}</div>
                <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>créditos disponíveis</div>
                <div className="h-1.5 rounded-full w-32 sm:ml-auto overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${creditosPct}%`, background: creditosPct < 20 ? '#ef4444' : '#00d4aa' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        <div className="mb-10 p-6 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-semibold mb-6">Gerar novo vídeo</h2>
          <form onSubmit={handleGenerate} className="space-y-6">

            {/* Passo 1 — Modo */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>1. Escolhe o modo</label>
              <div className="grid grid-cols-2 gap-3">
                {MODOS.map(m => (
                  <button key={m.id} type="button" onClick={() => setModo(m.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: modo === m.id ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)',
                      border: modo === m.id ? '1.5px solid #00d4aa' : '1.5px solid rgba(255,255,255,0.08)',
                    }}>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <div className="font-semibold text-sm mb-1">{m.nome}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Passo 2 — Upload */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>2. {modo === 'video_video' ? 'Carrega o vídeo' : modo === 'antes_depois' ? 'Carrega as duas fotos' : 'Carrega a foto'}</label>

              {(modo === 'standard' || modo === 'pro') && (
                <UploadZone
                  accept="image" preview={imagePreview}
                  dragOver={dragOver === 'main'}
                  onDragOver={() => setDragOver('main')} onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, 'main')}
                  onClick={() => fileRef.current?.click()}
                  onClear={() => { setImageFile(null); setImagePreview(null) }}
                />
              )}

              {modo === 'antes_depois' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs mb-2 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Foto Inicial</p>
                    <UploadZone accept="image" preview={imagePreview}
                      dragOver={dragOver === 'main'}
                      onDragOver={() => setDragOver('main')} onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(e, 'main')}
                      onClick={() => fileRef.current?.click()}
                      onClear={() => { setImageFile(null); setImagePreview(null) }}
                    />
                  </div>
                  <div>
                    <p className="text-xs mb-2 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Foto Final</p>
                    <UploadZone accept="image" preview={tailImagePreview}
                      dragOver={dragOver === 'tail'}
                      onDragOver={() => setDragOver('tail')} onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(e, 'tail')}
                      onClick={() => tailFileRef.current?.click()}
                      onClear={() => { setTailImageFile(null); setTailImagePreview(null) }}
                    />
                  </div>
                </div>
              )}

              {modo === 'video_video' && (
                <UploadZone accept="video" preview={null} videoName={videoFile?.name}
                  dragOver={dragOver === 'main'}
                  onDragOver={() => setDragOver('main')} onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, 'main')}
                  onClick={() => videoFileRef.current?.click()}
                  onClear={() => setVideoFile(null)}
                />
              )}

              <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp"
                onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0], 'main')} />
              <input ref={tailFileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp"
                onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0], 'tail')} />
              <input ref={videoFileRef} type="file" className="hidden" accept=".mp4,.mov,video/mp4,video/quicktime"
                onChange={e => e.target.files?.[0] && handleVideoFile(e.target.files[0])} />
            </div>

            {/* Passo 3 — Formato */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>3. Formato do vídeo</label>
              <div className="flex gap-3">
                {FORMATOS.map(f => (
                  <button key={f.id} type="button" onClick={() => setAspectRatio(f.id)}
                    className="flex-1 p-3 rounded-xl text-center transition-all"
                    style={{
                      background: aspectRatio === f.id ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)',
                      border: aspectRatio === f.id ? '1.5px solid #00d4aa' : '1.5px solid rgba(255,255,255,0.08)',
                    }}>
                    <div className="flex items-center justify-center mb-2">
                      <div className="rounded" style={{
                        width: `${Math.round(28 * (f.w / Math.max(f.w, f.h)))}px`,
                        height: `${Math.round(28 * (f.h / Math.max(f.w, f.h)))}px`,
                        background: aspectRatio === f.id ? '#00d4aa' : 'rgba(255,255,255,0.2)',
                        minWidth: '10px', minHeight: '10px',
                      }} />
                    </div>
                    <div className="font-semibold text-sm">{f.label}</div>
                    <div className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Passo 4 — Duração */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>4. Duração</label>
                <span className="text-sm font-semibold" style={{ color: '#00d4aa' }}>{duracao} segundos</span>
              </div>
              <input type="range" min={1} max={30} step={1} value={duracao}
                onChange={e => setDuracao(Number(e.target.value))}
                className="w-full" style={{ accentColor: '#00d4aa' }} />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <span>1s</span><span>30s</span>
              </div>
            </div>

            {/* Passo 5 — Descrição */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>5. Descreve o resultado que pretendes</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                required rows={3} placeholder={PLACEHOLDERS[modo]}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#00d4aa'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>

            {/* Resumo */}
            <div className="p-4 rounded-xl" style={{ background: '#0a0a0f', border: `1px solid ${creditosInsuficientes ? 'rgba(239,68,68,0.3)' : 'rgba(0,212,170,0.2)'}` }}>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Modo</div>
                <div className="font-medium text-right">{MODO_LABELS[modo]}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Formato</div>
                <div className="font-medium text-right">{aspectRatio}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Duração</div>
                <div className="font-medium text-right">{duracao}s</div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Créditos disponíveis</div>
                <div className="font-medium text-right">{profile?.creditos ?? 0}</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Créditos a consumir</span>
                <span className="text-xl font-bold" style={{ color: creditosInsuficientes ? '#ef4444' : '#00d4aa' }}>
                  {creditosNecessarios} créditos
                </span>
              </div>
              {creditosInsuficientes && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#fca5a5' }}>
                    Precisas de {creditosNecessarios} créditos e tens {profile?.creditos ?? 0} disponíveis.
                  </p>
                  <Link href="/planos" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                    Comprar créditos →
                  </Link>
                </div>
              )}
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
                A gerar o teu vídeo... isto pode demorar alguns minutos.
              </div>
            )}

            <button type="submit" disabled={!canGenerate}
              className="w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={{ background: canGenerate ? '#00d4aa' : 'rgba(255,255,255,0.08)', color: canGenerate ? '#000' : 'rgba(255,255,255,0.3)', cursor: canGenerate ? 'pointer' : 'not-allowed' }}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A gerar...
                </>
              ) : `Gerar Vídeo — ${creditosNecessarios} crédito${creditosNecessarios !== 1 ? 's' : ''}`}
            </button>
          </form>
        </div>

        {/* Histórico */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Os teus vídeos</h2>
          {videos.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Ainda não geraste nenhum vídeo.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(video => <VideoCard key={video.id} video={video} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Upload Zone Component
function UploadZone({ accept, preview, videoName, dragOver, onDragOver, onDragLeave, onDrop, onClick, onClear }: {
  accept: 'image' | 'video'
  preview: string | null
  videoName?: string
  dragOver: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  onClear: () => void
}) {
  return (
    <div
      className="relative rounded-xl border-2 border-dashed transition-all cursor-pointer"
      style={{
        minHeight: preview ? 'auto' : '140px',
        borderColor: dragOver ? '#00d4aa' : 'rgba(255,255,255,0.1)',
        background: dragOver ? 'rgba(0,212,170,0.05)' : 'rgba(255,255,255,0.02)',
      }}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full rounded-xl object-cover" style={{ maxHeight: '200px' }} />
          <button type="button" onClick={e => { e.stopPropagation(); onClear() }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>✕</button>
        </div>
      ) : videoName ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-2">🎬</div>
          <p className="text-sm font-medium" style={{ color: '#00d4aa' }}>{videoName}</p>
          <button type="button" onClick={e => { e.stopPropagation(); onClear() }}
            className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Remover</button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-2">{accept === 'video' ? '🎬' : '📷'}</div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {accept === 'video' ? 'Arrasta um vídeo ou clica para selecionar' : 'Arrasta uma foto ou clica para selecionar'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {accept === 'video' ? 'MP4, MOV · máx. 50MB' : 'JPG, PNG, WEBP · máx. 10MB'}
          </p>
        </div>
      )}
    </div>
  )
}

// Video Card Component
function VideoCard({ video }: { video: Video }) {
  const statusColor: Record<string, string> = { completed: '#00d4aa', processing: '#f59e0b', pending: '#6b7280', failed: '#ef4444' }
  const statusLabel: Record<string, string> = { completed: 'Concluído', processing: 'A processar', pending: 'Na fila', failed: 'Erro' }

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
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl">❌</div>
            <span className="text-xs" style={{ color: '#fca5a5' }}>Créditos devolvidos</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <p className="flex-1 text-sm leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{video.prompt_original}</p>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
            style={{ background: statusColor[video.status] + '20', color: statusColor[video.status] }}>
            {statusLabel[video.status]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {video.modo && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: MODO_BADGE_COLORS[video.modo as Modo], color: MODO_BADGE_TEXT[video.modo as Modo] }}>
              {MODO_LABELS[video.modo as Modo]}
            </span>
          )}
          {video.aspect_ratio && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              {video.aspect_ratio}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {video.duracao}s · {video.creditos_gastos}cr · {new Date(video.created_at).toLocaleDateString('pt-PT')}
          </span>
          {video.status === 'completed' && video.video_url && (
            <a href={video.video_url} download target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa' }}>
              ⬇ Download
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

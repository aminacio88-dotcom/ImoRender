'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularCreditos, MODO_LABELS, MODO_BADGE_COLORS, MODO_BADGE_TEXT, PLANO_LABELS, PLANO_WAIT } from '@/lib/creditos'
import type { Profile, Video, Modo, AspectRatio } from '@/lib/types'

interface Props { profile: Profile | null; videos: Video[] }

const MODOS = [
  { id: 'standard' as Modo, icon: '🖼️', nome: 'Standard',    desc: 'Uma foto, movimento natural. Ideal para imóveis e terrenos.', cr: '10 cr/s' },
  { id: 'pro' as Modo,      icon: '⭐', nome: 'Pro',          desc: 'Uma foto, qualidade cinematográfica. Resultados premium.',    cr: '20 cr/s' },
  { id: 'antes_depois' as Modo, icon: '🔄', nome: 'Antes/Depois', desc: 'Duas fotos. O vídeo transforma a primeira na segunda.',    cr: '16 cr/s' },
  { id: 'video_video' as Modo,  icon: '🎬', nome: 'Vídeo→Vídeo', desc: 'Transforma um vídeo existente com IA.',                   cr: '12 cr/s' },
]

const FORMATOS: { id: AspectRatio; label: string; desc: string; w: number; h: number }[] = [
  { id: '16:9', label: '16:9', desc: 'Horizontal', w: 16, h: 9 },
  { id: '9:16', label: '9:16', desc: 'Vertical',   w: 9,  h: 16 },
  { id: '1:1',  label: '1:1',  desc: 'Quadrado',   w: 1,  h: 1 },
]

const PLACEHOLDERS: Record<Modo, string> = {
  standard:     'Ex: Quero ver este terreno limpo com uma moradia moderna construída e jardim bem cuidado',
  pro:          'Ex: Quero ver este terreno limpo com uma moradia moderna construída e jardim bem cuidado',
  antes_depois: 'Ex: Transformação gradual do terreno abandonado para moradia de luxo moderna',
  video_video:  'Ex: Adicionar céu azul, remover vegetação seca, adicionar jardim moderno',
}

export default function DashboardClient({ profile: initialProfile, videos: initialVideos }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [showSuccess, setShowSuccess] = useState(searchParams.get('success') === 'true')

  const [profile, setProfile] = useState(initialProfile)
  const [videos, setVideos] = useState(initialVideos)

  const [modo, setModo] = useState<Modo>('standard')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [duracao, setDuracao] = useState(5)
  const [prompt, setPrompt] = useState('')

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tailImageFile, setTailImageFile] = useState<File | null>(null)
  const [tailImagePreview, setTailImagePreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState<'main' | 'tail' | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pollingId, setPollingId] = useState<string | null>(null)
  const [pollingSeconds, setPollingSeconds] = useState(0)

  const fileRef      = useRef<HTMLInputElement>(null)
  const tailFileRef  = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)

  const creditosNecessarios  = calcularCreditos(modo, duracao)
  const creditosDisponiveis  = profile?.creditos ?? 0
  const creditosInsuficientes = creditosDisponiveis < creditosNecessarios
  const creditosAposFicar    = creditosDisponiveis - creditosNecessarios
  const estimativaVideos     = Math.floor(creditosDisponiveis / 200) // Pro 10s
  const baixosCreditos       = creditosDisponiveis > 0 && creditosDisponiveis < 200
  const semCreditos          = creditosDisponiveis === 0
  const plano                = profile?.plano || 'free'

  useEffect(() => {
    setImageFile(null); setImagePreview(null)
    setTailImageFile(null); setTailImagePreview(null)
    setVideoFile(null); setError('')
  }, [modo])

  useEffect(() => {
    if (!pollingId) return
    setPollingSeconds(0)
    const ticker = setInterval(() => setPollingSeconds(s => s + 1), 1000)
    const interval = setInterval(async () => {
      const res  = await fetch(`/api/video-status/${pollingId}`)
      const data = await res.json()
      if (data.status === 'completed' || data.status === 'failed') {
        setPollingId(null)
        setLoading(false)
        setPollingSeconds(0)
        if (data.status === 'failed') {
          setError(`Ocorreu um erro na geração. Os teus ${data.creditos_gastos || 0} créditos foram devolvidos automaticamente.`)
        }
        const { data: newVideos } = await supabase.from('videos').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(20)
        if (newVideos) setVideos(newVideos as Video[])
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile?.id).single()
        if (newProfile) setProfile(newProfile as Profile)
      }
    }, 3000)
    return () => { clearInterval(interval); clearInterval(ticker) }
  }, [pollingId, profile?.id, supabase])

  function handleImageFile(file: File, type: 'main' | 'tail') {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato não suportado. Aceites: JPG, PNG, WEBP'); return
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
      setError('Formato não suportado. Aceites: MP4, MOV (máx. 50MB)'); return
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
      reader.onload = e => { resolve((e.target?.result as string).split(',')[1]) }
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
        bodyData.imageBase64  = await fileToBase64(imageFile)
        bodyData.imageMimeType = imageFile.type
      } else if (modo === 'antes_depois') {
        if (!imageFile || !tailImageFile) { setError('Precisas de carregar as duas fotos.'); setLoading(false); return }
        bodyData.imageBase64     = await fileToBase64(imageFile)
        bodyData.imageMimeType   = imageFile.type
        bodyData.tailImageBase64  = await fileToBase64(tailImageFile)
        bodyData.tailImageMimeType = tailImageFile.type
      } else if (modo === 'video_video') {
        if (!videoFile) { setError('Carrega um vídeo.'); setLoading(false); return }
        bodyData.videoBase64  = await fileToBase64(videoFile)
        bodyData.videoMimeType = videoFile.type
      }

      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })

      let data: Record<string, string> = {}
      try {
        data = await res.json()
      } catch {
        setError(`Erro ${res.status}: resposta inválida do servidor.`)
        setLoading(false); return
      }

      if (!res.ok) { setError(data.error || `Erro ${res.status}`); setLoading(false); return }

      setPollingId(data.videoId)
      setImageFile(null); setImagePreview(null)
      setTailImageFile(null); setTailImagePreview(null)
      setVideoFile(null); setPrompt('')

      const { data: newVideos } = await supabase.from('videos').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
      if (newVideos) setVideos(newVideos as Video[])
      const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
      if (newProfile) setProfile(newProfile as Profile)
    } catch (err) {
      setError('Erro: ' + (err instanceof Error ? err.message : String(err)))
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut(); router.push('/')
  }

  const creditosPct = profile ? Math.min(100, Math.round((profile.creditos / profile.creditos_total) * 100)) : 0
  const canGenerate = !loading && !semCreditos && prompt.trim() && !creditosInsuficientes &&
    ((modo === 'standard' || modo === 'pro') ? !!imageFile :
     modo === 'antes_depois' ? (!!imageFile && !!tailImageFile) : !!videoFile)

  return (
    <div style={{ background: '#F8F9FA', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)' }}>
              <span className="font-bold text-sm text-white">IR</span>
            </div>
            <span className="font-bold text-lg" style={{ color: '#1A1A2E' }}>ImoRender</span>
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#F0FDF9', border: '1px solid #00D4AA' }}>
                  <span className="text-xs font-bold" style={{ color: '#00B894' }}>{profile.creditos.toLocaleString('pt-PT')} cr</span>
                </div>
                <Link href="/planos" className="text-xs px-2.5 py-1 rounded-md font-bold capitalize" style={{ background: '#F1F3F5', color: '#374151', border: '1px solid #E5E7EB' }}>
                  {PLANO_LABELS[plano] || plano}
                </Link>
                <Link href="/planos" className="hidden sm:block text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                  style={{ background: '#00D4AA', color: '#FFFFFF' }}>
                  + Créditos
                </Link>
                <Link href="/perfil" className="text-sm hidden sm:block font-medium" style={{ color: '#6B7280' }}>{profile.nome}</Link>
              </>
            )}
            <button onClick={handleLogout} className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Sair</button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">

        {/* Sucesso após pagamento */}
        {showSuccess && (
          <div className="mb-5 p-4 rounded-xl flex items-center justify-between gap-4"
            style={{ background: '#F0FDF9', border: '1px solid #00D4AA' }}>
            <div>
              <p className="font-bold text-sm" style={{ color: '#00B894' }}>Subscrição ativada com sucesso!</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>O teu plano e créditos foram atualizados. Podes começar a gerar vídeos agora.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-lg font-bold" style={{ color: '#9CA3AF' }}>✕</button>
          </div>
        )}

        {/* Avisos de créditos */}
        {semCreditos && (
          <div className="mb-5 p-4 rounded-xl flex items-center justify-between gap-4"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>Não tens créditos disponíveis. Para gerar vídeos precisas de adquirir mais.</p>
            </div>
            <Link href="/planos" className="text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap"
              style={{ background: '#DC2626', color: '#FFFFFF' }}>
              Ver planos
            </Link>
          </div>
        )}
        {baixosCreditos && (
          <div className="mb-5 p-4 rounded-xl flex items-center justify-between gap-4"
            style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
            <div className="flex items-center gap-3">
              <span className="text-lg">⚡</span>
              <p className="text-sm font-semibold" style={{ color: '#CA8A04' }}>Créditos a acabar — considera comprar mais antes que se esgotem.</p>
            </div>
            <Link href="/planos" className="text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap"
              style={{ background: '#CA8A04', color: '#FFFFFF' }}>
              Comprar
            </Link>
          </div>
        )}

        {/* Boas-vindas */}
        {profile && (
          <div className="mb-6 p-5 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold mb-1" style={{ color: '#1A1A2E' }}>Olá, {profile.nome}! 👋</h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Plano <span className="font-bold" style={{ color: '#00D4AA' }}>{PLANO_LABELS[plano] || plano}</span>
                  <span className="mx-2" style={{ color: '#E5E7EB' }}>·</span>
                  <span>Espera {PLANO_WAIT[plano] || '—'}</span>
                </p>
                {estimativaVideos > 0 && (
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Suficiente para ~{estimativaVideos} vídeo{estimativaVideos !== 1 ? 's' : ''} Pro de 10s
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <div className="text-3xl font-bold" style={{ color: '#00D4AA' }}>{profile.creditos.toLocaleString('pt-PT')}</div>
                <div className="text-xs mb-2" style={{ color: '#9CA3AF' }}>créditos disponíveis</div>
                <div className="h-1.5 rounded-full w-32 sm:ml-auto overflow-hidden" style={{ background: '#F1F3F5' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${creditosPct}%`, background: creditosPct < 20 ? '#EF4444' : '#00D4AA' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        <div className="mb-10 p-6 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-lg font-bold mb-6" style={{ color: '#1A1A2E' }}>Gerar novo vídeo</h2>
          <form onSubmit={handleGenerate} className="space-y-6">

            {/* Passo 1 — Modo */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>1. Escolhe o modo</label>
              <div className="grid grid-cols-2 gap-3">
                {MODOS.map(m => (
                  <button key={m.id} type="button" onClick={() => setModo(m.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: modo === m.id ? '#F0FDF9' : '#F8F9FA',
                      border: modo === m.id ? '2px solid #00D4AA' : '2px solid #E5E7EB',
                    }}>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <div className="font-bold text-sm mb-1" style={{ color: '#1A1A2E' }}>{m.nome}</div>
                    <div className="text-xs leading-relaxed mb-2" style={{ color: '#6B7280' }}>{m.desc}</div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F0FDF9', color: '#00B894' }}>{m.cr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Passo 2 — Upload */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                2. {modo === 'video_video' ? 'Carrega o vídeo' : modo === 'antes_depois' ? 'Carrega as duas fotos' : 'Carrega a foto'}
              </label>

              {(modo === 'standard' || modo === 'pro') && (
                <UploadZone accept="image" preview={imagePreview}
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
                    <p className="text-xs mb-2 text-center font-medium" style={{ color: '#6B7280' }}>Foto Inicial</p>
                    <UploadZone accept="image" preview={imagePreview}
                      dragOver={dragOver === 'main'}
                      onDragOver={() => setDragOver('main')} onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(e, 'main')}
                      onClick={() => fileRef.current?.click()}
                      onClear={() => { setImageFile(null); setImagePreview(null) }}
                    />
                  </div>
                  <div>
                    <p className="text-xs mb-2 text-center font-medium" style={{ color: '#6B7280' }}>Foto Final</p>
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
              <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>3. Formato do vídeo</label>
              <div className="flex gap-3">
                {FORMATOS.map(f => (
                  <button key={f.id} type="button" onClick={() => setAspectRatio(f.id)}
                    className="flex-1 p-3 rounded-xl text-center transition-all"
                    style={{
                      background: aspectRatio === f.id ? '#F0FDF9' : '#F8F9FA',
                      border: aspectRatio === f.id ? '2px solid #00D4AA' : '2px solid #E5E7EB',
                    }}>
                    <div className="flex items-center justify-center mb-2">
                      <div className="rounded" style={{
                        width:  `${Math.round(28 * (f.w / Math.max(f.w, f.h)))}px`,
                        height: `${Math.round(28 * (f.h / Math.max(f.w, f.h)))}px`,
                        background: aspectRatio === f.id ? '#00D4AA' : '#D1D5DB',
                        minWidth: '10px', minHeight: '10px',
                      }} />
                    </div>
                    <div className="font-bold text-sm" style={{ color: '#1A1A2E' }}>{f.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Passo 4 — Duração */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: '#374151' }}>4. Duração</label>
                <span className="text-sm font-bold" style={{ color: '#00D4AA' }}>{duracao} segundos</span>
              </div>
              <input type="range" min={1} max={30} step={1} value={duracao}
                onChange={e => setDuracao(Number(e.target.value))}
                className="w-full" style={{ accentColor: '#00D4AA' }} />
              <div className="flex justify-between text-xs mt-1" style={{ color: '#9CA3AF' }}>
                <span>1s</span><span>30s</span>
              </div>
            </div>

            {/* Passo 5 — Descrição */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>5. Descreve o resultado que pretendes</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                required rows={3} placeholder={PLACEHOLDERS[modo]}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E' }}
                onFocus={e => e.target.style.borderColor = '#00D4AA'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            {/* Resumo */}
            <div className="p-4 rounded-xl" style={{
              background: '#F0FDF9',
              border: `1px solid ${creditosInsuficientes ? '#FECACA' : '#00D4AA'}`,
            }}>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div style={{ color: '#6B7280' }}>Modo</div>
                <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>{MODO_LABELS[modo]}</div>
                <div style={{ color: '#6B7280' }}>Formato</div>
                <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>{aspectRatio}</div>
                <div style={{ color: '#6B7280' }}>Duração</div>
                <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>{duracao}s</div>
                <div style={{ color: '#6B7280' }}>Créditos disponíveis</div>
                <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>{creditosDisponiveis.toLocaleString('pt-PT')}</div>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #D1FAE5' }}>
                <span className="text-sm font-semibold" style={{ color: '#374151' }}>Este vídeo vai consumir</span>
                <span className="text-xl font-bold" style={{ color: creditosInsuficientes ? '#DC2626' : '#00D4AA' }}>
                  {creditosNecessarios.toLocaleString('pt-PT')} créditos
                </span>
              </div>
              {!creditosInsuficientes && (
                <p className="text-xs mt-1.5 text-right" style={{ color: '#9CA3AF' }}>
                  Ficarás com {creditosAposFicar.toLocaleString('pt-PT')} créditos
                </p>
              )}
              {creditosInsuficientes && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#DC2626' }}>
                    Precisas de {creditosNecessarios.toLocaleString('pt-PT')} e tens {creditosDisponiveis.toLocaleString('pt-PT')}.
                  </p>
                  <Link href="/planos" className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    Comprar créditos →
                  </Link>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                {error}
              </div>
            )}

            {loading && (
              <div className="px-4 py-4 rounded-xl text-sm" style={{ background: '#F0FDF9', border: '1px solid #00D4AA' }}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: '#00D4AA' }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="font-semibold" style={{ color: '#00B894' }}>
                    {pollingId ? 'A gerar o vídeo com IA...' : 'A preparar e enviar...'}
                  </span>
                  {pollingId && (
                    <span className="ml-auto font-mono text-xs" style={{ color: '#9CA3AF' }}>
                      {Math.floor(pollingSeconds / 60)}:{String(pollingSeconds % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  {pollingId
                    ? `A IA está a processar o teu vídeo. Tempo normal de espera: ${PLANO_WAIT[plano] || '—'}. Podes continuar a navegar.`
                    : 'A otimizar o prompt e submeter para geração...'}
                </p>
              </div>
            )}

            <button type="submit" disabled={!canGenerate}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: canGenerate ? '#00D4AA' : '#E5E7EB',
                color:      canGenerate ? '#FFFFFF'  : '#9CA3AF',
                cursor:     canGenerate ? 'pointer'  : 'not-allowed',
              }}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A gerar...
                </>
              ) : `Gerar Vídeo — ${creditosNecessarios.toLocaleString('pt-PT')} crédito${creditosNecessarios !== 1 ? 's' : ''}`}
            </button>
          </form>
        </div>

        {/* Histórico */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1A1A2E' }}>Os teus vídeos</h2>
          {videos.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Ainda não geraste nenhum vídeo.</p>
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
    <div className="relative rounded-xl border-2 border-dashed transition-all cursor-pointer"
      style={{
        minHeight: preview ? 'auto' : '140px',
        borderColor: dragOver ? '#00D4AA' : '#E5E7EB',
        background:  dragOver ? '#F0FDF9' : '#F8F9FA',
      }}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full rounded-xl object-cover" style={{ maxHeight: '200px' }} />
          <button type="button" onClick={e => { e.stopPropagation(); onClear() }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>✕</button>
        </div>
      ) : videoName ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-2">🎬</div>
          <p className="text-sm font-semibold" style={{ color: '#00D4AA' }}>{videoName}</p>
          <button type="button" onClick={e => { e.stopPropagation(); onClear() }}
            className="mt-2 text-xs" style={{ color: '#9CA3AF' }}>Remover</button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-2">{accept === 'video' ? '🎬' : '📷'}</div>
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>
            {accept === 'video' ? 'Arrasta um vídeo ou clica para selecionar' : 'Arrasta uma foto ou clica para selecionar'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            {accept === 'video' ? 'MP4, MOV · máx. 50MB' : 'JPG, PNG, WEBP · máx. 10MB'}
          </p>
        </div>
      )}
    </div>
  )
}

function VideoCard({ video }: { video: Video }) {
  const statusColor: Record<string, string> = { completed: '#16A34A', processing: '#CA8A04', pending: '#6B7280', failed: '#DC2626' }
  const statusBg:    Record<string, string> = { completed: '#F0FDF4', processing: '#FEF9C3', pending: '#F1F3F5', failed: '#FEF2F2' }
  const statusLabel: Record<string, string> = { completed: 'Concluído', processing: 'A processar', pending: 'Na fila', failed: 'Erro' }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="aspect-video flex items-center justify-center" style={{ background: '#F1F3F5' }}>
        {video.status === 'completed' && video.video_url ? (
          <video src={video.video_url} controls className="w-full h-full object-cover" />
        ) : video.status === 'processing' || video.status === 'pending' ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 animate-spin" style={{ color: '#00D4AA' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>A processar...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl">❌</div>
            <span className="text-xs font-medium" style={{ color: '#DC2626' }}>Créditos devolvidos</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <p className="flex-1 text-sm leading-snug line-clamp-2" style={{ color: '#374151' }}>{video.prompt_original}</p>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
            style={{ background: statusBg[video.status], color: statusColor[video.status] }}>
            {statusLabel[video.status]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {video.modo && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: MODO_BADGE_COLORS[video.modo as Modo], color: MODO_BADGE_TEXT[video.modo as Modo] }}>
              {MODO_LABELS[video.modo as Modo]}
            </span>
          )}
          {video.aspect_ratio && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F1F3F5', color: '#6B7280' }}>
              {video.aspect_ratio}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            {video.duracao}s · {video.creditos_gastos?.toLocaleString('pt-PT')}cr · {new Date(video.created_at).toLocaleDateString('pt-PT')}
          </span>
          {video.status === 'completed' && video.video_url && (
            <a href={video.video_url} download target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: '#F0FDF9', color: '#00B894', border: '1px solid #00D4AA' }}>
              ⬇ Download
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

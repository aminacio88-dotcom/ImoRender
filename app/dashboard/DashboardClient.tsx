'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularCreditos, MODO_LABELS, MODO_BADGE_COLORS, MODO_BADGE_TEXT, PLANO_LABELS, PLANO_WAIT, CREDITOS_RENDER_IA } from '@/lib/creditos'
import type { Profile, Video, Modo, AspectRatio, Render, DashboardMode } from '@/lib/types'

interface Props { profile: Profile | null; videos: Video[]; renders: Render[] }

const MODOS: { id: DashboardMode; icon: string; nome: string; desc: string; cr: string }[] = [
  { id: 'render_ia',        icon: '🎨', nome: 'Render IA',         desc: 'Transforma uma planta num render fotorrealista — 30 créditos fixo.',                                                            cr: '30 cr fixo' },
  { id: 'standard',         icon: '🖼️', nome: 'Standard',          desc: 'Kling 3.0 Pro — qualidade cinematográfica, até 30 segundos.',                                                                   cr: '20 cr/s' },
  { id: 'pro',              icon: '⭐', nome: 'Pro',                desc: 'Seedance 2.0 — qualidade máxima, até 9 fotos de referência, máx. 10 segundos.',                                                 cr: '45 cr/s' },
  { id: 'antes_depois',     icon: '🔄', nome: 'Antes/Depois',       desc: 'Dois momentos, uma transformação, máx. 10 segundos.',                                                                           cr: '16 cr/s' },
  { id: 'video_video',      icon: '🎬', nome: 'Vídeo→Vídeo',        desc: 'Transforma um vídeo existente com IA.',                                                                                         cr: '12 cr/s' },
  { id: 'projeto_aprovado', icon: '📐', nome: 'Projeto Aprovado',   desc: 'Seedance 2.0 Premium — planta + terreno, máx. 10 segundos.',                                                                   cr: '60 cr/s' },
]

const RENDER_STYLES = ['Moderno Minimalista', 'Contemporâneo', 'Mediterrâneo', 'Industrial', 'Clássico']

const FORMATOS: { id: AspectRatio; label: string; desc: string; w: number; h: number }[] = [
  { id: '16:9', label: '16:9', desc: 'Horizontal', w: 16, h: 9 },
  { id: '9:16', label: '9:16', desc: 'Vertical',   w: 9,  h: 16 },
  { id: '1:1',  label: '1:1',  desc: 'Quadrado',   w: 1,  h: 1 },
]

const VIDEO_PLACEHOLDERS: Record<string, string> = {
  standard:         'Ex: Quero ver este terreno limpo com uma moradia moderna construída e jardim bem cuidado',
  pro:              'Ex: Quero ver este terreno limpo com uma moradia moderna construída e jardim bem cuidado',
  antes_depois:     'Ex: Transformação gradual do terreno abandonado para moradia de luxo moderna',
  video_video:      'Ex: Adicionar céu azul, remover vegetação seca, adicionar jardim moderno',
  projeto_aprovado: 'Ex: Construir a moradia do render 3D neste terreno, perspetiva aérea, fotorrealista',
}

const RENDER_IA_PLACEHOLDER = 'Ex: Quero ver a cozinha com acabamentos em pedra natural e janelas amplas (opcional)'

export default function DashboardClient({ profile: initialProfile, videos: initialVideos, renders: initialRenders }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [showSuccess, setShowSuccess] = useState(searchParams.get('success') === 'true')

  const [profile, setProfile] = useState(initialProfile)
  const [videos, setVideos] = useState(initialVideos)
  const [renders, setRenders] = useState(initialRenders)

  const [modo, setModo] = useState<DashboardMode>('standard')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [duracao, setDuracao] = useState(5)
  const [prompt, setPrompt] = useState('')

  // Video mode upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tailImageFile, setTailImageFile] = useState<File | null>(null)
  const [tailImagePreview, setTailImagePreview] = useState<string | null>(null)
  const [planFile, setPlanFile] = useState<File | null>(null)
  const [planPreview, setPlanPreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState<'main' | 'tail' | 'plan' | 'render_ia' | null>(null)

  // Render IA state
  const [renderStyle, setRenderStyle] = useState<string>('Moderno Minimalista')
  const [renderIaFile, setRenderIaFile] = useState<File | null>(null)
  const [renderIaPreview, setRenderIaPreview] = useState<string | null>(null)
  const [renderResult, setRenderResult] = useState<Render | null>(null)
  const [renderPollingId, setRenderPollingId] = useState<string | null>(null)
  const [renderPollingSeconds, setRenderPollingSeconds] = useState(0)

  // Shared UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pollingId, setPollingId] = useState<string | null>(null)
  const [pollingSeconds, setPollingSeconds] = useState(0)

  const fileRef         = useRef<HTMLInputElement>(null)
  const tailFileRef     = useRef<HTMLInputElement>(null)
  const planFileRef     = useRef<HTMLInputElement>(null)
  const videoFileRef    = useRef<HTMLInputElement>(null)
  const renderIaFileRef = useRef<HTMLInputElement>(null)
  const pendingImageRef = useRef<{ file: File; preview: string } | null>(null)

  const isVideoMode = modo !== 'render_ia'
  const creditosNecessarios = isVideoMode
    ? calcularCreditos(modo as Modo, duracao)
    : CREDITOS_RENDER_IA
  const creditosDisponiveis  = profile?.creditos ?? 0
  const creditosInsuficientes = creditosDisponiveis < creditosNecessarios
  const creditosAposFicar    = creditosDisponiveis - creditosNecessarios
  const estimativaVideos     = Math.floor(creditosDisponiveis / 100)
  const baixosCreditos       = creditosDisponiveis > 0 && creditosDisponiveis < 300
  const semCreditos          = creditosDisponiveis === 0
  const plano                = profile?.plano || 'free'

  useEffect(() => {
    setImageFile(null); setImagePreview(null)
    setTailImageFile(null); setTailImagePreview(null)
    setPlanFile(null); setPlanPreview(null)
    setVideoFile(null)
    if (modo !== 'render_ia') { setRenderIaFile(null); setRenderIaPreview(null) }
    setError('')
    const maxDuracaoModo = ['pro', 'antes_depois', 'projeto_aprovado'].includes(modo) ? 10 : 30
    if (duracao > maxDuracaoModo) setDuracao(maxDuracaoModo)
    // Apply pending image (from "Usar para vídeo" flow)
    if (pendingImageRef.current) {
      const { file, preview } = pendingImageRef.current
      pendingImageRef.current = null
      setImageFile(file)
      setImagePreview(preview)
    }
  }, [modo])

  // Check stuck videos on load
  useEffect(() => {
    const processingVideos = initialVideos.filter(v => v.status === 'processing')
    processingVideos.forEach(async (v) => {
      try {
        const res = await fetch(`/api/video-status/${v.id}`)
        const data = await res.json()
        if (data.status === 'failed' || data.status === 'completed') {
          const { data: newVideos } = await supabase.from('videos').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(20)
          if (newVideos) setVideos(newVideos as Video[])
          const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile?.id).single()
          if (newProfile) setProfile(newProfile as Profile)
        }
      } catch {}
    })
    // Check stuck renders on load
    const processingRenders = initialRenders.filter(r => r.status === 'processing')
    processingRenders.forEach(async (r) => {
      try {
        const res = await fetch(`/api/render-status/${r.id}`)
        const data = await res.json()
        if (data.status === 'failed' || data.status === 'completed') {
          const { data: newRenders } = await supabase.from('renders').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(20)
          if (newRenders) setRenders(newRenders as Render[])
          const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile?.id).single()
          if (newProfile) setProfile(newProfile as Profile)
        }
      } catch {}
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Video polling
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

  // Render polling
  useEffect(() => {
    if (!renderPollingId) return
    setRenderPollingSeconds(0)
    const ticker = setInterval(() => setRenderPollingSeconds(s => s + 1), 1000)
    const interval = setInterval(async () => {
      const res  = await fetch(`/api/render-status/${renderPollingId}`)
      const data = await res.json()
      if (data.status === 'completed' || data.status === 'failed') {
        setRenderPollingId(null)
        setLoading(false)
        setRenderPollingSeconds(0)
        if (data.status === 'completed') {
          setRenderResult(data as Render)
        } else {
          setError(`Ocorreu um erro no render. Os teus ${data.creditos_gastos || 0} créditos foram devolvidos automaticamente.`)
        }
        const { data: newRenders } = await supabase.from('renders').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(20)
        if (newRenders) setRenders(newRenders as Render[])
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile?.id).single()
        if (newProfile) setProfile(newProfile as Profile)
      }
    }, 3000)
    return () => { clearInterval(interval); clearInterval(ticker) }
  }, [renderPollingId, profile?.id, supabase])

  function handleImageFile(file: File, type: 'main' | 'tail') {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif']
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const validExts = ['jpg', 'jpeg', 'png', 'webp', 'jfif']
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError(`Formato não suportado (${file.type || ext}). Aceites: JPG, PNG, WEBP`); return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('⚠️ A imagem é demasiado grande (máx. 8MB). Comprime em tinypng.com e tenta novamente.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      if (!result) { setError('Erro ao ler a imagem. Tenta outro ficheiro.'); return }
      if (type === 'main') { setImageFile(file); setImagePreview(result) }
      else { setTailImageFile(file); setTailImagePreview(result) }
    }
    reader.onerror = () => setError('Erro ao carregar a imagem. Tenta novamente.')
    reader.readAsDataURL(file)
  }

  function handleVideoFile(file: File) {
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      setError('Formato não suportado. Aceites: MP4, MOV (máx. 50MB)'); return
    }
    if (file.size > 50 * 1024 * 1024) { setError('O vídeo não pode ter mais de 50MB.'); return }
    setError(''); setVideoFile(file)
  }

  async function handlePlanLikeFile(
    file: File,
    setFile: (f: File) => void,
    setPreview: (p: string) => void
  ) {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const isPdf = file.type === 'application/pdf' || ext === 'pdf'

    if (isPdf) {
      if (file.size > 10 * 1024 * 1024) { setError('O PDF não pode ter mais de 10MB.'); return }
      setError('')
      try {
        const win = window as unknown as Record<string, unknown>
        if (!win.__pdfjs_loaded) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            s.onload = () => { win.__pdfjs_loaded = true; resolve() }
            s.onerror = () => reject(new Error('Falha ao carregar PDF.js'))
            document.head.appendChild(s)
          })
          const pdfjs = win.pdfjsLib as { GlobalWorkerOptions: { workerSrc: string } }
          pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        }
        const pdfjs = win.pdfjsLib as {
          getDocument: (opts: { data: ArrayBuffer }) => { promise: Promise<{ getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number }; render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> }> }
        }
        const bytes = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: bytes }).promise
        const page = await pdf.getPage(1)
        const vp = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        const jpegFile = new File([blob], file.name.replace(/\.pdf$/i, '.jpg'), { type: 'image/jpeg' })
        setFile(jpegFile)
        setPreview(dataUrl)
      } catch {
        setError('Erro ao converter PDF. Exporta como JPG ou PNG e tenta novamente.')
      }
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const validExts = ['jpg', 'jpeg', 'png', 'webp']
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError('Formato não suportado. Aceites: JPG, PNG, WEBP, PDF'); return
    }
    if (file.size > 10 * 1024 * 1024) { setError('A imagem é demasiado grande (máx. 10MB).'); return }
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      if (!result) { setError('Erro ao ler a imagem.'); return }
      setFile(file); setPreview(result)
    }
    reader.onerror = () => setError('Erro ao carregar o ficheiro.')
    reader.readAsDataURL(file)
  }

  async function handlePlanFile(file: File) {
    await handlePlanLikeFile(file, setPlanFile, setPlanPreview)
  }

  async function handleRenderIaFile(file: File) {
    await handlePlanLikeFile(file, setRenderIaFile, setRenderIaPreview)
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

  async function usarRenderParaVideo(render: Render) {
    if (!render.render_url) return
    try {
      const res = await fetch(render.render_url)
      const blob = await res.blob()
      const file = new File([blob], 'render_ia.jpg', { type: 'image/jpeg' })
      pendingImageRef.current = { file, preview: render.render_url }
      setRenderResult(null)
      setModo('pro')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Erro ao carregar a imagem do render. Faz download e carrega manualmente.')
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || loading) return
    setLoading(true); setError('')

    try {
      // Render IA path
      if (modo === 'render_ia') {
        if (!renderIaFile) { setError('Carrega uma planta ou esboço.'); setLoading(false); return }
        const imageBase64 = await fileToBase64(renderIaFile)
        const res = await fetch('/api/render', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            imageMimeType: renderIaFile.type || 'image/jpeg',
            style: renderStyle,
            promptPortugues: prompt,
          }),
        })
        let data: Record<string, string> = {}
        try { data = await res.json() } catch {
          setError(`Erro ${res.status}: resposta inválida do servidor.`)
          setLoading(false); return
        }
        if (!res.ok) { setError(data.error || `Erro ${res.status}`); setLoading(false); return }
        setRenderPollingId(data.renderId)
        setRenderIaFile(null); setRenderIaPreview(null); setPrompt('')
        const { data: newRenders } = await supabase.from('renders').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
        if (newRenders) setRenders(newRenders as Render[])
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
        if (newProfile) setProfile(newProfile as Profile)
        return
      }

      // Video generation path
      const bodyData: Record<string, unknown> = { modo, promptPortugues: prompt, duracao, aspectRatio }

      if (modo === 'standard' || modo === 'pro') {
        if (!imageFile) { setError('Carrega uma imagem.'); setLoading(false); return }
        bodyData.imageBase64  = await fileToBase64(imageFile)
        bodyData.imageMimeType = imageFile.type
      } else if (modo === 'antes_depois') {
        if (!imageFile || !tailImageFile) { setError('Precisas de carregar as duas fotos.'); setLoading(false); return }
        bodyData.imageBase64      = await fileToBase64(imageFile)
        bodyData.imageMimeType    = imageFile.type
        bodyData.tailImageBase64  = await fileToBase64(tailImageFile)
        bodyData.tailImageMimeType = tailImageFile.type
      } else if (modo === 'video_video') {
        if (!videoFile) { setError('Carrega um vídeo.'); setLoading(false); return }
        bodyData.videoBase64  = await fileToBase64(videoFile)
        bodyData.videoMimeType = videoFile.type
      } else if (modo === 'projeto_aprovado') {
        if (!imageFile || !planFile) { setError('Precisas de carregar a foto do terreno e a planta.'); setLoading(false); return }
        bodyData.imageBase64       = await fileToBase64(imageFile)
        bodyData.imageMimeType     = imageFile.type || 'image/jpeg'
        bodyData.planImageBase64   = await fileToBase64(planFile)
        bodyData.planImageMimeType = planFile.type || 'image/jpeg'
      }

      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })
      let data: Record<string, string> = {}
      try { data = await res.json() } catch {
        setError(`Erro ${res.status}: resposta inválida do servidor.`)
        setLoading(false); return
      }
      if (!res.ok) { setError(data.error || `Erro ${res.status}`); setLoading(false); return }

      setPollingId(data.videoId)
      setImageFile(null); setImagePreview(null)
      setTailImageFile(null); setTailImagePreview(null)
      setPlanFile(null); setPlanPreview(null)
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
  const canGenerate = !loading && !semCreditos && !creditosInsuficientes && (
    modo === 'render_ia'
      ? !!renderIaFile
      : (prompt.trim() && (
          (modo === 'standard' || modo === 'pro') ? !!imageFile :
          modo === 'antes_depois' ? (!!imageFile && !!tailImageFile) :
          modo === 'projeto_aprovado' ? (!!imageFile && !!planFile) :
          !!videoFile
        ))
  )

  const modoLabel = modo === 'render_ia' ? 'Render IA' : MODO_LABELS[modo as Modo]
  const activePollingSeconds = renderPollingId ? renderPollingSeconds : pollingSeconds

  const uploadLabel =
    modo === 'render_ia'        ? 'Carrega a planta ou esboço' :
    modo === 'video_video'      ? 'Carrega o vídeo' :
    modo === 'antes_depois'     ? 'Carrega as duas fotos' :
    modo === 'projeto_aprovado' ? 'Carrega a foto e a planta' : 'Carrega a foto'

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
                    Suficiente para aproximadamente {estimativaVideos} vídeo{estimativaVideos !== 1 ? 's' : ''} Standard de 5s
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
          <h2 className="text-lg font-bold mb-6" style={{ color: '#1A1A2E' }}>
            {modo === 'render_ia' ? 'Gerar novo Render IA' : 'Gerar novo vídeo'}
          </h2>
          <form onSubmit={handleGenerate} className="space-y-6">

            {/* Passo 1 — Modo */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>1. Escolhe o modo</label>
              <div className="grid grid-cols-2 gap-3">
                {MODOS.map(m => (
                  <button key={m.id} type="button" onClick={() => setModo(m.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: modo === m.id ? (m.id === 'render_ia' ? '#FDF4FF' : '#F0FDF9') : '#F8F9FA',
                      border: modo === m.id ? `2px solid ${m.id === 'render_ia' ? '#A855F7' : '#00D4AA'}` : '2px solid #E5E7EB',
                    }}>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <div className="font-bold text-sm mb-1" style={{ color: '#1A1A2E' }}>{m.nome}</div>
                    <div className="text-xs leading-relaxed mb-2" style={{ color: '#6B7280' }}>{m.desc}</div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: m.id === 'render_ia' ? '#F3E8FF' : '#F0FDF9', color: m.id === 'render_ia' ? '#9333EA' : '#00B894' }}>
                      {m.cr}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Passo 2 — Upload */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                2. {uploadLabel}
              </label>

              {/* Render IA upload */}
              {modo === 'render_ia' && (
                <>
                  <UploadZone accept="plan" preview={renderIaPreview}
                    label="Arrasta a planta ou esboço ou clica para selecionar"
                    dragOver={dragOver === 'render_ia'}
                    onDragOver={() => setDragOver('render_ia')} onDragLeave={() => setDragOver(null)}
                    onDrop={e => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) handleRenderIaFile(f) }}
                    onClick={() => renderIaFileRef.current?.click()}
                    onClear={() => { setRenderIaFile(null); setRenderIaPreview(null) }}
                  />
                  <input ref={renderIaFileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf,application/pdf"
                    onChange={e => e.target.files?.[0] && handleRenderIaFile(e.target.files[0])} />
                </>
              )}

              {/* Standard / Pro */}
              {(modo === 'standard' || modo === 'pro') && (
                <UploadZone accept="image" preview={imagePreview}
                  dragOver={dragOver === 'main'}
                  onDragOver={() => setDragOver('main')} onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, 'main')}
                  onClick={() => fileRef.current?.click()}
                  onClear={() => { setImageFile(null); setImagePreview(null) }}
                />
              )}

              {/* Antes/Depois */}
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

              {/* Vídeo→Vídeo */}
              {modo === 'video_video' && (
                <UploadZone accept="video" preview={null} videoName={videoFile?.name}
                  dragOver={dragOver === 'main'}
                  onDragOver={() => setDragOver('main')} onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, 'main')}
                  onClick={() => videoFileRef.current?.click()}
                  onClear={() => setVideoFile(null)}
                />
              )}

              {/* Projeto Aprovado */}
              {modo === 'projeto_aprovado' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs mb-2 text-center font-medium" style={{ color: '#6B7280' }}>Foto do Terreno</p>
                      <UploadZone accept="image" preview={imagePreview}
                        dragOver={dragOver === 'main'}
                        onDragOver={() => setDragOver('main')} onDragLeave={() => setDragOver(null)}
                        onDrop={e => handleDrop(e, 'main')}
                        onClick={() => fileRef.current?.click()}
                        onClear={() => { setImageFile(null); setImagePreview(null) }}
                      />
                    </div>
                    <div>
                      <p className="text-xs mb-2 text-center font-medium" style={{ color: '#6B7280' }}>Render 3D / Planta 3D</p>
                      <UploadZone accept="plan" preview={planPreview}
                        dragOver={dragOver === 'plan'}
                        onDragOver={() => setDragOver('plan')} onDragLeave={() => setDragOver(null)}
                        onDrop={e => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) handlePlanFile(f) }}
                        onClick={() => planFileRef.current?.click()}
                        onClear={() => { setPlanFile(null); setPlanPreview(null) }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 px-3 py-2.5 rounded-lg flex items-start gap-2" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
                    <span className="text-sm flex-shrink-0">💡</span>
                    <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
                      <span className="font-bold">Importante:</span> Para bons resultados é necessário um <span className="font-bold">render 3D ou planta 3D</span> da moradia. Uma planta 2D não tem detalhe visual suficiente para a IA reproduzir corretamente.
                    </p>
                  </div>
                </>
              )}

              {/* Hidden file inputs for video modes */}
              <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp"
                onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0], 'main')} />
              <input ref={tailFileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp"
                onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0], 'tail')} />
              <input ref={planFileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf,application/pdf"
                onChange={e => e.target.files?.[0] && handlePlanFile(e.target.files[0])} />
              <input ref={videoFileRef} type="file" className="hidden" accept=".mp4,.mov,video/mp4,video/quicktime"
                onChange={e => e.target.files?.[0] && handleVideoFile(e.target.files[0])} />
            </div>

            {/* Passo 3 — Estilo (Render IA) */}
            {modo === 'render_ia' && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>3. Estilo de interiores</label>
                <select value={renderStyle} onChange={e => setRenderStyle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E', appearance: 'auto' }}>
                  {RENDER_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Passo 3 — Formato (modos de vídeo) */}
            {modo !== 'render_ia' && (
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
            )}

            {/* Passo 4 — Duração (modos de vídeo) */}
            {modo !== 'render_ia' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold" style={{ color: '#374151' }}>4. Duração</label>
                  <span className="text-sm font-bold" style={{ color: '#00D4AA' }}>{duracao} segundos</span>
                </div>
                <input type="range" min={1}
                  max={['pro', 'antes_depois', 'projeto_aprovado'].includes(modo) ? 10 : 30}
                  step={1} value={duracao}
                  onChange={e => setDuracao(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#00D4AA' }} />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  <span>1s</span>
                  <span>{['pro', 'antes_depois', 'projeto_aprovado'].includes(modo) ? '10s' : '30s'}</span>
                </div>
              </div>
            )}

            {/* Passo 4/5 — Descrição */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                {modo === 'render_ia' ? '4.' : '5.'} {modo === 'render_ia' ? 'Descrição adicional (opcional)' : 'Descreve o resultado que pretendes'}
              </label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                required={modo !== 'render_ia'} rows={3}
                placeholder={modo === 'render_ia' ? RENDER_IA_PLACEHOLDER : VIDEO_PLACEHOLDERS[modo] || ''}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1A1A2E' }}
                onFocus={e => e.target.style.borderColor = modo === 'render_ia' ? '#A855F7' : '#00D4AA'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            {/* Resumo */}
            <div className="p-4 rounded-xl" style={{
              background: modo === 'render_ia' ? '#FDF4FF' : '#F0FDF9',
              border: `1px solid ${creditosInsuficientes ? '#FECACA' : modo === 'render_ia' ? '#A855F7' : '#00D4AA'}`,
            }}>
              {modo === 'render_ia' ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div style={{ color: '#6B7280' }}>Modo</div>
                    <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>Render IA</div>
                    <div style={{ color: '#6B7280' }}>Estilo</div>
                    <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>{renderStyle}</div>
                    <div style={{ color: '#6B7280' }}>Créditos disponíveis</div>
                    <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>{creditosDisponiveis.toLocaleString('pt-PT')}</div>
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #E9D5FF' }}>
                    <span className="text-sm font-semibold" style={{ color: '#374151' }}>Este render vai consumir</span>
                    <span className="text-xl font-bold" style={{ color: creditosInsuficientes ? '#DC2626' : '#9333EA' }}>
                      {CREDITOS_RENDER_IA} créditos
                    </span>
                  </div>
                  {!creditosInsuficientes && (
                    <p className="text-xs mt-1.5 text-right" style={{ color: '#9CA3AF' }}>
                      Ficarás com {creditosAposFicar.toLocaleString('pt-PT')} créditos
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div style={{ color: '#6B7280' }}>Modo</div>
                    <div className="font-semibold text-right" style={{ color: '#1A1A2E' }}>{modoLabel}</div>
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
                </>
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
                    {(pollingId || renderPollingId)
                      ? (renderPollingId ? 'A gerar o render com IA...' : 'A gerar o vídeo com IA...')
                      : 'A preparar e enviar...'}
                  </span>
                  {(pollingId || renderPollingId) && (
                    <span className="ml-auto font-mono text-xs" style={{ color: '#9CA3AF' }}>
                      {Math.floor(activePollingSeconds / 60)}:{String(activePollingSeconds % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
                  {(pollingId || renderPollingId)
                    ? (renderPollingId
                        ? 'A IA está a gerar o teu render. Normalmente demora 1 a 3 minutos. Podes continuar a navegar.'
                        : `A IA está a processar o teu vídeo. Tempo normal de espera: ${PLANO_WAIT[plano] || '—'}. Podes continuar a navegar.`)
                    : 'A otimizar o prompt e submeter para geração...'}
                </p>
                {renderPollingId && (
                  <button type="button"
                    onClick={() => { setRenderPollingId(null); setLoading(false); setRenderPollingSeconds(0) }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    Cancelar espera e gerar outro render →
                  </button>
                )}
                {pollingId && (
                  <button type="button"
                    onClick={() => { setPollingId(null); setLoading(false); setPollingSeconds(0) }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    Cancelar espera e gerar outro vídeo →
                  </button>
                )}
              </div>
            )}

            <button type="submit" disabled={!canGenerate}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: canGenerate ? (modo === 'render_ia' ? '#9333EA' : '#00D4AA') : '#E5E7EB',
                color:      canGenerate ? '#FFFFFF' : '#9CA3AF',
                cursor:     canGenerate ? 'pointer' : 'not-allowed',
              }}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  A gerar...
                </>
              ) : modo === 'render_ia'
                  ? `Gerar Render — ${CREDITOS_RENDER_IA} créditos`
                  : `Gerar Vídeo — ${creditosNecessarios.toLocaleString('pt-PT')} crédito${creditosNecessarios !== 1 ? 's' : ''}`}
            </button>
          </form>
        </div>

        {/* Render IA Result */}
        {renderResult && renderResult.status === 'completed' && renderResult.render_url && (
          <div className="mb-10 p-6 rounded-2xl" style={{ background: '#FFFFFF', border: '2px solid #A855F7', boxShadow: '0 2px 16px rgba(168,85,247,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#1A1A2E' }}>🎨 Render IA concluído!</h2>
              <button type="button" onClick={() => setRenderResult(null)} className="text-sm font-medium" style={{ color: '#9CA3AF' }}>✕ Fechar</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={renderResult.render_url} alt="Render IA" className="w-full rounded-xl mb-4 object-contain" style={{ maxHeight: '420px', background: '#F8F9FA' }} />
            <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
              Estilo: <span className="font-semibold" style={{ color: '#374151' }}>{renderResult.style}</span>
              <span className="mx-2">·</span>
              {renderResult.creditos_gastos} créditos gastos
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => usarRenderParaVideo(renderResult)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: '#00D4AA', color: '#FFFFFF' }}>
                🎬 Usar para vídeo Pro
              </button>
              <button type="button" onClick={() => { setRenderResult(null); setModo('render_ia') }}
                className="py-3 px-4 rounded-xl font-semibold text-sm transition-all"
                style={{ background: '#F3E8FF', color: '#9333EA', border: '1px solid #A855F7' }}>
                🔄 Gerar novo render
              </button>
              <a href={renderResult.render_url} download target="_blank" rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl font-semibold text-sm"
                style={{ background: '#F1F3F5', color: '#374151', border: '1px solid #E5E7EB' }}>
                ⬇ Download
              </a>
            </div>
          </div>
        )}

        {/* Histórico — Vídeos */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1A1A2E' }}>Os meus vídeos</h2>
          {videos.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Ainda não geraste nenhum vídeo.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(video => <VideoCard key={video.id} video={video} />)}
            </div>
          )}
        </div>

        {/* Histórico — Renders */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1A1A2E' }}>Os meus renders</h2>
          {renders.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="text-4xl mb-3">🎨</div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Ainda não geraste nenhum Render IA.</p>
              <button type="button" onClick={() => { setModo('render_ia'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg"
                style={{ background: '#F3E8FF', color: '#9333EA', border: '1px solid #A855F7' }}>
                Experimentar Render IA →
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {renders.map(render => <RenderCard key={render.id} render={render} onUsar={usarRenderParaVideo} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function UploadZone({ accept, preview, videoName, label, dragOver, onDragOver, onDragLeave, onDrop, onClick, onClear }: {
  accept: 'image' | 'video' | 'plan'
  preview: string | null
  videoName?: string
  label?: string
  dragOver: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  onClear: () => void
}) {
  const defaultLabel =
    accept === 'video' ? 'Arrasta um vídeo ou clica para selecionar' :
    accept === 'plan'  ? 'Arrasta a planta ou clica para selecionar' :
    'Arrasta uma foto ou clica para selecionar'

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
          <div className="text-3xl mb-2">{accept === 'video' ? '🎬' : accept === 'plan' ? '📐' : '📷'}</div>
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>{label || defaultLabel}</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            {accept === 'video' ? 'MP4, MOV · máx. 50MB' : accept === 'plan' ? 'JPG, PNG, WEBP, PDF · máx. 10MB' : 'JPG, PNG, WEBP · máx. 10MB'}
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
          <video src={video.video_url} controls preload="auto" playsInline className="w-full h-full object-cover" />
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

function RenderCard({ render, onUsar }: { render: Render; onUsar: (r: Render) => void }) {
  const statusColor: Record<string, string> = { completed: '#16A34A', processing: '#CA8A04', pending: '#6B7280', failed: '#DC2626' }
  const statusBg:    Record<string, string> = { completed: '#F0FDF4', processing: '#FEF9C3', pending: '#F1F3F5', failed: '#FEF2F2' }
  const statusLabel: Record<string, string> = { completed: 'Concluído', processing: 'A processar', pending: 'Na fila', failed: 'Erro' }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: '#F1F3F5' }}>
        {render.status === 'completed' && render.render_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={render.render_url} alt="Render IA" className="w-full h-full object-cover" />
        ) : render.status === 'processing' || render.status === 'pending' ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 animate-spin" style={{ color: '#A855F7' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>A gerar render...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl">❌</div>
            <span className="text-xs font-medium" style={{ color: '#DC2626' }}>Créditos devolvidos</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F3E8FF', color: '#9333EA' }}>
              🎨 Render IA
            </span>
            <p className="text-sm mt-1.5 leading-snug" style={{ color: '#374151' }}>
              {render.style || 'Render IA'}
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
            style={{ background: statusBg[render.status], color: statusColor[render.status] }}>
            {statusLabel[render.status]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            {render.creditos_gastos?.toLocaleString('pt-PT')}cr · {new Date(render.created_at).toLocaleDateString('pt-PT')}
          </span>
          {render.status === 'completed' && render.render_url && (
            <div className="flex gap-2">
              <button type="button" onClick={() => onUsar(render)}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg"
                style={{ background: '#F0FDF9', color: '#00B894', border: '1px solid #00D4AA' }}>
                🎬 Vídeo
              </button>
              <a href={render.render_url} download target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-2 py-1.5 rounded-lg"
                style={{ background: '#F3E8FF', color: '#9333EA', border: '1px solid #A855F7' }}>
                ⬇
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

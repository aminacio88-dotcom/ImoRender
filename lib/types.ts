export type Plano = 'free' | 'starter' | 'team' | 'agency' | 'pro' | 'enterprise'
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type Qualidade = 'std' | 'pro'
export type Modo = 'standard' | 'pro' | 'antes_depois' | 'video_video' | 'projeto_aprovado'
export type DashboardMode = Modo | 'render_ia'
export type AspectRatio = '16:9' | '9:16' | '1:1'
export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Profile {
  id: string
  email: string
  nome: string
  plano: Plano
  creditos: number
  creditos_total: number
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  user_id: string
  prompt_original: string
  prompt_otimizado: string
  duracao: number
  creditos_gastos: number
  qualidade: Qualidade
  modo: Modo
  aspect_ratio: AspectRatio
  modelo_usado: string | null
  tail_image_url: string | null
  video_input_url: string | null
  video_url: string | null
  fal_request_id: string | null
  status: VideoStatus
  created_at: string
}

export interface PlanoDB {
  id: Plano
  nome: string
  preco: number
  creditos_mensais: number
  qualidade: Qualidade
}

export interface Render {
  id: string
  user_id: string
  input_image_url: string | null
  render_url: string | null
  style: string
  prompt_original: string
  prompt_otimizado: string
  creditos_gastos: number
  status: RenderStatus
  fal_request_id: string | null
  modelo_usado: string | null
  created_at: string
}

export interface PackCreditos {
  id: string
  nome: string
  creditos: number
  preco: number
}

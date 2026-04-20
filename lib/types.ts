export type Plano = 'free' | 'starter' | 'pro' | 'agency'
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type Qualidade = 'std' | 'pro'

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
  video_url: string | null
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

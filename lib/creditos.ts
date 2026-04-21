import type { Modo } from './types'

// x10 cosmético: Standard 10s = 100cr, Pro 10s = 200cr
const TAXAS: Record<Modo, number> = {
  standard:     10,
  pro:          20,
  antes_depois: 16,
  video_video:  12,
}

export function calcularCreditos(modo: Modo, segundos: number): number {
  const taxa = TAXAS[modo]
  const total = taxa * segundos
  const decimal = total - Math.floor(total)
  return decimal >= 0.3 ? Math.ceil(total) : Math.floor(total)
}

export const FAL_MODELS: Record<Modo, string> = {
  standard:     'fal-ai/kling-video/v2.6/standard/image-to-video',
  pro:          'fal-ai/kling-video/v2.6/pro/image-to-video',
  antes_depois: 'fal-ai/kling-video/o1/image-to-video',
  video_video:  'fal-ai/kling-video/o3/standard/image-to-video',
}

export const MODO_LABELS: Record<Modo, string> = {
  standard:     'Standard',
  pro:          'Pro',
  antes_depois: 'Antes/Depois',
  video_video:  'Vídeo→Vídeo',
}

export const MODO_BADGE_COLORS: Record<Modo, string> = {
  standard:     '#E0F2FE',
  pro:          '#F0FDF4',
  antes_depois: '#FEF9C3',
  video_video:  '#FEF2F2',
}

export const MODO_BADGE_TEXT: Record<Modo, string> = {
  standard:     '#0284C7',
  pro:          '#16A34A',
  antes_depois: '#CA8A04',
  video_video:  '#DC2626',
}

export const PLANO_LABELS: Record<string, string> = {
  free:       'Free',
  starter:    'Starter',
  team:       'Team',
  agency:     'Agency',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

export const PLANO_WAIT: Record<string, string> = {
  free:       'até 15 min',
  starter:    'até 5 min',
  team:       'até 2 min',
  agency:     'prioritário',
  pro:        'até 5 min',
  enterprise: 'prioritário',
}

export const PLANO_TARGET: Record<string, string> = {
  free:    'Para experimentar',
  starter: 'Para consultores individuais',
  team:    'Para equipas pequenas',
  agency:  'Para agências médias e grandes',
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ImoRender — Vídeos com IA para imobiliários',
  description: 'Transforma qualquer imóvel num vídeo profissional em segundos. A ferramenta de IA criada para consultores imobiliários portugueses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ImoRender — Vídeos com IA para imobiliários',
  description: 'Transforma qualquer imóvel num vídeo profissional em segundos. A ferramenta de IA criada para consultores imobiliários portugueses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${inter.className} antialiased`} style={{ background: '#F8F9FA' }}>
        {children}
      </body>
    </html>
  )
}

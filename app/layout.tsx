import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FOCO 100LIMITE — Sistema de Produtividade para Concursos',
  description: 'Sistema premium de rastreamento de estudos para concurseiros e candidatos militares. Métricas avançadas, cronômetro Pomodoro, cronograma e ranking.',
  keywords: 'concurso, estudo, produtividade, pomodoro, cronograma, militar',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'FOCO 100LIMITE',
    description: 'Sistema premium de rastreamento de estudos para concurseiros e candidatos militares.',
    url: 'https://foco100limite.com',
    siteName: 'FOCO 100LIMITE',
    images: [{ url: '/logo.png' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOCO 100LIMITE',
    description: 'Sistema premium de rastreamento de estudos para concurseiros e candidatos militares.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-inter antialiased bg-gradient-dark`}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 5, 24, 0.95)',
              border: '1px solid rgba(205, 183, 255, 0.2)',
              color: 'var(--color-text-primary)',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FOCO 100LIMITE — Sistema de Produtividade para Concursos',
  description: 'Sistema premium de rastreamento de estudos para concurseiros e candidatos militares. Métricas avançadas, cronômetro Pomodoro, cronograma e ranking.',
  keywords: 'concurso, estudo, produtividade, pomodoro, cronograma, militar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-inter antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(132, 204, 22, 0.2)',
              color: '#f9fafb',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  )
}

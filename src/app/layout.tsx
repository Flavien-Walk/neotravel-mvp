import type { Metadata } from 'next'
import './globals.css'
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import FloatingAIWidget from '@/components/FloatingAIWidget'

export const metadata: Metadata = {
  title: 'NeoTravel — Transport de groupe, devis rapide et suivi commercial',
  description: 'NeoTravel centralise les demandes de transport de groupe, qualifie les trajets et génère des devis fiables pour entreprises, collectivités, associations et particuliers.',
  keywords: 'transport groupe, autocar, devis, NeoTravel, entreprises, collectivités',
}

const antiFlashScript = `try{var t=localStorage.getItem('neo_theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
      </head>
      <body className="min-h-screen bg-neo-900 text-white antialiased">
        <ThemeProvider>
          <AuthProvider>
            <SmoothScrollProvider>
              {children}
              <FloatingAIWidget />
            </SmoothScrollProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

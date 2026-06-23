import type { Metadata } from 'next'
import './globals.css'
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'NeoTravel — Transport de groupe, devis rapide et suivi commercial',
  description: 'NeoTravel centralise les demandes de transport de groupe, qualifie les trajets et génère des devis fiables pour entreprises, collectivités, associations et particuliers.',
  keywords: 'transport groupe, autocar, devis, NeoTravel, entreprises, collectivités',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neo-900 text-white antialiased">
        <AuthProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

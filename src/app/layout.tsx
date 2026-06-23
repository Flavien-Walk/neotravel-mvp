import type { Metadata } from 'next'
import './globals.css'
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider'

export const metadata: Metadata = {
  title: 'NeoTravel — Automatisation du transport de groupe',
  description: 'De la demande client au devis, sans friction. NeoTravel automatise le cycle commercial du transport de groupe — qualification, calcul déterministe, dashboard de pilotage.',
  keywords: 'transport groupe, autocar, devis, automatisation, NeoTravel',
  themeColor: '#040C1F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neo-900 text-white antialiased">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}

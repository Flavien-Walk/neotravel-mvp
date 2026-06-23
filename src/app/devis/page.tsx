import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Zap, Clock, CheckCircle } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import ChatBot from '@/components/ChatBot'

export const metadata: Metadata = { title: 'Demande de devis — NeoTravel' }

const REASSURANCES = [
  { icon: Zap, title: 'Devis instantané', desc: 'Notre système calcule votre prix en temps réel. Déterministe et précis.' },
  { icon: Clock, title: 'Réponse sous 2h', desc: 'Un conseiller valide votre devis et vous recontacte sous 2 heures ouvrées.' },
  { icon: Shield, title: 'Données sécurisées', desc: 'Vos informations restent confidentielles et ne sont jamais partagées.' },
  { icon: CheckCircle, title: 'Sans engagement', desc: 'Le devis est gratuit. Vous choisissez librement de le valider ou non.' },
]

export default function DevisPage() {
  return (
    <div className="min-h-screen bg-neo-900 flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">

          {/* Page header */}
          <div className="text-center mb-10">
            <span className="label-tag mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Devis gratuit · Sans engagement
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              Obtenez votre devis <span className="text-gradient-blue">en 3 minutes</span>
            </h1>
            <p className="mt-3 text-white/50 max-w-md mx-auto text-sm">
              Répondez aux questions. L&apos;agent collecte — le code calcule. Votre prix est déterministe et explicable.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-start">

            {/* Left — Reassurances */}
            <div className="space-y-4">
              {REASSURANCES.map((r) => (
                <div key={r.title} className="flex items-start gap-4 card-premium !p-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-neo-blue/12 border border-neo-blue/20">
                    <r.icon className="w-4.5 h-4.5 text-neo-blue" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-0.5">{r.title}</div>
                    <div className="text-xs text-white/40 leading-relaxed">{r.desc}</div>
                  </div>
                </div>
              ))}

              {/* Principle callout */}
              <div className="glass-blue rounded-2xl p-5">
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Principe de fiabilité</p>
                <blockquote className="text-sm font-semibold text-white leading-relaxed">
                  &ldquo;L&apos;agent collecte et orchestre,<br />
                  <span className="text-neo-blue">le code calcule.&rdquo;</span>
                </blockquote>
                <p className="text-xs text-white/30 mt-2">Votre devis est 100% déterministe — jamais délégué à une IA.</p>
              </div>
            </div>

            {/* Right — ChatBot */}
            <div>
              <ChatBot />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

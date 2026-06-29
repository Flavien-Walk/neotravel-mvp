import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Clock, CheckCircle, Phone } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import DevisTabSwitcher from './DevisTabSwitcher'

export const metadata: Metadata = {
  title: 'Demande de devis — NeoTravel',
  description: 'Demandez un devis de transport de groupe en 3 minutes. Gratuit, sans engagement. Réponse sous 2h ouvrées.',
}

const REASSURANCES = [
  {
    icon: Clock,
    title: 'Réponse sous 2h ouvrées',
    desc: 'Un conseiller NeoTravel valide votre devis et vous recontacte dans les deux heures ouvrées suivant votre demande.',
  },
  {
    icon: CheckCircle,
    title: 'Devis gratuit, sans engagement',
    desc: 'La demande de devis ne vous engage à rien. Vous restez entièrement libre d\'accepter ou de refuser.',
  },
  {
    icon: Shield,
    title: 'Vos données sont protégées',
    desc: 'Vos informations ne sont utilisées que pour établir votre devis. Aucune revente, aucun spam.',
  },
  {
    icon: Phone,
    title: 'Un conseiller reprend les cas complexes',
    desc: 'Circuit, demande spéciale, groupe large ? Un commercial NeoTravel prend le relais pour les situations hors standard.',
  },
]

const APRES = [
  { num: '1', title: 'Réception de votre demande', desc: 'Votre demande est enregistrée et qualifiée automatiquement.' },
  { num: '2', title: 'Calcul du devis', desc: 'Le prix est calculé selon les règles tarifaires NeoTravel (distance, durée, pax, options).' },
  { num: '3', title: 'Envoi par email', desc: 'Vous recevez le devis détaillé avec les lignes de calcul.' },
  { num: '4', title: 'Confirmation', desc: 'Vous validez et un autocariste partenaire est mobilisé.' },
]

export default function DevisPage() {
  return (
    <div className="min-h-screen bg-neo-900 flex flex-col">
      {/* Header */}
      <header className="bg-neo-900/90 backdrop-blur-xl border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/"><Logo size="sm" /></Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">

          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Votre devis de transport de groupe
            </h1>
            <p className="text-white/45 max-w-md mx-auto text-base leading-relaxed">
              Décrivez votre besoin. Le prix est calculé automatiquement —
              détaillé, ligne par ligne, sans interprétation.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-start">

            {/* Left — Reassurances + Ce qui se passe après */}
            <div className="space-y-5">
              {/* Reassurances */}
              <div className="card-neo !p-5">
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
                  Pourquoi NeoTravel ?
                </h2>
                <div className="space-y-4">
                  {REASSURANCES.map((r) => (
                    <div key={r.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neo-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <r.icon className="w-4 h-4 text-neo-blue" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm mb-0.5">{r.title}</div>
                        <div className="text-xs text-white/40 leading-relaxed">{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ce qui se passe après */}
              <div className="card-neo !p-5">
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
                  Ce qui se passe après votre demande
                </h2>
                <ol className="space-y-3">
                  {APRES.map(({ num, title, desc }) => (
                    <li key={num} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-neo-blue/20 text-neo-blue text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {num}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">{title}</div>
                        <div className="text-xs text-white/35 mt-0.5">{desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Callout */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Fiabilité du calcul</p>
                <blockquote className="text-sm font-semibold text-white leading-relaxed">
                  &ldquo;L&apos;agent collecte et orchestre,{' '}
                  <span className="text-neo-blue">le code calcule.&rdquo;</span>
                </blockquote>
                <p className="text-xs text-white/30 mt-2">
                  Votre devis est calculé par un algorithme déterministe, pas par une IA générative.
                </p>
              </div>
            </div>

            {/* Right — Formulaire guidé ou Assistant IA */}
            <div>
              <DevisTabSwitcher />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

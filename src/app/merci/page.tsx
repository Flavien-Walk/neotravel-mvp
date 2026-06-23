import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, ArrowRight, LayoutDashboard, Clock, Calculator, Bell, UserCheck } from 'lucide-react'
import Logo from '@/components/brand/Logo'

export const metadata: Metadata = { title: 'Demande envoyée — NeoTravel' }

const TIMELINE = [
  { icon: CheckCircle, label: 'Demande enregistrée', desc: 'Vos données sont stockées et sécurisées.', done: true, color: '#22C55E' },
  { icon: Calculator,  label: 'Devis calculé',       desc: 'calculer_devis() génère votre prix déterministe.', done: true, color: '#4B8EF8' },
  { icon: UserCheck,   label: 'Validation conseiller', desc: 'Un expert NeoTravel vérifie et valide le devis.', done: false, color: '#F59E0B' },
  { icon: Bell,        label: 'Envoi sous 2h',       desc: 'Vous recevez le devis par email.', done: false, color: '#818CF8' },
]

export default function MerciPage() {
  return (
    <div className="min-h-screen bg-neo-900 flex flex-col">
      <header className="glass border-b border-white/6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">

          {/* Success badge */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-400" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(34,197,94,0.1)' }} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Demande reçue !</h1>
            <p className="text-white/50 text-sm max-w-xs mx-auto">
              Votre demande est enregistrée. Un conseiller vous recontactera sous 2 heures ouvrées.
            </p>
          </div>

          {/* Timeline */}
          <div className="card-premium !p-6 mb-6">
            <h2 className="text-sm font-semibold text-white/70 mb-5 uppercase tracking-wider">Ce qu&apos;il se passe maintenant</h2>
            <div className="space-y-4">
              {TIMELINE.map((item, i) => (
                <div key={item.label} className="flex items-start gap-4">
                  {/* Line */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border
                      ${item.done ? 'border-green-500/40 bg-green-500/12' : 'border-white/10 bg-white/4'}`}>
                      <item.icon className="w-4 h-4" style={{ color: item.done ? '#22C55E' : '#6B7280' }} />
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 rounded-full ${item.done ? 'bg-green-500/30' : 'bg-white/8'}`} />
                    )}
                  </div>
                  <div className="pt-1 min-w-0">
                    <div className={`text-sm font-medium mb-0.5 ${item.done ? 'text-white' : 'text-white/50'}`}>{item.label}</div>
                    <div className="text-xs text-white/30 leading-relaxed">{item.desc}</div>
                  </div>
                  {item.done && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/12 text-green-400 border border-green-500/20 mt-1 shrink-0">
                      Fait
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Spam note */}
          <div className="text-center text-xs text-white/25 mb-6">
            Vérifiez vos spams si vous ne recevez pas d&apos;email dans les 2 heures.
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="btn-ghost flex-1 !justify-center gap-2">
              <ArrowRight className="w-4 h-4 rotate-180" /> Retour accueil
            </Link>
            <Link href="/admin" className="btn-primary flex-1 !justify-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Voir le dashboard
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/devis" className="text-xs text-white/25 hover:text-white/50 transition-colors">
              Soumettre une nouvelle demande →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

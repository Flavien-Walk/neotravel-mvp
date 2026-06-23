import AnimatedSection from '@/components/ui/AnimatedSection'
import { UserCircle2, LayoutDashboard, Server, ArrowRight } from 'lucide-react'

type Journey = {
  icon: typeof UserCircle2
  label: string
  role: string
  color: string
  bg: string
  border: string
  steps: { title: string; desc: string }[]
}

const JOURNEYS: Journey[] = [
  {
    icon: UserCircle2,
    label: 'Client',
    role: 'Entreprise, collectivité, association…',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    steps: [
      { title: 'Demande en ligne',       desc: 'Il remplit le formulaire guidé : trajet, date, passagers, options.' },
      { title: 'Confirmation immédiate', desc: 'Sa demande est enregistrée et confirmée instantanément.' },
      { title: 'Réception du devis',     desc: 'Il reçoit son devis détaillé par email sous 2h ouvrées.' },
      { title: 'Validation',             desc: 'Il accepte, pose des questions, ou est recontacté si besoin.' },
    ],
  },
  {
    icon: LayoutDashboard,
    label: 'Commercial',
    role: 'Chargé de compte NeoTravel',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    steps: [
      { title: 'Vue du pipeline',       desc: 'Il voit les nouveaux leads, les devis en attente, les relances.' },
      { title: 'Ouverture du dossier',  desc: 'Il consulte le trajet, le contact, et le score de complétude.' },
      { title: 'Calcul du devis',       desc: 'Il lance le calcul — le moteur génère le prix en quelques secondes.' },
      { title: 'Envoi et suivi',        desc: 'Le devis part par email. Il relance ou escalade si nécessaire.' },
    ],
  },
  {
    icon: Server,
    label: 'Système',
    role: 'Ce que NeoTravel fait automatiquement',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    steps: [
      { title: 'Lead enregistré',         desc: 'Chaque demande est stockée avec horodatage et identifiant unique.' },
      { title: 'Score de complétude',     desc: 'Les champs manquants sont détectés. Le dossier est classé automatiquement.' },
      { title: 'Calcul du devis',         desc: 'calculer_devis() applique les règles tarifaires de façon déterministe.' },
      { title: 'Email + log enregistrés', desc: 'Chaque email envoyé, chaque action, chaque statut est tracé et auditable.' },
    ],
  },
]

export default function UserJourneySection() {
  return (
    <section id="comment-ca-marche" className="section-padding bg-neo-900 relative overflow-hidden">
      {/* Accent line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="label-tag mb-4">Comment ça marche</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Trois points de vue,{' '}
              <span className="text-gradient-blue">un seul parcours fluide.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Client, commercial, système — chacun a son rôle. NeoTravel coordonne tout.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6">
          {JOURNEYS.map(({ icon: Icon, label, role, color, bg, border, steps }, col) => (
            <AnimatedSection key={label} delay={col * 0.1}>
              <div className={`rounded-2xl border ${border} h-full flex flex-col`} style={{ background: 'rgba(255,255,255,0.02)' }}>
                {/* Header */}
                <div className={`px-6 pt-6 pb-4 border-b ${border}`}>
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className={`text-lg font-bold ${color}`}>{label}</div>
                  <div className="text-white/35 text-xs mt-0.5">{role}</div>
                </div>

                {/* Steps */}
                <div className="px-6 py-5 flex-1">
                  <ol className="space-y-4">
                    {steps.map(({ title, desc }, i) => (
                      <li key={title} className="flex gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${bg} ${color}`}>
                            {i + 1}
                          </span>
                          {i < steps.length - 1 && (
                            <div className="w-px flex-1 mt-1 mb-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                          )}
                        </div>
                        <div className="pb-1">
                          <div className="text-sm font-semibold text-white mb-0.5">{title}</div>
                          <div className="text-xs text-white/40 leading-relaxed">{desc}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Bottom callout */}
        <AnimatedSection delay={0.4}>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Client soumet
            </span>
            <ArrowRight className="w-4 h-4 text-white/20 hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Système qualifie et calcule
            </span>
            <ArrowRight className="w-4 h-4 text-white/20 hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Commercial valide et envoie
            </span>
            <ArrowRight className="w-4 h-4 text-white/20 hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Client reçoit son devis
            </span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

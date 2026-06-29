import AnimatedSection from '@/components/ui/AnimatedSection'
import { SlidersHorizontal, Calculator, Send, Bell, UserCheck } from 'lucide-react'

const WHAT_WE_DO = [
  {
    icon: SlidersHorizontal,
    title: 'Qualification automatique',
    desc: 'Chaque demande est analysée dès sa réception : informations complètes ou manquantes, urgence, complexité. Rien n\'est laissé sans statut.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Calculator,
    title: 'Calcul du devis',
    desc: 'Le moteur métier applique des règles tarifaires explicites : distance, durée, passagers, options, coefficients, TVA. Le même trajet donne toujours le même prix.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Send,
    title: 'Envoi du devis par email',
    desc: 'Le devis formaté est envoyé avec le détail ligne par ligne. Le client comprend ce qu\'il paie. Le statut passe automatiquement à "Devis envoyé".',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Bell,
    title: 'Relance si pas de réponse',
    desc: 'Sans réponse sous 48h, une relance est préparée pour le commercial. Elle rappelle le devis, le montant et le lien de suivi. Aucune relance n\'est oubliée.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: UserCheck,
    title: 'Reprise humaine sur les cas complexes',
    desc: 'Circuit multi-étapes, groupe de plus de 85 personnes, ville hors base — ces demandes sont flaggées et transmises à un conseiller NeoTravel pour traitement personnalisé.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
]

export default function SolutionFlow() {
  return (
    <section id="parcours" className="section-padding bg-neo-800 relative overflow-hidden">
      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="label-tag mb-4">Ce que NeoTravel gère pour vous</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Chaque demande est prise en charge.{' '}
              <span className="text-gradient-blue">De bout en bout.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Dès que vous soumettez votre demande, NeoTravel qualifie, calcule, envoie et relance —
              sans que vous ayez à relancer vous-même.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHAT_WE_DO.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <AnimatedSection key={title} delay={i * 0.07}>
              <div className="card-neo h-full">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} mb-4`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            </AnimatedSection>
          ))}

          <AnimatedSection delay={0.35}>
            <div
              className="rounded-2xl p-6 flex flex-col justify-between h-full"
              style={{
                background: 'rgba(37,99,235,0.07)',
                border: '1px solid rgba(37,99,235,0.2)',
              }}
            >
              <p className="font-semibold text-white mb-3 leading-snug">
                &ldquo;Votre demande est qualifiée, votre devis est préparé, votre client est suivi.&rdquo;
              </p>
              <p className="text-white/40 text-sm leading-relaxed">
                De la réception à la signature, chaque étape est automatisée et tracée.
                Votre équipe garde la main uniquement sur les cas complexes.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

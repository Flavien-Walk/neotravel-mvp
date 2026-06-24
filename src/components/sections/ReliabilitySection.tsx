import AnimatedSection from '@/components/ui/AnimatedSection'
import { Zap, BookOpen, UserCheck, Lock, AlertTriangle } from 'lucide-react'

const PILLARS = [
  {
    icon: Zap,
    title: 'Prix déterministe',
    desc: 'Le même trajet, les mêmes passagers, les mêmes options → toujours le même prix. Aucune variabilité selon qui traite la demande.',
  },
  {
    icon: BookOpen,
    title: 'Devis expliqué ligne par ligne',
    desc: 'Distance, durée, péages, coefficient nuit/week-end, surcharge carburant, TVA — vous voyez comment votre prix est composé. Aucune boîte noire.',
  },
  {
    icon: AlertTriangle,
    title: 'Jamais de prix inventé par IA',
    desc: 'L\'IA peut aider à structurer une demande, mais le prix est calculé par le moteur métier NeoTravel — selon des règles auditables, pas des probabilités.',
  },
  {
    icon: UserCheck,
    title: 'Un conseiller sur les cas complexes',
    desc: 'Aucun cas particulier n\'est traité automatiquement sans contrôle humain. Le système flagge, le conseiller décide et vous contacte directement.',
  },
  {
    icon: Lock,
    title: 'Données sécurisées',
    desc: 'Vos informations sont stockées sur MongoDB Atlas. Aucune donnée personnelle ne transite en clair. Votre demande reste confidentielle.',
  },
]

export default function ReliabilitySection() {
  return (
    <section id="fiabilite" className="section-padding bg-neo-900 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="label-tag mb-4">Pourquoi faire confiance au devis</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Un prix calculé par du code,{' '}
              <span className="text-gradient-blue">pas estimé par une IA.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-2xl mx-auto">
              Chaque centime de votre devis est justifiable. Le moteur de calcul suit
              des règles métier explicites — vous pouvez demander à n&apos;importe quel
              conseiller NeoTravel de vous expliquer le prix.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map(({ icon: Icon, title, desc }, i) => (
            <AnimatedSection key={title} delay={i * 0.07}>
              <div className="card-neo h-full flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-neo-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-neo-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}

          <AnimatedSection delay={0.35}>
            <div
              className="rounded-2xl p-6 h-full flex flex-col justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.04) 100%)',
                border: '1px solid rgba(37,99,235,0.25)',
              }}
            >
              <p className="text-white text-sm font-semibold mb-2">
                Reprise humaine prévue
              </p>
              <p className="text-white/40 text-sm leading-relaxed">
                Pour les groupes hors standard, les circuits multi-étapes ou les demandes spéciales,
                un conseiller NeoTravel prend le relais et vous contacte directement.
                Aucun cas n&apos;est laissé sans réponse.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

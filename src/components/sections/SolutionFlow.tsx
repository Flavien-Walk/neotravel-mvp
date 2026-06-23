import AnimatedSection from '@/components/ui/AnimatedSection'
import { MessageSquare, SlidersHorizontal, Calculator, Send, Bell, LayoutDashboard, UserCheck } from 'lucide-react'

const STEPS = [
  {
    icon: MessageSquare,
    step: '01',
    title: 'Demande client',
    desc: 'Le client remplit le formulaire guidé : trajet, date, nombre de passagers, options. L\'assistant collecte tout en quelques minutes.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: SlidersHorizontal,
    step: '02',
    title: 'Qualification automatique',
    desc: 'La demande est scorée selon sa complétude. Les champs manquants sont identifiés et la demande est classée : qualifiée, incomplète ou cas complexe.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Calculator,
    step: '03',
    title: 'Calcul du devis',
    desc: 'Un algorithme déterministe calcule le prix : distance, durée, nombre de pax, options, coefficients tarifaires. Le devis est généré en moins de 15 secondes.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Send,
    step: '04',
    title: 'Envoi au client',
    desc: 'Le devis est formaté et envoyé par email au client avec le détail des lignes de calcul. Le statut du lead passe automatiquement à "Devis envoyé".',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Bell,
    step: '05',
    title: 'Relance planifiée',
    desc: 'Si pas de réponse sous 48 h, une relance est déclenchée. Elle peut être automatisée ou validée manuellement depuis le dashboard.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: LayoutDashboard,
    step: '06',
    title: 'Suivi dashboard',
    desc: 'Chaque lead et chaque devis sont visibles dans le dashboard commercial. Statuts, logs, métriques : tout est centralisé et filtrable.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: UserCheck,
    step: '07',
    title: 'Reprise humaine',
    desc: 'Les cas complexes (circuit, demande spéciale, client stratégique) sont flaggés et transmis au commercial pour traitement manuel.',
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
            <span className="label-tag mb-4">Le parcours</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              De la demande au suivi,{' '}
              <span className="text-gradient-blue">7 étapes automatisées</span>
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Voici ce que NeoTravel fait à votre place — de la réception du lead jusqu&apos;à la relance planifiée.
            </p>
          </div>
        </AnimatedSection>

        {/* Vertical timeline on mobile, 2-col grid on desktop */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.25) 10%, rgba(37,99,235,0.25) 90%, transparent)' }} />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.slice(0, 4).map(({ icon: Icon, step, title, desc, color, bg }, i) => (
              <AnimatedSection key={step} delay={i * 0.07}>
                <div className="card-neo h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-xs font-bold text-white/20 tracking-widest">{step}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            {STEPS.slice(4).map(({ icon: Icon, step, title, desc, color, bg }, i) => (
              <AnimatedSection key={step} delay={(i + 4) * 0.07}>
                <div className="card-neo h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-xs font-bold text-white/20 tracking-widest">{step}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>

        {/* Principle callout */}
        <AnimatedSection delay={0.5}>
          <div
            className="mt-10 rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{
              background: 'rgba(37,99,235,0.07)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-semibold text-white mb-1">
                &ldquo;L&apos;agent collecte et orchestre, le code calcule.&rdquo;
              </p>
              <p className="text-white/40 text-sm">
                Aucune génération de prix par IA. Le calcul suit des règles métier explicites, auditables et reproductibles.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

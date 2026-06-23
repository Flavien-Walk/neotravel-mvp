import AnimatedSection from '@/components/ui/AnimatedSection'
import { Zap, BookOpen, GitBranch, Shield, UserCheck } from 'lucide-react'

const PILLARS = [
  {
    icon: Zap,
    title: 'Calcul déterministe',
    desc: 'Le même trajet, les mêmes passagers, les mêmes options → toujours le même prix. Aucune variabilité, aucune erreur humaine.',
  },
  {
    icon: BookOpen,
    title: 'Devis explicables',
    desc: 'Chaque devis expose ses lignes de calcul : distance, durée, péages, coefficient nuit/week-end, surcharge carburant. Le client comprend ce qu\'il paie.',
  },
  {
    icon: GitBranch,
    title: 'Logs complets',
    desc: 'Chaque action est horodatée et logguée : création du lead, calcul du devis, envoi email, relance, reprise humaine. Audit trail complet.',
  },
  {
    icon: Shield,
    title: 'Données sécurisées',
    desc: 'Les données clients sont stockées sur MongoDB Atlas. Aucune donnée personnelle ne transite en clair. RGPD-ready pour la production.',
  },
  {
    icon: UserCheck,
    title: 'Reprise humaine prévue',
    desc: 'Aucun cas complexe n\'est traité automatiquement sans contrôle humain. Le système flagge, le commercial décide. L\'IA n\'a pas le dernier mot.',
  },
]

const CODE = `// calculer_devis.ts
function calculerDevis(lead: Lead): Devis {
  const dist   = getDistance(lead.depart, lead.destination)
  const duree  = getDuree(dist, lead.type_trajet)
  const base   = dist * TARIF_KM + duree * TARIF_HEURE
  const peages = getPeages(lead.depart, lead.destination)

  // Coefficients tarifaires
  const coeff_pax    = getCoefficientPax(lead.nb_passagers)
  const coeff_timing = getCoefficientTiming(lead.date_depart)
  const coeff_option = sumOptions(lead.options)

  const prix_ht  = base * coeff_pax * coeff_timing + peages + coeff_option
  const prix_ttc = prix_ht * 1.10  // TVA transport 10 %

  return { prix_ht, prix_ttc, lignes_calcul: [...] }
}`

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
            <span className="label-tag mb-4">Pourquoi le devis est fiable</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Un prix calculé par du code,{' '}
              <span className="text-gradient-blue">pas par une IA.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-2xl mx-auto">
              Le moteur de calcul suit des règles métier explicites. Chaque centime est justifiable,
              chaque décision est logguée.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Pillars */}
          <div className="space-y-4">
            {PILLARS.map(({ icon: Icon, title, desc }, i) => (
              <AnimatedSection key={title} delay={i * 0.07}>
                <div className="flex gap-4 card-neo">
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
          </div>

          {/* Code snippet */}
          <AnimatedSection delay={0.2}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(37,99,235,0.2)' }}
            >
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ background: 'rgba(37,99,235,0.08)', borderBottom: '1px solid rgba(37,99,235,0.15)' }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                <span className="ml-3 text-xs text-white/30 font-mono">calculer_devis.ts</span>
              </div>
              <pre
                className="p-5 text-xs leading-relaxed overflow-x-auto font-mono"
                style={{ background: 'rgba(3,13,32,0.8)', color: '#94A3B8' }}
              >
                <code>
                  {CODE.split('\n').map((line, i) => {
                    let color = '#94A3B8'
                    if (line.trim().startsWith('//'))    color = '#4B5563'
                    if (line.includes('function') || line.includes('return')) color = '#60A5FA'
                    if (line.includes('const '))        color = '#C4B5FD'
                    return (
                      <span key={i} style={{ color, display: 'block' }}>{line}</span>
                    )
                  })}
                </code>
              </pre>

              <div
                className="px-5 py-4"
                style={{ background: 'rgba(37,99,235,0.06)', borderTop: '1px solid rgba(37,99,235,0.15)' }}
              >
                <p className="text-white/40 text-xs font-mono">
                  → <span className="text-neo-blue">prix_ht</span>, <span className="text-neo-blue">lignes_calcul</span>, <span className="text-neo-blue">coefficients</span> — tout est stocké dans MongoDB
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

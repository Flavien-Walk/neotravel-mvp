import { Hourglass, PenLine, BellOff, Eye, TrendingDown } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'

const PROBLEMS = [
  {
    icon: Hourglass,
    stat: '60',
    unit: 'leads / jour',
    title: 'Trop de volume pour une seule personne',
    desc: 'Un commercial reçoit 60 demandes par jour. Chaque devis prend 20 à 40 minutes à constituer manuellement. Le calcul est vite dépassé.',
  },
  {
    icon: PenLine,
    stat: '20–40',
    unit: 'min par devis',
    title: 'Devis faits à la main, sans traçabilité',
    desc: 'Calcul sous Excel, prix recopié dans un email, aucun historique. Si le client rappelle, impossible de retrouver la version envoyée.',
  },
  {
    icon: BellOff,
    stat: '~30 %',
    unit: 'de relances oubliées',
    title: 'Relances non systématiques',
    desc: 'Un devis sans réponse sous 48 h doit être relancé. Sans système, une relance sur trois ne part jamais.',
  },
  {
    icon: Eye,
    stat: '0',
    unit: 'visibilité',
    title: 'Aucune vue sur le pipeline',
    desc: 'Impossible de savoir combien de devis sont en attente, combien ont été acceptés, ni quels leads n\'ont jamais été contactés.',
  },
  {
    icon: TrendingDown,
    stat: '15 %',
    unit: 'de leads perdus',
    title: 'Leads payants non recontactés',
    desc: 'Des entreprises prêtes à signer attendent trop longtemps et choisissent un concurrent. La perte est directe et chiffrable.',
  },
]

export default function ProblemSection() {
  return (
    <section id="probleme" className="section-padding bg-neo-900 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="label-tag mb-4">Le problème</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              60 leads par jour, un commercial,{' '}
              <span className="text-white/40">aucun outil.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-2xl mx-auto">
              Ce n&apos;est pas un problème de volonté. C&apos;est un problème de volume et d&apos;outillage.
              Voici ce qui se passe concrètement, chaque jour, sans NeoTravel.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROBLEMS.map(({ icon: Icon, stat, unit, title, desc }, i) => (
            <AnimatedSection key={title} delay={i * 0.07}>
              <div className="card-neo h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neo-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-neo-blue" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white">{stat}</span>
                    <span className="text-white/35 text-sm ml-1.5">{unit}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed flex-1">{desc}</p>
              </div>
            </AnimatedSection>
          ))}

          <AnimatedSection delay={0.35}>
            <div
              className="rounded-2xl p-6 flex flex-col justify-between h-full"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(37,99,235,0.05) 100%)',
                border: '1px solid rgba(37,99,235,0.3)',
              }}
            >
              <p className="text-white/55 text-sm leading-relaxed mb-5">
                La somme de ces frictions représente des milliers d&apos;euros
                de chiffre d&apos;affaires non réalisé — chaque mois.
              </p>
              <div>
                <div className="text-3xl font-bold text-neo-blue mb-1">NeoTravel</div>
                <div className="text-white/40 text-sm">automatise chaque étape.</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

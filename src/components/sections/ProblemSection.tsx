import { Inbox, Clock, Eye, BellOff, MessageSquareOff } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'

const PROBLEMS = [
  {
    icon: Inbox,
    title: 'Des demandes dispersées par email',
    desc: 'Chaque demande arrive par email, WhatsApp ou téléphone. Sans structure, impossible de savoir ce qui a été traité, ce qui attend, ce qui est perdu.',
    who: 'client',
  },
  {
    icon: Clock,
    title: 'Des devis longs à constituer',
    desc: 'Distance, durée, passagers, options, péages, coefficients — un devis de transport de groupe prend 20 à 40 minutes à calculer manuellement. Et il n\'est pas traçable.',
    who: 'commercial',
  },
  {
    icon: Eye,
    title: 'Impossible de suivre l\'avancement',
    desc: '"Mon devis est prêt ?" — sans outil, le client attend un email qui n\'arrive pas. Le commercial a perdu la trace de la demande dans sa boîte mail.',
    who: 'client',
  },
  {
    icon: BellOff,
    title: 'Des relances oubliées',
    desc: 'Un devis sans réponse sous 48 h doit être relancé. Sans système, une relance sur trois ne part jamais. Le lead disparaît, la vente aussi.',
    who: 'commercial',
  },
  {
    icon: MessageSquareOff,
    title: 'Aucune communication claire',
    desc: 'Le client ne sait pas pourquoi son devis coûte ce prix. Sans explication ligne par ligne, la confiance ne s\'établit pas et la signature tarde.',
    who: 'client',
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
              Un devis de transport de groupe,{' '}
              <span className="text-white/40">c&apos;est rarement simple.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-2xl mx-auto">
              Date, passagers, options, urgence, contraintes — chaque demande est différente.
              Sans outil dédié, chaque étape prend du temps et crée des frictions des deux côtés.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROBLEMS.map(({ icon: Icon, title, desc, who }, i) => (
            <AnimatedSection key={title} delay={i * 0.07}>
              <div className="card-neo h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neo-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-neo-blue" />
                  </div>
                  <span className={`mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    who === 'client'
                      ? 'bg-blue-500/15 text-blue-300'
                      : 'bg-violet-500/15 text-violet-300'
                  }`}>
                    {who === 'client' ? 'Côté client' : 'Côté commercial'}
                  </span>
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
                Ces frictions représentent des demandes abandonnées, des devis jamais envoyés
                et des clients qui choisissent un concurrent — chaque semaine.
              </p>
              <div>
                <div className="text-3xl font-bold text-neo-blue mb-1">NeoTravel</div>
                <div className="text-white/40 text-sm">structure et suit chaque demande.</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

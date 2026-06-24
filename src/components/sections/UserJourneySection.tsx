import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'

const STEPS = [
  {
    num: '01',
    title: 'Décrivez votre besoin',
    desc: 'Trajet, date, nombre de passagers, options. Le formulaire guidé structure votre demande en quelques minutes — sans email, sans téléphone.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    num: '02',
    title: 'NeoTravel qualifie votre demande',
    desc: 'Votre dossier est enregistré et vérifié automatiquement. Les informations manquantes sont identifiées. Votre demande est classée et prise en charge.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  {
    num: '03',
    title: 'Le devis est calculé et envoyé',
    desc: 'Le moteur de calcul NeoTravel génère un devis détaillé — distance, durée, passagers, options, TVA. Vous le recevez par email avec le détail ligne par ligne.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    num: '04',
    title: 'Vous suivez l\'avancement',
    desc: 'Un lien de suivi est inclus dans votre email de confirmation. Vous voyez en temps réel où en est votre demande — sans créer de compte si vous le souhaitez.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
]

export default function UserJourneySection() {
  return (
    <section id="comment-ca-marche" className="section-padding bg-neo-900 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="label-tag mb-4">Comment ça marche</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
              De la demande au devis,{' '}
              <span className="text-gradient-blue">en 4 étapes.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Répondez à quelques questions. NeoTravel s&apos;occupe du reste :
              qualification, calcul, envoi, suivi.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map(({ num, title, desc, color, bg, border }, i) => (
            <AnimatedSection key={num} delay={i * 0.09}>
              <div
                className={`rounded-2xl border ${border} h-full flex flex-col p-6`}
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <span className={`text-sm font-bold ${color}`}>{num}</span>
                </div>
                <h3 className="font-semibold text-white text-base mb-3">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed flex-1">{desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/devis" className="btn-gold gap-2">
              Faire une demande maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-white/35 text-sm">
              Devis gratuit · Réponse sous 2h ouvrées · Sans engagement
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

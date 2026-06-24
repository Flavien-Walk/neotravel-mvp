import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function FinalCTA() {
  return (
    <section className="section-padding bg-neo-900 relative overflow-hidden">
      {/* Top line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />
      {/* Glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center bottom, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
      />

      <div className="container-neo relative z-10 text-center">
        <AnimatedSection>
          <span className="label-tag mb-6 inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Devis gratuit · Sans engagement
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-5 leading-tight">
            Prêt à organiser votre déplacement ?<br />
            <span className="text-gradient-blue">Demandez votre devis maintenant.</span>
          </h2>

          <p className="text-white/45 text-lg max-w-xl mx-auto mb-10">
            Remplissez le formulaire en 3 minutes. Un conseiller NeoTravel prépare
            votre devis et vous l&apos;envoie par email sous 2h ouvrées.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/devis" className="btn-gold gap-2 !px-8 !py-4 !text-base">
              Demander un devis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:commercial@neotravel.fr"
              className="btn-ghost gap-2 !px-6 !py-4 !text-base"
            >
              <Mail className="w-4 h-4" />
              Parler à un conseiller
            </a>
          </div>

          {/* Réassurances */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px max-w-2xl mx-auto"
            style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
            {[
              { value: 'Gratuit',   label: 'Devis sans engagement' },
              { value: '< 2h',     label: 'Délai de réponse' },
              { value: 'Email',    label: 'Suivi par lien de tracking' },
              { value: 'Humain',   label: 'Conseiller si cas complexe' },
            ].map(({ value, label }) => (
              <div key={label} className="px-4 py-5" style={{ background: 'rgba(3,13,32,0.7)' }}>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-white/35 text-xs mt-1 leading-snug">{label}</div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-white/20 text-xs">
            Espace commercial NeoTravel ·{' '}
            <Link href="/login" className="hover:text-white/40 transition-colors">Connexion</Link>
            {' '}·{' '}
            <Link href="/register" className="hover:text-white/40 transition-colors">Créer un compte</Link>
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}

import Link from 'next/link'
import { ArrowRight, LayoutDashboard } from 'lucide-react'
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
            Disponible maintenant
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-5 leading-tight">
            Testez le parcours complet<br />
            <span className="text-gradient-blue">en moins de 3 minutes.</span>
          </h2>

          <p className="text-white/45 text-lg max-w-xl mx-auto mb-10">
            Faites une vraie demande de devis, voyez le calcul s&apos;effectuer,
            et explorez le dashboard avec les données générées.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/devis" className="btn-gold gap-2 !px-8 !py-4 !text-base">
              Faire une demande test
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register" className="btn-ghost gap-2 !px-6 !py-4 !text-base">
              <LayoutDashboard className="w-4 h-4" />
              Créer un compte
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px max-w-2xl mx-auto"
            style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
            {[
              { value: '60+',   label: 'leads / jour' },
              { value: '< 15s', label: 'calcul devis' },
              { value: '100 %', label: 'déterministe' },
              { value: '∞',     label: 'scalable' },
            ].map(({ value, label }) => (
              <div key={label} className="px-4 py-5" style={{ background: 'rgba(3,13,32,0.7)' }}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-white/35 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

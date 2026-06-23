'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, LayoutDashboard, MessageSquare } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function FinalCTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(75,142,248,0.12) 0%, transparent 70%)' }} />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Prêt à tester le parcours{' '}
              <span className="text-gradient-blue">complet</span>&nbsp;?
            </h2>
            <p className="text-white/50 mb-10 text-lg">
              Soumettez une vraie demande, voyez le devis calculé en temps réel, et explorez le dashboard de pilotage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/devis" className="btn-gold !px-8 !py-4 text-base gap-2">
                <MessageSquare className="w-4 h-4" />
                Lancer une demande test
              </Link>
              <Link href="/admin" className="btn-ghost !px-8 !py-4 text-base gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Explorer le dashboard
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* Bottom stats */}
        <AnimatedSection delay={0.3} className="mt-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: '60+',   unit: 'leads / jour', desc: 'flux entrant traité' },
              { val: '< 2h',  unit: 'ouvrées',      desc: 'délai de réponse' },
              { val: '100%',  unit: 'déterministe',  desc: 'calcul des devis' },
              { val: '∞',     unit: 'traçabilité',   desc: 'logs complets' },
            ].map((s) => (
              <div key={s.desc} className="card-premium text-center">
                <div className="text-2xl font-bold text-white mb-0.5">
                  {s.val} <span className="text-neo-blue text-xs font-normal">{s.unit}</span>
                </div>
                <div className="text-xs text-white/35">{s.desc}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

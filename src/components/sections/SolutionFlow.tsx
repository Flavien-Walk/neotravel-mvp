'use client'

import { motion } from 'framer-motion'
import { MessageSquare, CheckCircle, Calculator, Send, Bell, LayoutDashboard, UserCheck, ChevronRight } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionLabel from '@/components/ui/SectionLabel'

const STEPS = [
  { icon: MessageSquare, label: 'Lead entrant',     desc: 'Le client soumet sa demande via le chatbot guidé',          color: '#4B8EF8', num: '01' },
  { icon: CheckCircle,   label: 'Qualification',    desc: 'Score de complétude calculé automatiquement',               color: '#22D3EE', num: '02' },
  { icon: Calculator,    label: 'Calcul devis',     desc: 'calculer_devis() — déterministe, auditable, reproductible', color: '#818CF8', num: '03' },
  { icon: Send,          label: 'Envoi devis',      desc: 'Devis envoyé au client, statut mis à jour',                 color: '#F59E0B', num: '04' },
  { icon: Bell,          label: 'Relances',         desc: 'Relances automatiques si absence de réponse',               color: '#F43F5E', num: '05' },
  { icon: LayoutDashboard,label:'Dashboard',        desc: 'Vue complète du pipeline pour l\'équipe commerciale',       color: '#4B8EF8', num: '06' },
  { icon: UserCheck,     label: 'Reprise humaine',  desc: 'Cas complexes transmis au commercial pour clôture',         color: '#22D3EE', num: '07' },
]

export default function SolutionFlow() {
  return (
    <section id="solution" className="section-padding">
      <div className="container-neo">
        <AnimatedSection className="text-center mb-16">
          <SectionLabel>La solution</SectionLabel>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white leading-tight">
            Un pipeline commercial <span className="text-gradient-blue">entièrement automatisé</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            De la première demande à la clôture, chaque étape est instrumentée, traçable et pilotable depuis le dashboard.
          </p>
        </AnimatedSection>

        {/* Flow */}
        <div className="relative">
          {/* Connecting line desktop */}
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(75,142,248,0.3) 10%, rgba(75,142,248,0.3) 90%, transparent)' }} />

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 lg:gap-2">
            {STEPS.map((step, i) => (
              <AnimatedSection key={step.num} delay={i * 0.07}>
                <motion.div
                  className="flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300 group cursor-default"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  whileHover={{
                    background: `${step.color}0D`,
                    borderColor: `${step.color}30`,
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="relative mb-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300"
                      style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                      <step.icon className="w-6 h-6 transition-colors duration-300" style={{ color: step.color }} />
                    </div>
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                      style={{ background: step.color, color: '#040C1F' }}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="font-semibold text-white text-xs mb-1 leading-tight">{step.label}</div>
                  <div className="text-[10px] text-white/35 leading-relaxed hidden sm:block">{step.desc}</div>
                </motion.div>

                {/* Arrow */}
                {i < STEPS.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-2 mb-1">
                    <ChevronRight className="w-3 h-3 text-white/20 rotate-90" />
                  </div>
                )}
              </AnimatedSection>
            ))}
          </div>
        </div>

        {/* Key insight */}
        <AnimatedSection delay={0.5} className="mt-12">
          <div className="glass-blue rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto">
            <p className="text-white/60 text-sm mb-2">Principe fondamental</p>
            <blockquote className="text-xl sm:text-2xl font-bold text-white">
              &ldquo;<span className="text-gradient-blue">L&apos;agent collecte et orchestre</span>,<br className="hidden sm:block" />
              le code calcule.&rdquo;
            </blockquote>
            <p className="text-white/40 text-sm mt-3 max-w-md mx-auto">
              Le chatbot guide le client et structure les données. Le calcul du prix reste entièrement déterministe — jamais délégué à une IA.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

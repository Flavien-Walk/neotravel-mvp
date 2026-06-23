'use client'

import { Clock, FileX, BellOff, BarChart2, Users } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionLabel from '@/components/ui/SectionLabel'
import GlassCard from '@/components/ui/GlassCard'

const PROBLEMS = [
  {
    icon: Clock,
    stat: '4h+',
    label: 'par lead',
    title: 'Qualification trop lente',
    desc: 'Chaque demande entrante est traitée manuellement. Le commercial passe plus de temps à trier qu\'à vendre.',
    color: '#F43F5E',
  },
  {
    icon: FileX,
    stat: '48h',
    label: 'pour un devis',
    title: 'Devis faits à la main',
    desc: 'Calculs dans des tableurs, copier-coller, erreurs de saisie. Un processus non reproductible et non auditable.',
    color: '#F59E0B',
  },
  {
    icon: BellOff,
    stat: '30%',
    label: 'non recontactés',
    title: 'Relances oubliées',
    desc: 'Sans pipeline centralisé, les leads chauds refroidissent. Des opportunités disparaissent faute de suivi.',
    color: '#818CF8',
  },
  {
    icon: BarChart2,
    stat: '0',
    label: 'visibilité',
    title: 'Aucun suivi pipeline',
    desc: 'Impossible de savoir où en est chaque lead, quel est le taux de conversion, ou qui relancer en priorité.',
    color: '#22D3EE',
  },
  {
    icon: Users,
    stat: '60+',
    label: 'leads / jour',
    title: 'Commerciaux saturés',
    desc: 'Le volume entrant dépasse la capacité de traitement. L\'équipe gère l\'urgence plutôt que la performance.',
    color: '#4B8EF8',
  },
]

export default function ProblemSection() {
  return (
    <section id="probleme" className="section-padding">
      <div className="container-neo">
        <AnimatedSection className="text-center mb-16">
          <SectionLabel>Le problème</SectionLabel>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white leading-tight">
            Le traitement manuel <span className="text-gradient-blue">coûte cher</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Avec 60+ leads entrants par jour, chaque friction dans le processus commercial se traduit par du chiffre d&apos;affaires perdu.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROBLEMS.map((p, i) => (
            <AnimatedSection key={p.title} delay={i * 0.08}>
              <GlassCard className="h-full">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}>
                    <p.icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-2xl font-bold text-white">{p.stat}</span>
                      <span className="text-xs text-white/35">{p.label}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2 text-sm">{p.title}</h3>
                    <p className="text-xs text-white/45 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </GlassCard>
            </AnimatedSection>
          ))}

          {/* Emphasis card */}
          <AnimatedSection delay={PROBLEMS.length * 0.08} className="sm:col-span-2 lg:col-span-1 lg:row-span-1">
            <div className="card-premium h-full flex items-center justify-center p-8 text-center"
              style={{ borderColor: 'rgba(75,142,248,0.25)', background: 'rgba(75,142,248,0.06)' }}>
              <div>
                <div className="text-4xl font-bold text-white mb-2">
                  <span className="text-gradient-blue">80%</span>
                </div>
                <p className="text-white/50 text-sm">du temps commercial consacré à des tâches automatisables</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

'use client'

import { Shield, GitBranch, BookOpen, UserCheck, Zap } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SectionLabel from '@/components/ui/SectionLabel'
import GlassCard from '@/components/ui/GlassCard'

const PILLARS = [
  {
    icon: Zap,
    title: 'Calcul déterministe',
    desc: 'calculer_devis() retourne toujours le même résultat pour les mêmes entrées. Pas de variabilité. Pas de surprise.',
    highlight: 'Mêmes entrées → mêmes sorties',
    color: '#F59E0B',
  },
  {
    icon: BookOpen,
    title: 'Devis explicables',
    desc: 'Chaque devis retourne un détail ligne par ligne : distance, frais fixes, coefficients appliqués, options.',
    highlight: 'Ligne de calcul visible',
    color: '#4B8EF8',
  },
  {
    icon: GitBranch,
    title: 'Logs complets',
    desc: 'Chaque action est enregistrée : création lead, changement de statut, calcul de devis, relance simulée.',
    highlight: 'Traçabilité totale',
    color: '#22D3EE',
  },
  {
    icon: Shield,
    title: 'Données structurées',
    desc: 'Score de complétude automatique. Les demandes incomplètes sont détectées avant le calcul.',
    highlight: 'Validation systématique',
    color: '#818CF8',
  },
  {
    icon: UserCheck,
    title: 'Reprise humaine',
    desc: 'Les cas complexes ou hors zone sont immédiatement transmis à un commercial. L\'automatisation ne bloque jamais.',
    highlight: 'Escalade sur demande',
    color: '#F43F5E',
  },
]

export default function ReliabilitySection() {
  return (
    <section id="fiabilite" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(75,142,248,0.08) 0%, transparent 70%)' }} />

      <div className="container-neo relative z-10">
        <AnimatedSection className="text-center mb-16">
          <SectionLabel>Fiabilité</SectionLabel>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white leading-tight">
            Un devis que vous pouvez <span className="text-gradient-gold">défendre</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Chaque devis reste explicable, auditable et reproductible. L&apos;automatisation ne compromet pas la rigueur.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p, i) => (
            <AnimatedSection key={p.title} delay={i * 0.1}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}>
                    <p.icon className="w-4.5 h-4.5" style={{ color: p.color }} />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{p.title}</h3>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-4">{p.desc}</p>
                <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2"
                  style={{ background: `${p.color}0D`, border: `1px solid ${p.color}20`, color: p.color }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  {p.highlight}
                </div>
              </GlassCard>
            </AnimatedSection>
          ))}

          {/* Code snippet card */}
          <AnimatedSection delay={PILLARS.length * 0.1} className="sm:col-span-2 lg:col-span-3">
            <div className="card-premium p-6 font-mono text-sm overflow-x-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs text-white/30 font-sans">calculer_devis.ts — Déterministe · Zéro LLM</span>
              </div>
              <pre className="text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre">
                <code>
                  <span className="text-white/30">{'// '}</span>
                  <span className="text-white/30">Mêmes entrées → mêmes sorties. Toujours.</span>{'\n'}
                  <span className="text-neo-purple">export function </span>
                  <span className="text-neo-blue-light">calculer_devis</span>
                  <span className="text-white/70">{'(input: DevisInput): DevisResult {'}</span>{'\n'}
                  {'  '}<span className="text-neo-cyan">const</span>
                  <span className="text-white/70">{' distance = DISTANCES_KM[`${depart}|${destination}`]'}</span>{'\n'}
                  {'  '}<span className="text-neo-cyan">const</span>
                  <span className="text-white/70">{' prix_ht = distance × TARIF_KM × coeff_urgence × ...'}</span>{'\n'}
                  {'  '}<span className="text-white/50">{'// → prix_ht, tva, prix_ttc, lignes_calcul, coefficients'}</span>{'\n'}
                  {'  '}<span className="text-neo-purple">return </span>
                  <span className="text-white/70">{'{ success: true, prix_ht, tva, prix_ttc, lignes_calcul }'}</span>{'\n'}
                  <span className="text-white/70">{'}'}</span>
                </code>
              </pre>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

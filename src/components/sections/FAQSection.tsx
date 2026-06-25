'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

const FAQ = [
  {
    q: 'Le devis est-il gratuit et sans engagement ?',
    a: 'Oui, entièrement. Faire une demande de devis sur NeoTravel ne vous engage à aucun achat. Vous pouvez recevoir le devis, comparer, refuser ou ne pas répondre — sans aucune conséquence.',
  },
  {
    q: 'Sous combien de temps vais-je recevoir mon devis ?',
    a: 'Pour les trajets standards en France métropolitaine (moins de 85 passagers, itinéraire dans notre base), le devis est calculé automatiquement et envoyé par email sous 2 heures ouvrées. Pour les demandes plus complexes, un conseiller NeoTravel intervient personnellement.',
  },
  {
    q: 'Comment puis-je suivre l\'avancement de ma demande ?',
    a: 'Dès que vous soumettez votre demande, vous recevez un email contenant un lien de suivi. Ce lien vous permet de voir le statut de votre dossier en temps réel, sans créer de compte.',
  },
  {
    q: 'Pourquoi le devis est-il fiable ?',
    a: 'Le prix est calculé par un moteur métier déterministe — pas par une IA. Il prend en compte la distance, le nombre de passagers, le type de trajet, les options et les coefficients tarifaires. Le même trajet donnera toujours le même prix.',
  },
  {
    q: 'NeoTravel possède-t-il ses propres autocars ?',
    a: 'Non. NeoTravel est un outil de gestion des demandes et de production de devis. Nous qualifions votre demande, calculons le devis et coordonnons des autocaristes partenaires.',
  },
  {
    q: 'Que se passe-t-il si ma demande est complexe ?',
    a: 'Pour les groupes de plus de 85 personnes, les circuits multi-étapes ou les contraintes particulières, un conseiller NeoTravel est automatiquement alerté et reprend votre dossier personnellement.',
  },
  {
    q: 'Puis-je faire une demande sans créer de compte ?',
    a: 'Oui. Le formulaire de demande est accessible sans compte. Un lien de suivi vous est envoyé par email. Si vous souhaitez retrouver toutes vos demandes facilement, vous pouvez créer un compte client gratuitement.',
  },
  {
    q: 'Comment un conseiller NeoTravel accède-t-il à ma demande ?',
    a: 'Dès que vous soumettez votre formulaire, votre demande apparaît dans le tableau de bord de nos conseillers avec toutes les informations nécessaires. Ils peuvent calculer le devis, vous l\'envoyer par email et suivre votre réponse.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative overflow-hidden py-24 sm:py-32 px-4 sm:px-6">

      {/* Photo plein fond */}
      <div className="absolute inset-0">
        <Image
          src="/images/neotravel/bus-road.jpg"
          alt="Autocar sur route — NeoTravel transport de groupe"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      {/* Overlay navy profond */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(3,13,32,0.92) 0%, rgba(6,20,53,0.88) 50%, rgba(3,13,32,0.93) 100%)' }}
      />

      {/* Glow bleu centré */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
      />

      {/* Top / bottom dividers */}
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }} />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.25), transparent)' }} />

      <div className="container-neo relative z-10">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(37,99,235,0.2)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.35)' }}
          >
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Tout ce que vous devez savoir avant de faire une demande de devis transport de groupe.
          </p>
        </div>

        {/* Accordion centré */}
        <div className="max-w-3xl mx-auto space-y-2.5">
          {FAQ.map((item, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-all duration-200"
              style={{
                background: open === i ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: open === i ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                boxShadow: open === i ? '0 4px 24px rgba(37,99,235,0.15)' : 'none',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
              >
                <span
                  className="font-semibold text-sm leading-relaxed"
                  style={{ color: open === i ? '#93C5FD' : 'rgba(255,255,255,0.85)' }}
                >
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                  style={{ color: open === i ? '#60A5FA' : 'rgba(255,255,255,0.3)' }}
                />
              </button>
              {open === i && (
                <div
                  className="px-5 pb-4 text-sm leading-relaxed"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
                >
                  <div className="pt-3">{item.a}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

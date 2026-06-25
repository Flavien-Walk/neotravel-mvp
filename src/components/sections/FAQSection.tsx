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
    <section
      id="faq"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #EBF3FF 0%, #F4F7FF 40%, #EEF2FF 100%)' }}
    >
      {/* Dot matrix subtil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Glow top-right */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(37,99,235,0.08) 0%, transparent 70%)' }}
      />
      {/* Top divider */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.2), transparent)' }}
      />
      {/* Bottom divider */}
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.15), transparent)' }}
      />

      <div className="container-neo px-4 sm:px-6 py-20 sm:py-28 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4" style={{ color: '#0F172A' }}>
            Questions fréquentes
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#475569' }}>
            Tout ce que vous devez savoir avant de faire une demande de devis transport de groupe.
          </p>
        </div>

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start max-w-5xl mx-auto">

          {/* Image — left column */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  height: 460,
                  boxShadow: '0 20px 60px rgba(37,99,235,0.15), 0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <Image
                  src="/images/neotravel/bus-road.jpg"
                  alt="Autocar sur route — transport de groupe NeoTravel"
                  fill
                  className="object-cover object-center"
                  sizes="33vw"
                />
                {/* Overlay dégradé bas */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.1) 50%, rgba(15,23,42,0.0) 100%)' }}
                />
                {/* Badge bas */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(16px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <p className="text-xs font-semibold" style={{ color: '#0F172A' }}>
                        Transport de groupe
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: '#64748B' }}>
                      8 à 500 passagers · Devis gratuit sous 2h
                    </p>
                  </div>
                </div>
                {/* Badge top */}
                <div className="absolute top-5 left-5">
                  <div
                    className="rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: 'rgba(37,99,235,0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                    }}
                  >
                    NeoTravel
                  </div>
                </div>
              </div>

              {/* Stats sous l'image */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { val: '< 2h', label: 'Délai devis' },
                  { val: '100%', label: 'Tracé' },
                  { val: 'Gratuit', label: 'Sans engagement' },
                ].map(({ val, label }) => (
                  <div
                    key={label}
                    className="rounded-xl px-3 py-3 text-center"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(37,99,235,0.12)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div className="text-sm font-bold" style={{ color: '#1D4ED8' }}>{val}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Accordion — right column */}
          <div className="lg:col-span-3 space-y-2.5">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: open === i ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                  border: open === i ? '1px solid rgba(37,99,235,0.25)' : '1px solid rgba(37,99,235,0.1)',
                  boxShadow: open === i
                    ? '0 4px 20px rgba(37,99,235,0.10), 0 1px 4px rgba(0,0,0,0.04)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-all"
                  style={{ background: open === i ? 'rgba(239,246,255,0.6)' : 'transparent' }}
                >
                  <span
                    className="font-semibold text-sm leading-relaxed"
                    style={{ color: open === i ? '#1D4ED8' : '#1E293B' }}
                  >
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                    style={{ color: open === i ? '#2563EB' : '#94A3B8' }}
                  />
                </button>
                {open === i && (
                  <div
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ borderTop: '1px solid rgba(37,99,235,0.1)', color: '#475569' }}
                  >
                    <div className="pt-3">{item.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

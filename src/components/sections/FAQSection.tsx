'use client'

import { useState } from 'react'
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
    a: 'Dès que vous soumettez votre demande, vous recevez un email de confirmation contenant un lien de suivi. Ce lien vous permet de voir le statut de votre dossier en temps réel, sans créer de compte. Vous pouvez aussi créer un compte client pour retrouver toutes vos demandes en un endroit.',
  },
  {
    q: 'Pourquoi le devis est-il fiable ?',
    a: 'Le prix est calculé par un moteur métier déterministe — pas par une IA. Il prend en compte la distance, la durée, le nombre de passagers, le type de trajet, les options et les coefficients tarifaires. Le même trajet dans les mêmes conditions donnera toujours le même prix. Vous pouvez demander à n\'importe quel conseiller NeoTravel de vous expliquer chaque ligne.',
  },
  {
    q: 'NeoTravel possède-t-il ses propres autocars ?',
    a: 'Non. NeoTravel est un outil de gestion des demandes et de production de devis. Nous qualifions votre demande, calculons le devis et coordonnons des autocaristes partenaires. Nous ne possédons pas de flotte en propre.',
  },
  {
    q: 'Que se passe-t-il si ma demande est complexe ?',
    a: 'Pour les groupes de plus de 85 personnes, les circuits multi-étapes, ou les demandes avec des contraintes particulières, un conseiller NeoTravel est automatiquement alerté. Il reprend votre dossier personnellement et vous contacte directement pour affiner le devis.',
  },
  {
    q: 'Puis-je faire une demande sans créer de compte ?',
    a: 'Oui. Le formulaire de demande est accessible sans compte. Un lien de suivi vous est envoyé par email. Si vous souhaitez retrouver toutes vos demandes facilement, vous pouvez créer un compte client gratuitement.',
  },
  {
    q: 'Comment un conseiller NeoTravel accède-t-il à ma demande ?',
    a: 'Dès que vous soumettez votre formulaire, votre demande apparaît dans le tableau de bord de nos conseillers avec toutes les informations nécessaires. Ils peuvent calculer le devis, vous l\'envoyer par email et suivre votre réponse — le tout depuis leur espace NeoTravel.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="section-padding bg-neo-900" id="faq">
      <div className="container-neo max-w-3xl">
        <div className="text-center mb-12">
          <span className="label-tag mb-4">FAQ</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
            Questions fréquentes
          </h2>
          <p className="mt-4 text-white/45 text-base max-w-xl mx-auto">
            Tout ce que vous devez savoir avant de faire une demande de devis transport de groupe.
          </p>
        </div>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-all hover:bg-white/3"
              >
                <span className="font-semibold text-white text-sm leading-relaxed">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 text-white/40 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div
                  className="px-5 pb-4 text-sm text-white/50 leading-relaxed"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
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

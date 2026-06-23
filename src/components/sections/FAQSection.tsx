'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ = [
  {
    q: 'NeoTravel possède-t-il ses propres véhicules ?',
    a: 'Non. NeoTravel est une plateforme d\'intermédiation : nous qualifions les demandes, générons des devis fiables et mobilisons des autocaristes partenaires. Nous ne possédons pas de flotte en propre.',
  },
  {
    q: 'Comment le devis est-il calculé ?',
    a: 'Le devis est calculé par une fonction déterministe (calculer_devis()) qui prend en compte la distance du trajet, le nombre de passagers, le type de trajet (aller simple, aller-retour, circuit), l\'urgence et les options choisies. Chaque ligne de calcul est explicitée dans le devis.',
  },
  {
    q: 'Pourquoi l\'IA ne calcule-t-elle pas le prix ?',
    a: '"L\'agent collecte et orchestre, le code calcule." L\'IA générative est utilisée uniquement pour guider la conversation et extraire les informations nécessaires. Elle ne génère, n\'estime et ne prédit jamais un prix. Le calcul est fait par un algorithme auditable et reproductible.',
  },
  {
    q: 'Que se passe-t-il si ma demande est complexe ?',
    a: 'Pour les groupes de plus de 85 personnes, les circuits multi-étapes, les villes hors de notre table de distances ou les demandes avec des besoins spéciaux, un commercial NeoTravel est automatiquement notifié et reprend la demande humainement dans les plus brefs délais.',
  },
  {
    q: 'Sous combien de temps le client reçoit-il une réponse ?',
    a: 'Pour les demandes standard (itinéraires France métropolitaine, moins de 85 pax, trajet dans notre base), un devis est calculé automatiquement et envoyé sous 15 secondes. Pour les cas complexes, un conseiller intervient sous 2 heures ouvrées.',
  },
  {
    q: 'Les emails sont-ils réellement envoyés ?',
    a: 'Oui. Les emails transactionnels sont envoyés via Brevo (confirmation de demande, devis, relances, reset de mot de passe). En mode développement ou sans clé API configurée, les emails sont loggés en console pour ne pas bloquer le système.',
  },
  {
    q: 'Le devis est-il gratuit et sans engagement ?',
    a: 'Oui, entièrement. Faire une demande de devis sur NeoTravel ne vous engage à aucun achat. Vous pouvez comparer, refuser ou ignorer le devis sans aucune conséquence.',
  },
  {
    q: 'Comment accéder au dashboard commercial ?',
    a: 'Les commerciaux NeoTravel créent un compte avec le rôle "commercial". Une fois connectés, ils accèdent à /dashboard pour consulter le pipeline, calculer des devis, envoyer des emails et suivre les relances. Le dashboard est protégé : inaccessible sans authentification.',
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
            Tout ce que vous devez savoir sur NeoTravel, le calcul des devis et le fonctionnement de la plateforme.
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

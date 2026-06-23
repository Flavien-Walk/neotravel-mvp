import AnimatedSection from '@/components/ui/AnimatedSection'
import { CheckCircle2, Circle } from 'lucide-react'

const DONE = [
  'Inscription / connexion / déconnexion (auth JWT réelle)',
  'Protection des routes dashboard par token Bearer',
  'Mot de passe oublié + réinitialisation par email',
  'Formulaire guidé de demande (étape par étape)',
  'Stockage des leads en base MongoDB Atlas',
  'Scoring de complétude et qualification automatique',
  'Calcul déterministe du devis (distance, durée, coefficients)',
  'Détail devis avec lignes de calcul et coefficients',
  'Changement de statut (nouveau → qualifié → devis_genere → envoyé)',
  'Envoi devis client par email Brevo (email réel)',
  'Envoi relance par email Brevo (email réel)',
  'Dashboard commercial avec filtres, recherche, stats',
  'Logs horodatés de chaque action (EMAIL_SENT, QUOTE_GENERATED…)',
  'Reprise humaine : passage en cas_complexe + log HUMAN_HANDOFF',
  'Page confirmation post-devis (/merci)',
]

const NEXT = [
  'Intégration API géocodage réelle (distances kilométriques précises)',
  'Matching autocaristes partenaires (attribution automatique)',
  'Signature électronique du devis (DocuSign / Yousign)',
  'CRM complet multi-rôles (admin / commercial / client)',
  'Paiement et facturation',
  'Notifications push et relances automatisées (cron)',
]

export default function MVPSection() {
  return (
    <section className="section-padding bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-light opacity-50" />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="label-tag-dark mb-4">Ce que fait le prototype</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-4">
              Un MVP fonctionnel, pas une démo vide.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Voici exactement ce que vous pouvez tester aujourd&apos;hui — et ce qui sera disponible
              dans les prochaines itérations.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Done */}
          <AnimatedSection delay={0.1}>
            <div className="card-light-flat h-full">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-slate-900 text-lg">Disponible maintenant</h3>
              </div>
              <ul className="space-y-3">
                {DONE.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>

          {/* Next */}
          <AnimatedSection delay={0.2}>
            <div className="card-light-flat h-full" style={{ borderColor: '#E0E7FF' }}>
              <div className="flex items-center gap-2 mb-5">
                <Circle className="w-5 h-5 text-slate-300" />
                <h3 className="font-bold text-slate-900 text-lg">Prochaines itérations</h3>
              </div>
              <ul className="space-y-3">
                {NEXT.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <Circle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
                Ces fonctionnalités ne sont pas encore implémentées et ne sont pas promises dans le MVP.
                Le prototype est honnête sur ce qu&apos;il fait.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

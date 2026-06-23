import AnimatedSection from '@/components/ui/AnimatedSection'
import { CheckCircle2, Circle } from 'lucide-react'

const DONE = [
  'Création de compte et connexion sécurisée',
  'Accès dashboard protégé par compte commercial',
  'Réinitialisation du mot de passe par email',
  'Formulaire guidé de demande (étape par étape)',
  'Enregistrement des leads en base de données',
  'Score de complétude calculé automatiquement',
  'Calcul déterministe du devis (distance, durée, coefficients)',
  'Détail du devis avec lignes de calcul explicites',
  'Changement de statut tout au long du cycle de vie',
  'Envoi du devis par email au client',
  'Relance email si pas de réponse',
  'Dashboard commercial avec filtres, recherche, indicateurs',
  'Historique de chaque action (email envoyé, devis calculé…)',
  'Reprise humaine : passage en cas complexe et log d\'escalade',
  'Page de confirmation après soumission du formulaire',
]

const NEXT = [
  'Distances kilométriques réelles via API géocodage',
  'Matching automatique avec les autocaristes partenaires',
  'Signature électronique du devis (DocuSign / Yousign)',
  'Espace client pour suivre sa demande',
  'Paiement et facturation intégrés',
  'Relances automatisées planifiées (cron)',
]

export default function MVPSection() {
  return (
    <section className="section-padding bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-light opacity-50" />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="label-tag-dark mb-4">Ce que fait le produit</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-4">
              Disponible maintenant — pas une démo vide.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Voici exactement ce que vous pouvez utiliser aujourd&apos;hui — et ce qui arrivera
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
                <h3 className="font-bold text-slate-900 text-lg">Prochaines évolutions</h3>
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
                Ces fonctionnalités ne sont pas encore disponibles.
                Le produit est honnête sur ce qu&apos;il fait.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

import { Building2, Landmark, Users, Heart } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'

const CLIENTS = [
  {
    icon: Building2,
    color: 'bg-blue-50 text-blue-600',
    ring:  'ring-blue-100',
    title: 'Entreprises',
    desc:  'Séminaires, sorties d\'équipe, transferts aéroport, conventions, team buildings. Vous avez besoin d\'un autocar fiable, d\'un devis rapide et d\'une facturation propre.',
    examples: ['Séminaire Paris → Lyon, 45 pax', 'Navette aéroport CDG, 28 pax', 'Convention annuelle, 80 pax'],
  },
  {
    icon: Landmark,
    color: 'bg-indigo-50 text-indigo-600',
    ring:  'ring-indigo-100',
    title: 'Collectivités',
    desc:  'Sorties scolaires, voyages institutionnels, événements municipaux, transports de personnes âgées. Nous gérons le dossier, vous validez.',
    examples: ['Sortie scolaire Versailles, 40 élèves', 'Voyage de fin d\'année, lycée, 55 pax', 'Transfert seniors EHPAD'],
  },
  {
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
    ring:  'ring-violet-100',
    title: 'Associations',
    desc:  'Déplacements sportifs, voyages culturels, pèlerinages, weekends associatifs. On s\'occupe de la logistique, vous vous concentrez sur l\'événement.',
    examples: ['Déplacement club foot, 32 pax', 'Voyage culturel Rome, 50 pax', 'Weekend ski Alpes, 38 pax'],
  },
  {
    icon: Heart,
    color: 'bg-rose-50 text-rose-600',
    ring:  'ring-rose-100',
    title: 'Particuliers & groupes privés',
    desc:  'Mariage, enterrement de vie de garçon, fête familiale, groupe d\'amis. Un autocar privatisé, un chauffeur professionnel, aucune contrainte de parking.',
    examples: ['Mariage Normandie, 60 invités', 'EVJF Paris → Champagne', 'Réunion de famille, 35 pax'],
  },
]

export default function PourQuiSection() {
  return (
    <section id="pour-qui" className="bg-white section-padding">
      <div className="container-neo">
        <AnimatedSection>
          <div className="text-center mb-14">
            <span className="label-tag-dark mb-4">Pour qui ?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-4">
              Un outil pensé pour ceux qui organisent des déplacements de groupe
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Que vous soyez RH, directeur administratif, enseignant ou responsable associatif — NeoTravel simplifie
              votre demande de transport et vous garantit un devis fiable en moins de deux heures ouvrées.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CLIENTS.map(({ icon: Icon, color, ring, title, desc, examples }, i) => (
            <AnimatedSection key={title} delay={i * 0.08}>
              <div className={`card-light h-full flex flex-col ring-1 ${ring}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-1">{desc}</p>
                <div className="space-y-1.5">
                  {examples.map(ex => (
                    <div key={ex} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

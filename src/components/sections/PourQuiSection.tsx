import Image from 'next/image'
import AnimatedSection from '@/components/ui/AnimatedSection'

const CLIENTS = [
  {
    // Autocar sur autoroute + équipe corporate en réunion
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    tag: 'Entreprises',
    title: 'Séminaires & événements pro',
    desc: 'Séminaires, team buildings, conventions, transferts aéroport. Vous avez besoin d\'un autocar fiable, d\'un devis rapide et d\'une facturation propre.',
    examples: ['Séminaire Paris → Lyon, 45 pax', 'Navette aéroport CDG, 28 pax', 'Convention annuelle, 80 pax'],
    accent: 'from-blue-500/30 to-blue-900/60',
  },
  {
    // Flotte d'autocars stationnés
    img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
    tag: 'Collectivités',
    title: 'Mairies & institutions',
    desc: 'Événements municipaux, sorties institutionnelles, transports de seniors. Nous gérons le dossier, vous validez le devis.',
    examples: ['Sortie seniors CCAS, 40 pax', 'Événement municipal, 60 pax', 'Transfert institutionnel'],
    accent: 'from-indigo-500/30 to-indigo-900/60',
  },
  {
    // Autocar jaune scolaire / jeunes en excursion
    img: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&q=80',
    tag: 'Établissements scolaires',
    title: 'Sorties & voyages scolaires',
    desc: 'Voyages de fin d\'année, sorties culturelles, classes découverte. Transport sécurisé, devis conforme aux procédures administratives.',
    examples: ['Voyage scolaire Rome, 55 élèves', 'Sortie Versailles, 40 élèves', 'Classe découverte Alpes, 32 pax'],
    accent: 'from-emerald-500/30 to-emerald-900/60',
  },
  {
    // Autocar charter / bus de club sportif
    img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80',
    tag: 'Associations & clubs',
    title: 'Sport & culture',
    desc: 'Déplacements pour compétitions, tournois, weekends culturels ou pèlerinages. On s\'occupe de la logistique, vous vous concentrez sur l\'événement.',
    examples: ['Déplacement club foot, 32 pax', 'Tournoi régional, 25 pax', 'Weekend ski Alpes, 38 pax'],
    accent: 'from-violet-500/30 to-violet-900/60',
  },
  {
    // Autocar de voyage touristique / luxe
    img: 'https://images.unsplash.com/photo-1566087140622-e9b7a71ffff7?w=600&q=80',
    tag: 'Groupes privés',
    title: 'Mariages & événements',
    desc: 'Mariage, EVJF/EVG, anniversaire, réunion de famille. Un autocar privatisé, un chauffeur professionnel, aucune contrainte de stationnement.',
    examples: ['Mariage Normandie, 60 invités', 'EVJF Paris → Champagne', 'Réunion famille, 35 pax'],
    accent: 'from-rose-500/30 to-rose-900/60',
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
              Que vous soyez RH, directeur administratif, enseignant ou responsable associatif —
              NeoTravel simplifie votre demande et vous garantit un devis fiable sous 2h ouvrées.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {CLIENTS.map(({ img, tag, title, desc, examples, accent }, i) => (
            <AnimatedSection key={tag} delay={i * 0.07}>
              <div className="rounded-2xl overflow-hidden border border-slate-200 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Image header */}
                <div className="relative h-40 w-full flex-shrink-0 overflow-hidden bg-slate-100">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${accent}`} />
                  <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white/90 uppercase tracking-wider bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">
                    {tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">{desc}</p>
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    {examples.map(ex => (
                      <div key={ex} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

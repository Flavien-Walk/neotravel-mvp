import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">NeoTravel</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#services" className="hover:text-gray-900 transition-colors">Services</a>
            <a href="#comment" className="hover:text-gray-900 transition-colors">Comment ça marche</a>
            <Link href="/devis" className="btn-primary !py-2 !px-4 text-sm">
              Demander un devis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Réponse garantie sous 2h ouvrées
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Le transport de groupe,<br />
            <span className="text-blue-200">simplifié et rapide</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Obtenez un devis précis en moins de 3 minutes. NeoTravel coordonne les meilleurs transporteurs de France pour votre déplacement collectif.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/devis" className="btn-primary !bg-white !text-blue-700 hover:!bg-blue-50 !py-4 !px-8 text-base font-semibold shadow-lg">
              Demander mon devis gratuit
            </Link>
            <a href="#comment" className="btn-secondary !bg-transparent !text-white !border-white/30 hover:!bg-white/10 !py-4 !px-8 text-base">
              Voir comment ça marche
            </a>
          </div>
          <p className="mt-6 text-sm text-blue-200">Sans engagement — Devis gratuit et immédiat</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '500+', label: 'Transporteurs partenaires' },
            { value: '15 000+', label: 'Voyages organisés' },
            { value: '98%', label: 'Clients satisfaits' },
            { value: '< 2h', label: 'Délai de réponse' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-blue-600">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Nos services</h2>
          <p className="text-center text-gray-500 mb-12">Pour tous vos déplacements collectifs, de 10 à 85 passagers</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🎓',
                title: 'Sorties scolaires',
                desc: "Excursions, voyages de fin d'année, visites culturelles. Sécurité et ponctualité garanties.",
              },
              {
                icon: '🏢',
                title: 'Transport entreprise',
                desc: "Séminaires, team building, événements corporate. Gestion complète de A à Z.",
              },
              {
                icon: '⚽',
                title: 'Clubs sportifs',
                desc: 'Déplacements pour compétitions et tournois. Tarifs adaptés aux associations.',
              },
              {
                icon: '🎉',
                title: 'Événements privés',
                desc: "Mariages, anniversaires, soirées. Transport VIP pour vos occasions spéciales.",
              },
              {
                icon: '✈️',
                title: 'Transferts aéroport',
                desc: "Navettes groupées vers les aéroports et gares. Suivi des vols en temps réel.",
              },
              {
                icon: '🗺️',
                title: 'Circuits touristiques',
                desc: 'Itinéraires multi-étapes sur mesure. Chauffeurs guides disponibles.',
              },
            ].map((s) => (
              <div key={s.title} className="card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="bg-gray-50 py-16 px-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Comment ça marche</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Décrivez votre besoin', desc: "Remplissez notre formulaire guidé en 3 minutes. Itinéraire, date, nombre de passagers..." },
              { step: '2', title: 'Recevez votre devis', desc: "Notre système calcule immédiatement un devis détaillé. Un conseiller valide et vous répond sous 2h." },
              { step: '3', title: 'Confirmez et voyagez', desc: "Acceptez le devis, signez en ligne et profitez de votre transport. Simple." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à organiser votre transport ?</h2>
          <p className="text-blue-100 mb-8">Devis gratuit, sans engagement, réponse en moins de 2h ouvrées.</p>
          <Link href="/devis" className="btn-primary !bg-white !text-blue-700 hover:!bg-blue-50 !py-4 !px-10 text-base font-semibold">
            Obtenir mon devis maintenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p>© 2024 NeoTravel — Plateforme d&apos;intermédiation transport de groupe</p>
        <p className="mt-1">MVP v0.1 — Prototype fonctionnel</p>
      </footer>
    </div>
  )
}

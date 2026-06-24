import AnimatedSection from '@/components/ui/AnimatedSection'
import Link from 'next/link'
import { ArrowRight, AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react'

const MOCK_LEADS = [
  { nom: 'Groupe Suez',          trajet: 'Paris → Lyon',      pax: 52, statut: 'Devis envoyé', urgence: 'normal',   price: '3 840 €' },
  { nom: 'Mairie de Bordeaux',   trajet: 'Bordeaux → Nice',   pax: 38, statut: 'Relance 1',    urgence: 'urgent',   price: '2 190 €' },
  { nom: 'Club Rugby Nantes',    trajet: 'Nantes → Paris',    pax: 25, statut: 'Nouveau',       urgence: 'normal',   price: '—' },
  { nom: 'Lycée Jean Moulin',    trajet: 'Toulouse → Lourdes',pax: 60, statut: 'Qualifiée',     urgence: 'normal',   price: '—' },
]

const STATS = [
  { label: 'Nouveaux leads',      value: '12',  icon: Users,        color: 'text-blue-400',  bg: 'bg-blue-500/10' },
  { label: 'Devis en attente',    value: '7',   icon: Clock,        color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Relances à envoyer',  value: '3',   icon: AlertCircle,  color: 'text-orange-400',bg: 'bg-orange-500/10' },
  { label: 'Acceptés ce mois',    value: '24',  icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
]

function StatusPill({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    'Nouveau':      'bg-blue-500/12 text-blue-300 border border-blue-500/20',
    'Qualifiée':    'bg-indigo-500/12 text-indigo-300 border border-indigo-500/20',
    'Devis envoyé': 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/20',
    'Relance 1':    'bg-orange-500/12 text-orange-300 border border-orange-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${map[statut] ?? 'bg-white/5 text-white/40'}`}>
      {statut}
    </span>
  )
}

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="section-padding bg-neo-light relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-light opacity-60" />

      <div className="container-neo relative z-10">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="label-tag-dark mb-4">Côté NeoTravel</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-4">
              Votre demande est suivie en temps réel{' '}
              <span className="text-neo-blue">par notre équipe.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Dès que vous soumettez votre demande, elle apparaît dans le tableau de bord de nos
              conseillers — avec son statut, son trajet, et les actions à effectuer pour vous
              envoyer un devis au plus vite.
            </p>
          </div>
        </AnimatedSection>

        {/* Mock dashboard */}
        <AnimatedSection delay={0.15}>
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{ border: '1px solid #E0E7FF' }}
          >
            {/* Fake title bar */}
            <div className="bg-neo-900 flex items-center gap-2 px-4 py-3">
              <span className="w-3 h-3 rounded-full bg-red-400/70" />
              <span className="w-3 h-3 rounded-full bg-amber-400/70" />
              <span className="w-3 h-3 rounded-full bg-green-400/70" />
              <span className="mx-auto text-[11px] text-white/25 font-mono">NeoTravel Dashboard — dashboard.neotravel.fr</span>
            </div>

            <div className="bg-neo-900 p-5 sm:p-8">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {STATS.map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="card-neo !p-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg} mb-3`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-[11px] text-white/35 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="grid grid-cols-5 gap-2 px-4 py-2.5 text-[11px] text-white/30 uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="col-span-2">Client</span>
                  <span className="hidden sm:block">Trajet</span>
                  <span>Statut</span>
                  <span className="text-right">Devis HT</span>
                </div>
                {MOCK_LEADS.map((lead, i) => (
                  <div
                    key={lead.nom}
                    className="grid grid-cols-5 gap-2 px-4 py-3 items-center text-sm"
                    style={{
                      borderBottom: i < MOCK_LEADS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                    }}
                  >
                    <div className="col-span-2">
                      <div className="text-white font-medium text-[13px] truncate">{lead.nom}</div>
                      <div className="text-white/30 text-[11px]">{lead.pax} passagers</div>
                    </div>
                    <div className="hidden sm:block text-white/45 text-[12px] truncate">{lead.trajet}</div>
                    <div><StatusPill statut={lead.statut} /></div>
                    <div className="text-right text-[13px] font-mono text-white/60">{lead.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <div className="text-center mt-8">
            <Link href="/devis" className="btn-solid gap-2 inline-flex">
              Faire une demande de devis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-slate-400 text-sm mt-3">
              Vous êtes conseiller NeoTravel ?{' '}
              <Link href="/login" className="text-neo-blue hover:underline">Accéder au dashboard</Link>
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

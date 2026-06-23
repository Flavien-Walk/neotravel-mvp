'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { User, Shield, Bell, LogOut, Building2 } from 'lucide-react'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-neo-blue' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`}
      />
    </button>
  )
}

export default function DashboardSettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [notifLeads, setNotifLeads]         = useState(true)
  const [notifRelances, setNotifRelances]   = useState(true)
  const [notifComplexes, setNotifComplexes] = useState(false)

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Paramètres</h1>
        <p className="text-white/35 text-sm mt-0.5">Profil, organisation et préférences</p>
      </div>

      {/* Profil */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-neo-blue" />
          <h2 className="font-semibold text-white">Profil</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <div className="input bg-white/3 cursor-not-allowed text-white/60">{user?.nom ?? '—'}</div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="input bg-white/3 cursor-not-allowed text-white/60">{user?.email ?? '—'}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rôle</label>
              <div className="input bg-white/3 cursor-not-allowed text-white/60 capitalize">{user?.role ?? '—'}</div>
            </div>
            <div>
              <label className="label">Organisation</label>
              <div className="input bg-white/3 cursor-not-allowed text-white/60">{(user as { organisation?: string })?.organisation ?? 'NeoTravel'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Préférences commerciales */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white">Préférences commerciales</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Signature email</label>
            <div className="input bg-white/3 cursor-not-allowed text-white/60">
              {user?.nom ? `${user.nom} — NeoTravel` : 'Équipe NeoTravel'}
            </div>
            <p className="text-white/25 text-xs mt-1.5">Affichée dans les devis envoyés aux clients.</p>
          </div>
          <div>
            <label className="label">Délai cible de réponse</label>
            <div className="input bg-white/3 cursor-not-allowed text-white/60">2h ouvrées</div>
            <p className="text-white/25 text-xs mt-1.5">Objectif affiché dans les emails de confirmation client.</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-white">Notifications</h2>
        </div>
        <div>
          {[
            {
              label: 'Nouveaux leads entrants',
              desc: 'Alerte à chaque nouvelle demande reçue.',
              value: notifLeads,
              set: setNotifLeads,
            },
            {
              label: 'Relances à envoyer',
              desc: 'Rappel lorsqu\'un devis est sans réponse depuis 48h.',
              value: notifRelances,
              set: setNotifRelances,
            },
            {
              label: 'Cas complexes',
              desc: 'Notification lorsqu\'un dossier nécessite une reprise humaine.',
              value: notifComplexes,
              set: setNotifComplexes,
            },
          ].map(({ label, desc, value, set }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 py-3.5 border-b border-white/6 last:border-0"
            >
              <div>
                <div className="text-sm text-white">{label}</div>
                <div className="text-xs text-white/35 mt-0.5">{desc}</div>
              </div>
              <Toggle value={value} onChange={set} />
            </div>
          ))}
        </div>
        <p className="text-white/20 text-xs mt-3">
          Les préférences de notification seront actives dans la prochaine version.
        </p>
      </div>

      {/* Sécurité */}
      <div className="card-neo mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white">Sécurité</h2>
        </div>
        <div className="text-sm text-white/45">
          <div className="flex items-center justify-between py-3 border-b border-white/6">
            <span>Mot de passe</span>
            <span className="text-white/25">••••••••</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/6">
            <span>Session active</span>
            <span className="text-green-400 text-xs font-medium">Connecté</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span>Identifiant de session</span>
            <span className="text-white/30 text-xs font-mono">{user?.id?.slice(-8) ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Déconnexion */}
      <button
        onClick={() => { logout(); router.push('/') }}
        className="btn-danger flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </div>
  )
}

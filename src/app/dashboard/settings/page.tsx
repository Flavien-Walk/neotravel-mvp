'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { User, Shield, Bell, LogOut } from 'lucide-react'

export default function DashboardSettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Paramètres</h1>
        <p className="text-white/35 text-sm mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      {/* Profil */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-neo-blue" />
          <h2 className="font-semibold text-white">Profil utilisateur</h2>
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
              <div className="input bg-white/3 cursor-not-allowed text-white/60">{user?.organisation ?? '—'}</div>
            </div>
          </div>
          <p className="text-white/25 text-xs">
            Modification de profil disponible dans la version production avec backend auth.
          </p>
        </div>
      </div>

      {/* Sécurité */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white">Sécurité</h2>
        </div>
        <div className="space-y-3 text-sm text-white/45">
          <div className="flex items-center justify-between py-2 border-b border-white/6">
            <span>Mot de passe</span>
            <span className="text-white/25">••••••••</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/6">
            <span>Authentification JWT</span>
            <span className="text-green-400 text-xs">Activée (backend)</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Session active</span>
            <span className="text-white/30 text-xs font-mono">
              {user?.id === 'demo-001' ? 'Mode démo' : user?.id?.slice(-8) ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-neo mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-white">Notifications</h2>
        </div>
        <p className="text-white/35 text-sm">
          Les notifications email (relances, nouveaux leads, devis signés) seront configurables
          dans la version production avec intégration SendGrid.
        </p>
      </div>

      {/* Logout */}
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

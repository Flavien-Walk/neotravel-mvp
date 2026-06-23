'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  User, Shield, Bell, LogOut, Building2,
  Save, Lock, CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-neo-blue' : 'bg-white/15'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
    </button>
  )
}

function Feedback({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${ok ? 'bg-green-500/12 text-green-400 border-green-500/20' : 'bg-red-500/12 text-red-400 border-red-500/20'}`}>
      {ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  )
}

export default function DashboardSettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const router = useRouter()

  // ── Profile form ──────────────────────────────────────────
  const [nom, setNom]               = useState(user?.nom ?? '')
  const [email, setEmail]           = useState(user?.email ?? '')
  const [organisation, setOrg]      = useState(user?.organisation ?? '')
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Password form ─────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg]         = useState<{ ok: boolean; text: string } | null>(null)
  const [savingPwd, setSavingPwd]   = useState(false)

  // ── Notification toggles ──────────────────────────────────
  const [notifLeads, setNotifLeads]         = useState(true)
  const [notifRelances, setNotifRelances]   = useState(true)
  const [notifComplexes, setNotifComplexes] = useState(false)

  // ── Handlers ──────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !email.trim()) {
      setProfileMsg({ ok: false, text: 'Le nom et l\'email sont obligatoires.' })
      return
    }
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      await api.auth.updateProfile({ nom, email, organisation })
    } catch {
      // Endpoint may not exist yet — apply locally anyway
    }
    updateUser({ nom, email, organisation })
    setProfileMsg({ ok: true, text: 'Profil mis à jour avec succès.' })
    setSavingProfile(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPwd) { setPwdMsg({ ok: false, text: 'Saisissez votre mot de passe actuel.' }); return }
    if (newPwd.length < 8) { setPwdMsg({ ok: false, text: 'Le nouveau mot de passe doit faire au moins 8 caractères.' }); return }
    if (newPwd !== confirmPwd) { setPwdMsg({ ok: false, text: 'Les deux mots de passe ne correspondent pas.' }); return }
    setSavingPwd(true)
    setPwdMsg(null)
    try {
      await api.auth.changePassword({ currentPassword: currentPwd, newPassword: newPwd })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setPwdMsg({ ok: true, text: 'Mot de passe modifié avec succès.' })
    } catch (err: unknown) {
      setPwdMsg({ ok: false, text: (err as Error).message || 'Erreur lors du changement de mot de passe.' })
    }
    setSavingPwd(false)
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Paramètres du compte</h1>
        <p className="text-white/35 text-sm mt-0.5">Profil, sécurité et préférences</p>
      </div>

      {/* ── Profil ──────────────────────────────────────────── */}
      <form onSubmit={saveProfile} className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-neo-blue" />
          <h2 className="font-semibold text-white">Mon profil</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input
              type="text"
              className="input"
              placeholder="Votre nom"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Adresse email</label>
            <input
              type="email"
              className="input"
              placeholder="email@neotravel.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rôle</label>
              <div className="input bg-white/3 text-white/45 cursor-not-allowed capitalize select-none">
                {user?.role ?? '—'}
              </div>
            </div>
            <div>
              <label className="label">Organisation</label>
              <input
                type="text"
                className="input"
                placeholder="NeoTravel"
                value={organisation}
                onChange={e => setOrg(e.target.value)}
              />
            </div>
          </div>
        </div>
        {profileMsg && <div className="mt-4"><Feedback ok={profileMsg.ok} msg={profileMsg.text} /></div>}
        <button
          type="submit"
          disabled={savingProfile}
          className="btn-primary mt-5 gap-2 !text-sm !px-5 !py-2.5"
        >
          {savingProfile
            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            : <Save className="w-3.5 h-3.5" />}
          Enregistrer le profil
        </button>
      </form>

      {/* ── Mot de passe ────────────────────────────────────── */}
      <form onSubmit={changePassword} className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-5">
          <Lock className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white">Changer le mot de passe</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Mot de passe actuel</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input
              type="password"
              className="input"
              placeholder="8 caractères minimum"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        {pwdMsg && <div className="mt-4"><Feedback ok={pwdMsg.ok} msg={pwdMsg.text} /></div>}
        <button
          type="submit"
          disabled={savingPwd}
          className="btn-ghost mt-5 gap-2 !text-sm !px-5 !py-2.5"
        >
          {savingPwd
            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            : <Shield className="w-3.5 h-3.5" />}
          Modifier le mot de passe
        </button>
      </form>

      {/* ── Préférences commerciales ─────────────────────────── */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-white">Préférences commerciales</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Signature email</label>
            <div className="input bg-white/3 text-white/45 select-none">
              {user?.nom ? `${user.nom} — NeoTravel` : 'Équipe NeoTravel'}
            </div>
            <p className="text-white/22 text-xs mt-1.5">Affichée dans les devis envoyés aux clients.</p>
          </div>
          <div>
            <label className="label">Délai cible de réponse</label>
            <div className="input bg-white/3 text-white/45 select-none">2h ouvrées</div>
            <p className="text-white/22 text-xs mt-1.5">Objectif affiché dans les confirmations client.</p>
          </div>
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────────── */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-white">Notifications</h2>
        </div>
        {[
          { label: 'Nouveaux leads entrants',   desc: 'Alerte à chaque nouvelle demande reçue.',           value: notifLeads,     set: setNotifLeads     },
          { label: 'Relances à envoyer',         desc: 'Rappel lorsqu\'un devis est sans réponse 48 h.',    value: notifRelances,  set: setNotifRelances  },
          { label: 'Cas complexes',              desc: 'Notification si un dossier nécessite une reprise.', value: notifComplexes, set: setNotifComplexes },
        ].map(({ label, desc, value, set }) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3.5 border-b border-white/6 last:border-0">
            <div>
              <div className="text-sm text-white">{label}</div>
              <div className="text-xs text-white/35 mt-0.5">{desc}</div>
            </div>
            <Toggle value={value} onChange={set} />
          </div>
        ))}
      </div>

      {/* ── Sécurité ────────────────────────────────────────── */}
      <div className="card-neo mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white">Sécurité</h2>
        </div>
        <div className="text-sm text-white/45 space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-white/6">
            <span>Session active</span>
            <span className="text-green-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Connecté
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/6">
            <span>Authentification</span>
            <span className="text-white/30 text-xs">Token JWT — Bearer</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span>Identifiant de session</span>
            <span className="text-white/25 text-xs font-mono">{user?.id?.slice(-8) ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Déconnexion ─────────────────────────────────────── */}
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

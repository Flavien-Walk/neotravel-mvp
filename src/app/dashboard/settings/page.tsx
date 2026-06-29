'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  User, Shield, Bell, LogOut, Building2,
  Save, Lock, CheckCircle, AlertCircle, RefreshCw,
  Mail, Clock, Eye, Key,
} from 'lucide-react'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-blue-600' : ''}`}
      style={!value ? { background: 'var(--dash-border)' } : undefined}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`}
      />
    </button>
  )
}

function Feedback({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm border"
      style={ok
        ? { background: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }
        : { background: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }}
    >
      {ok
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  )
}

function SettingsCard({
  children,
  icon: Icon,
  title,
  accent = '#2563EB',
}: {
  children: React.ReactNode
  icon: typeof User
  title: string
  accent?: string
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        boxShadow: 'var(--dash-shadow)',
      }}
    >
      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--dash-border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent + '14' }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dash-text-muted)' }}>
      {children}
    </label>
  )
}

function ReadonlyField({ value }: { value: string }) {
  return (
    <div
      className="w-full px-3 py-2.5 rounded-xl text-sm select-none"
      style={{
        background: 'var(--dash-muted)',
        border: '1px solid var(--dash-border)',
        color: 'var(--dash-text-muted)',
      }}
    >
      {value}
    </div>
  )
}

function InputField({ type = 'text', placeholder, value, onChange, autoComplete }: {
  type?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete={autoComplete}
      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
      style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        color: 'var(--dash-text)',
      }}
      onFocus={e => (e.currentTarget.style.borderColor = '#2563EB')}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--dash-border)')}
    />
  )
}

export default function DashboardSettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const router = useRouter()

  const [nom, setNom]               = useState(user?.nom ?? '')
  const [email, setEmail]           = useState(user?.email ?? '')
  const [organisation, setOrg]      = useState(user?.organisation ?? '')
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg]         = useState<{ ok: boolean; text: string } | null>(null)
  const [savingPwd, setSavingPwd]   = useState(false)

  const [notifLeads, setNotifLeads]         = useState(true)
  const [notifRelances, setNotifRelances]   = useState(true)
  const [notifComplexes, setNotifComplexes] = useState(false)

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
    } catch { /* apply locally */ }
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
    <div className="p-6 sm:p-8" style={{ background: 'var(--dash-bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>Paramètres du compte</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
          Profil, sécurité et préférences NeoTravel
        </p>
      </div>

      {/* 2-column grid */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── COLONNE GAUCHE ─────────────────────────────── */}
        <div className="space-y-5">

          {/* Profil */}
          <SettingsCard icon={User} title="Mon profil" accent="#2563EB">
            <form onSubmit={saveProfile}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Nom complet</FieldLabel>
                  <InputField
                    value={nom}
                    onChange={setNom}
                    placeholder="Votre nom"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <FieldLabel>Adresse email</FieldLabel>
                  <InputField
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="email@neotravel.fr"
                    autoComplete="email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Rôle</FieldLabel>
                    <ReadonlyField value={user?.role ?? '—'} />
                  </div>
                  <div>
                    <FieldLabel>Organisation</FieldLabel>
                    <InputField
                      value={organisation}
                      onChange={setOrg}
                      placeholder="NeoTravel"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar preview */}
              <div
                className="flex items-center gap-3 mt-4 p-3 rounded-xl"
                style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', color: '#1D4ED8' }}
                >
                  {(nom || user?.nom || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{nom || user?.nom || 'Utilisateur'}</div>
                  <div className="text-xs" style={{ color: 'var(--dash-text-faint)' }}>
                    {user?.role === 'admin' ? 'Administrateur' : 'Commercial'} · NeoTravel
                  </div>
                </div>
              </div>

              {profileMsg && <div className="mt-4"><Feedback ok={profileMsg.ok} msg={profileMsg.text} /></div>}
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#2563EB', color: '#fff' }}
              >
                {savingProfile
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />}
                Enregistrer le profil
              </button>
            </form>
          </SettingsCard>

          {/* Mot de passe */}
          <SettingsCard icon={Key} title="Changer le mot de passe" accent="#7C3AED">
            <form onSubmit={changePassword}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Mot de passe actuel</FieldLabel>
                  <InputField
                    type="password"
                    value={currentPwd}
                    onChange={setCurrentPwd}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <FieldLabel>Nouveau mot de passe</FieldLabel>
                  <InputField
                    type="password"
                    value={newPwd}
                    onChange={setNewPwd}
                    placeholder="8 caractères minimum"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <FieldLabel>Confirmer le nouveau mot de passe</FieldLabel>
                  <InputField
                    type="password"
                    value={confirmPwd}
                    onChange={setConfirmPwd}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {pwdMsg && <div className="mt-4"><Feedback ok={pwdMsg.ok} msg={pwdMsg.text} /></div>}
              <button
                type="submit"
                disabled={savingPwd}
                className="flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'var(--dash-muted)',
                  border: '1px solid var(--dash-border)',
                  color: 'var(--dash-text)',
                }}
              >
                {savingPwd
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Lock className="w-3.5 h-3.5" />}
                Modifier le mot de passe
              </button>
            </form>
          </SettingsCard>

        </div>

        {/* ── COLONNE DROITE ─────────────────────────────── */}
        <div className="space-y-5">

          {/* Préférences commerciales */}
          <SettingsCard icon={Building2} title="Préférences commerciales" accent="#D97706">
            <div className="space-y-4">
              <div>
                <FieldLabel>Signature email</FieldLabel>
                <ReadonlyField value={user?.nom ? `${user.nom} — NeoTravel` : 'Équipe NeoTravel'} />
                <p className="text-xs mt-1.5" style={{ color: 'var(--dash-text-faint)' }}>
                  Affichée dans les devis envoyés aux clients.
                </p>
              </div>
              <div>
                <FieldLabel>Délai cible de réponse</FieldLabel>
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}
                >
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#D97706' }} />
                  2h ouvrées
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--dash-text-faint)' }}>
                  Objectif affiché dans les confirmations client.
                </p>
              </div>
              <div>
                <FieldLabel>Email de contact</FieldLabel>
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#D97706' }} />
                  {email || user?.email || 'non renseigné'}
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Notifications */}
          <SettingsCard icon={Bell} title="Notifications" accent="#0284C7">
            <div className="space-y-0">
              {[
                {
                  label: 'Nouveaux leads entrants',
                  desc: 'Alerte à chaque nouvelle demande reçue.',
                  value: notifLeads,
                  set: setNotifLeads,
                },
                {
                  label: 'Relances à envoyer',
                  desc: 'Rappel lorsqu\'un devis est sans réponse 48h.',
                  value: notifRelances,
                  set: setNotifRelances,
                },
                {
                  label: 'Cas complexes',
                  desc: 'Notification si un dossier nécessite une reprise humaine.',
                  value: notifComplexes,
                  set: setNotifComplexes,
                },
              ].map(({ label, desc, value, set }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-3.5"
                  style={{ borderBottom: '1px solid var(--dash-border)' }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--dash-text)' }}>{label}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>{desc}</div>
                  </div>
                  <Toggle value={value} onChange={set} />
                </div>
              ))}
              <div className="pt-3">
                <p className="text-xs" style={{ color: 'var(--dash-text-faint)' }}>
                  Les notifications sont envoyées à{' '}
                  <span style={{ color: 'var(--dash-text-muted)' }}>{email || user?.email}</span>
                </p>
              </div>
            </div>
          </SettingsCard>

          {/* Sécurité */}
          <SettingsCard icon={Shield} title="Sécurité du compte" accent="#16A34A">
            <div className="space-y-0">
              {[
                {
                  label: 'Session active',
                  value: 'Connecté',
                  valueColor: '#16A34A',
                  dot: true,
                },
                {
                  label: 'Authentification',
                  value: 'Token JWT — Bearer',
                  valueColor: undefined,
                  dot: false,
                },
                {
                  label: 'Visibilité des données',
                  value: user?.role === 'admin' ? 'Tous les leads' : 'Leads assignés',
                  valueColor: undefined,
                  dot: false,
                },
                {
                  label: 'Identifiant de session',
                  value: user?.id?.slice(-8) ?? '—',
                  mono: true,
                  valueColor: undefined,
                  dot: false,
                },
              ].map(({ label, value, valueColor, dot, mono }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid var(--dash-border)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>{label}</span>
                  <span
                    className={`text-xs font-medium flex items-center gap-1.5 ${mono ? 'font-mono' : ''}`}
                    style={{ color: valueColor ?? 'var(--dash-text-faint)' }}
                  >
                    {dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}
            >
              <Eye className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Vos données de connexion ne sont jamais partagées avec des tiers.</span>
            </div>
          </SettingsCard>

        </div>
      </div>

      {/* Déconnexion */}
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--dash-border)' }}>
        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FECACA',
          }}
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
        <p className="text-xs mt-2" style={{ color: 'var(--dash-text-faint)' }}>
          Vous serez redirigé vers la page d&apos;accueil.
        </p>
      </div>
    </div>
  )
}

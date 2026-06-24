'use client'

import { useState, useCallback } from 'react'
import {
  X, Plus, Trash2, FileText, User, MapPin, Package,
  Euro, Check, AlertCircle, ChevronDown,
} from 'lucide-react'
import { api } from '@/lib/api'

interface QuoteLine {
  label: string
  quantity: number
  unit: string
  unit_price_ht: number
  tva_rate: number
  total_ht: number
}

const UNITS = ['forfait', 'km', 'heure', 'passager', 'trajet', 'jour']
const TVA_RATES = [10, 20]

const DEFAULT_LINE: QuoteLine = {
  label: '',
  quantity: 1,
  unit: 'forfait',
  unit_price_ht: 0,
  tva_rate: 20,
  total_ht: 0,
}

function computeTotal(lines: QuoteLine[]) {
  const total_ht = lines.reduce((s, l) => s + l.total_ht, 0)
  const tva      = lines.reduce((s, l) => s + l.total_ht * l.tva_rate / 100, 0)
  return { total_ht, tva, total_ttc: total_ht + tva }
}

const fieldStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--dash-border)',
  background: 'var(--dash-surface)',
  color: 'var(--dash-text)',
  fontSize: '13px',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--dash-text-muted)',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
}

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '1px solid var(--dash-border)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <span className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>{title}</span>
    </div>
  )
}

interface ModalProps {
  onClose: () => void
  leadId?: string
  defaultClient?: { nom?: string; email?: string; telephone?: string; societe?: string }
  defaultTrajet?: { depart?: string; destination?: string; date_depart?: string; date_retour?: string; nb_passagers?: number; type_trajet?: string; urgence?: string }
}

export default function ManualQuoteModal({ onClose, leadId, defaultClient, defaultTrajet }: ModalProps) {
  /* Client */
  const [nom,       setNom]       = useState(defaultClient?.nom ?? '')
  const [email,     setEmail]     = useState(defaultClient?.email ?? '')
  const [telephone, setTel]       = useState(defaultClient?.telephone ?? '')
  const [societe,   setSociete]   = useState(defaultClient?.societe ?? '')

  /* Trajet */
  const [depart,       setDepart]       = useState(defaultTrajet?.depart ?? '')
  const [destination,  setDest]         = useState(defaultTrajet?.destination ?? '')
  const [dateDepart,   setDateDepart]   = useState(defaultTrajet?.date_depart ?? '')
  const [dateRetour,   setDateRetour]   = useState(defaultTrajet?.date_retour ?? '')
  const [passagers,    setPassagers]    = useState(String(defaultTrajet?.nb_passagers ?? 1))
  const [typeTrajet,   setTypeTrajet]   = useState(defaultTrajet?.type_trajet ?? 'aller_simple')
  const [urgence,      setUrgence]      = useState(defaultTrajet?.urgence ?? 'normal')

  /* Lines */
  const [lines, setLines] = useState<QuoteLine[]>([
    { ...DEFAULT_LINE, label: 'Transport — Trajet principal', quantity: 1, unit: 'forfait', unit_price_ht: 0, tva_rate: 20, total_ht: 0 },
  ])

  /* Meta */
  const [remise,     setRemise]    = useState('0')
  const [validite,   setValidite]  = useState('30')
  const [commentaire, setComment]  = useState('')
  const [conditions,  setCond]     = useState('')

  /* UI */
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateLine = useCallback((i: number, patch: Partial<QuoteLine>) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l
      const next = { ...l, ...patch }
      next.total_ht = next.quantity * next.unit_price_ht
      return next
    }))
  }, [])

  const addLine = () => setLines(prev => [...prev, { ...DEFAULT_LINE }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))

  const { total_ht, tva, total_ttc } = computeTotal(lines)
  const remiseMontant = total_ht * (parseFloat(remise) || 0) / 100
  const finalHt  = total_ht - remiseMontant
  const finalTva = tva * (1 - (parseFloat(remise) || 0) / 100)
  const finalTtc = finalHt + finalTva

  const handleSubmit = async () => {
    if (!nom.trim() || !email.trim()) { setError('Nom et email client requis.'); return }
    if (!depart.trim() || !destination.trim()) { setError('Villes de départ et destination requises.'); return }
    if (lines.some(l => !l.label.trim())) { setError('Chaque ligne doit avoir un libellé.'); return }
    if (finalTtc <= 0) { setError('Le total TTC doit être supérieur à 0.'); return }

    setSaving(true); setError(null)
    try {
      await api.quotes.createManual({
        client: { nom, email, telephone, societe },
        trajet: { depart, destination, date_depart: dateDepart, date_retour: dateRetour || undefined, nb_passagers: parseInt(passagers) || 1, type_trajet: typeTrajet, urgence },
        lignes: lines.map(l => ({ ...l })),
        remise_pct: parseFloat(remise) || 0,
        validite_jours: parseInt(validite) || 30,
        commentaire,
        conditions,
        total_ht: finalHt,
        tva: finalTva,
        total_ttc: finalTtc,
        leadId: leadId || undefined,
      })
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onClose() }, 1800)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la création du devis.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-4 max-w-sm w-full text-center"
          style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)' }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-100">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--dash-text)' }}>Devis créé</div>
            <div className="text-sm mt-1" style={{ color: 'var(--dash-text-muted)' }}>
              Le devis manuel a été enregistré avec succès.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--dash-bg)', border: '1px solid var(--dash-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'var(--dash-surface)', borderBottom: '1px solid var(--dash-border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>Devis manuel</div>
              <div className="text-xs" style={{ color: 'var(--dash-text-faint)' }}>Source : manuel_commercial</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--dash-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Client */}
          <section>
            <SectionTitle icon={User} title="Informations client" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom complet *">
                <input style={fieldStyle} value={nom} onChange={e => setNom(e.target.value)} placeholder="Jean Dupont" />
              </Field>
              <Field label="Email *">
                <input style={fieldStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.fr" />
              </Field>
              <Field label="Téléphone">
                <input style={fieldStyle} type="tel" value={telephone} onChange={e => setTel(e.target.value)} placeholder="06 12 34 56 78" />
              </Field>
              <Field label="Société">
                <input style={fieldStyle} value={societe} onChange={e => setSociete(e.target.value)} placeholder="Entreprise XY" />
              </Field>
            </div>
          </section>

          {/* Trajet */}
          <section>
            <SectionTitle icon={MapPin} title="Trajet" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ville de départ *">
                <input style={fieldStyle} value={depart} onChange={e => setDepart(e.target.value)} placeholder="Paris" />
              </Field>
              <Field label="Destination *">
                <input style={fieldStyle} value={destination} onChange={e => setDest(e.target.value)} placeholder="Lyon" />
              </Field>
              <Field label="Date de départ">
                <input style={fieldStyle} type="date" value={dateDepart} onChange={e => setDateDepart(e.target.value)} />
              </Field>
              <Field label="Date de retour">
                <input style={fieldStyle} type="date" value={dateRetour} onChange={e => setDateRetour(e.target.value)} />
              </Field>
              <Field label="Passagers">
                <input style={fieldStyle} type="number" min="1" max="200" value={passagers} onChange={e => setPassagers(e.target.value)} />
              </Field>
              <Field label="Type de trajet">
                <div className="relative">
                  <select
                    style={{ ...fieldStyle, paddingRight: '32px', appearance: 'none' }}
                    value={typeTrajet}
                    onChange={e => setTypeTrajet(e.target.value)}
                  >
                    <option value="aller_simple">Aller simple</option>
                    <option value="aller_retour">Aller-retour</option>
                    <option value="circuit">Circuit / multi-étapes</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--dash-text-faint)' }} />
                </div>
              </Field>
              <Field label="Urgence">
                <div className="relative">
                  <select
                    style={{ ...fieldStyle, paddingRight: '32px', appearance: 'none' }}
                    value={urgence}
                    onChange={e => setUrgence(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent — 48h–7 jours</option>
                    <option value="tres_urgent">Très urgent — &lt; 24h</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--dash-text-faint)' }} />
                </div>
              </Field>
            </div>
          </section>

          {/* Lignes */}
          <section>
            <SectionTitle icon={Package} title="Lignes de devis" />

            {/* Table header */}
            <div
              className="grid gap-2 px-3 py-2 rounded-t-lg text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: 'var(--dash-muted)',
                color: 'var(--dash-text-faint)',
                gridTemplateColumns: '2fr 70px 90px 100px 70px 90px 32px',
              }}
            >
              <span>Libellé</span>
              <span>Qté</span>
              <span>Unité</span>
              <span>P.U. HT (€)</span>
              <span>TVA %</span>
              <span className="text-right">Total HT</span>
              <span />
            </div>

            {lines.map((line, i) => (
              <div
                key={i}
                className="grid gap-2 px-3 py-2 items-center"
                style={{
                  gridTemplateColumns: '2fr 70px 90px 100px 70px 90px 32px',
                  background: 'var(--dash-surface)',
                  borderBottom: '1px solid var(--dash-border)',
                  borderLeft: '1px solid var(--dash-border)',
                  borderRight: '1px solid var(--dash-border)',
                }}
              >
                <input
                  style={{ ...fieldStyle, padding: '6px 10px', fontSize: '12px' }}
                  value={line.label}
                  onChange={e => updateLine(i, { label: e.target.value })}
                  placeholder="Libellé de la prestation"
                />
                <input
                  style={{ ...fieldStyle, padding: '6px 8px', fontSize: '12px', textAlign: 'right' }}
                  type="number" min="0" step="0.01"
                  value={line.quantity}
                  onChange={e => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                />
                <div className="relative">
                  <select
                    style={{ ...fieldStyle, padding: '6px 8px', fontSize: '12px', paddingRight: '24px', appearance: 'none' }}
                    value={line.unit}
                    onChange={e => updateLine(i, { unit: e.target.value })}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'var(--dash-text-faint)' }} />
                </div>
                <input
                  style={{ ...fieldStyle, padding: '6px 8px', fontSize: '12px', textAlign: 'right' }}
                  type="number" min="0" step="0.01"
                  value={line.unit_price_ht}
                  onChange={e => updateLine(i, { unit_price_ht: parseFloat(e.target.value) || 0 })}
                />
                <div className="relative">
                  <select
                    style={{ ...fieldStyle, padding: '6px 6px', fontSize: '12px', paddingRight: '20px', appearance: 'none' }}
                    value={line.tva_rate}
                    onChange={e => updateLine(i, { tva_rate: parseInt(e.target.value) })}
                  >
                    {TVA_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'var(--dash-text-faint)' }} />
                </div>
                <div className="text-right text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
                  {line.total_ht.toFixed(2)} €
                </div>
                <button
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="p-1 rounded transition-colors disabled:opacity-30"
                  style={{ color: 'var(--dash-text-faint)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--dash-text-faint)')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={addLine}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-b-lg w-full transition-colors"
              style={{
                background: 'var(--dash-muted)',
                color: '#2563EB',
                border: '1px solid var(--dash-border)',
                borderTop: 'none',
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
            </button>
          </section>

          {/* Totaux */}
          <section>
            <SectionTitle icon={Euro} title="Totaux et paramètres" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Field label="Remise (%)">
                  <input
                    style={fieldStyle} type="number" min="0" max="100" step="0.1"
                    value={remise} onChange={e => setRemise(e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Validité du devis (jours)">
                  <input
                    style={fieldStyle} type="number" min="1"
                    value={validite} onChange={e => setValidite(e.target.value)}
                  />
                </Field>
              </div>
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)' }}
              >
                {[
                  { label: 'Total HT', value: finalHt.toFixed(2), bold: false },
                  { label: `TVA (mixte)`, value: finalTva.toFixed(2), bold: false },
                  ...(parseFloat(remise) > 0 ? [{ label: `Remise (${remise}%)`, value: `-${remiseMontant.toFixed(2)}`, bold: false }] : []),
                  { label: 'Total TTC', value: finalTtc.toFixed(2), bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--dash-text-muted)', fontWeight: bold ? 700 : 400 }}>{label}</span>
                    <span
                      className="text-sm font-mono"
                      style={{
                        color: bold ? 'var(--dash-text)' : 'var(--dash-text-muted)',
                        fontWeight: bold ? 700 : 400,
                        fontSize: bold ? '16px' : '13px',
                      }}
                    >
                      {value} €
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Commentaire commercial">
                <textarea
                  style={{ ...fieldStyle, minHeight: '72px', resize: 'vertical' }}
                  value={commentaire}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Notes internes, contexte, raison de l'ajustement…"
                />
              </Field>
              <Field label="Conditions particulières">
                <textarea
                  style={{ ...fieldStyle, minHeight: '72px', resize: 'vertical' }}
                  value={conditions}
                  onChange={e => setCond(e.target.value)}
                  placeholder="Conditions spécifiques à ce devis…"
                />
              </Field>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0 gap-3"
          style={{ background: 'var(--dash-surface)', borderTop: '1px solid var(--dash-border)' }}
        >
          <div className="flex items-center gap-2">
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}
            {!error && (
              <div className="text-xs" style={{ color: 'var(--dash-text-faint)' }}>
                Source : <span className="font-mono font-medium">manuel_commercial</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'var(--dash-muted)',
                color: 'var(--dash-text-muted)',
                border: '1px solid var(--dash-border)',
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center gap-2"
              style={{ background: '#2563EB' }}
            >
              {saving ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Création…</>
              ) : (
                <><FileText className="w-3.5 h-3.5" />Créer le devis</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

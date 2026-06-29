'use client'

import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, RefreshCw, Check, AlertTriangle, MapPin,
  Users, Calendar, Mail, User, Building2, Phone,
  Sparkles, ChevronRight,
} from 'lucide-react'
import { api } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedFields {
  nom?: string | null
  email?: string | null
  telephone?: string | null
  societe?: string | null
  depart?: string | null
  destination?: string | null
  date_depart?: string | null
  date_retour?: string | null
  nb_passagers?: number | null
  type_trajet?: string | null
  urgence?: string | null
  options?: string[]
  commentaire?: string | null
}

interface AIResponse {
  message: string
  extractedFields: ExtractedFields
  missingFields: string[]
  confidence: number
  isComplete: boolean
  besoin_reprise_humaine: boolean
  raison_reprise: string | null
  villes?: {
    depart_status?: string
    destination_status?: string
    depart_canonical?: string | null
    destination_canonical?: string | null
    depart_zone?: string | null
    destination_zone?: string | null
  }
  nextAction?: string
  unavailable?: boolean
}

const GREETING = `Bonjour ! Je suis l'assistant NeoTravel. Décrivez-moi votre besoin de transport librement — groupe, trajet, dates — et je m'occupe de préparer votre dossier.`

const FIELD_LABELS: Record<string, { label: string; icon: typeof MapPin }> = {
  nom:          { label: 'Nom',         icon: User      },
  email:        { label: 'Email',       icon: Mail      },
  telephone:    { label: 'Téléphone',   icon: Phone     },
  societe:      { label: 'Société',     icon: Building2 },
  depart:       { label: 'Départ',      icon: MapPin    },
  destination:  { label: 'Destination', icon: MapPin    },
  date_depart:  { label: 'Date aller',  icon: Calendar  },
  date_retour:  { label: 'Date retour', icon: Calendar  },
  nb_passagers: { label: 'Passagers',   icon: Users     },
  type_trajet:  { label: 'Type',        icon: ChevronRight },
}

const REQUIRED_FIELDS: (keyof ExtractedFields)[] = [
  'nom', 'email', 'depart', 'destination', 'date_depart', 'nb_passagers',
]

const SUGGESTIONS = [
  '30 personnes de Paris à Lyon le 15 juillet, aller-retour',
  'Car pour 55 étudiants, Bordeaux → Toulouse, 3 mars',
  'Voyage scolaire 48 élèves, sortie journée + retour',
]

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

const msgVar = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
}

function formatFieldValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return ''
  if (key === 'nb_passagers') return `${val} passagers`
  if (key === 'date_depart' || key === 'date_retour') {
    try {
      return new Date(String(val)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch { return String(val) }
  }
  if (Array.isArray(val)) return val.join(', ') || '—'
  return String(val)
}

export default function AIAssistantChat() {
  const router = useRouter()
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const typerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState<ExtractedFields>({})
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [hitl, setHitl] = useState<{ needed: boolean; raison: string | null }>({ needed: false, raison: null })
  const [villeWarning, setVilleWarning] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    return () => { if (typerRef.current) clearInterval(typerRef.current) }
  }, [])

  const filledCount = REQUIRED_FIELDS.filter(k => {
    const v = fields[k]
    return v !== null && v !== undefined && v !== ''
  }).length

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')
    setError(null)

    const userMsg: Message = { role: 'user', content }
    const newMessages: Message[] = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/quote-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentFields: fields,
        }),
      })

      if (!res.ok) throw new Error('Erreur serveur')
      const data: AIResponse = await res.json()

      if (data.unavailable) setUnavailable(true)

      // Typewriter effect — reveals the message progressively
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      const text = data.message
      const charsPerTick = Math.max(1, Math.ceil(text.length / 40))
      let idx = 0
      if (typerRef.current) clearInterval(typerRef.current)
      typerRef.current = setInterval(() => {
        idx = Math.min(idx + charsPerTick, text.length)
        flushSync(() => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: text.slice(0, idx) }
            return updated
          })
        })
        if (idx >= text.length) {
          clearInterval(typerRef.current!)
          typerRef.current = null
        }
      }, 30)

      if (data.extractedFields) {
        setFields(prev => {
          const merged = { ...prev }
          for (const [k, v] of Object.entries(data.extractedFields)) {
            if (v !== null && v !== undefined && v !== '') {
              (merged as Record<string, unknown>)[k] = v
            }
          }
          return merged
        })
      }

      setMissingFields(data.missingFields ?? [])
      setConfidence(data.confidence ?? 0)
      setIsComplete(data.isComplete ?? false)
      setHitl({ needed: data.besoin_reprise_humaine ?? false, raison: data.raison_reprise ?? null })

      const villes = data.villes ?? {}
      const warnings: string[] = []
      if (villes.depart_status === 'ambigu') warnings.push('Ville de départ ambiguë')
      if (villes.depart_status === 'inconnu') warnings.push('Ville de départ non reconnue')
      if (villes.destination_status === 'ambigu') warnings.push('Ville de destination ambiguë')
      if (villes.destination_status === 'inconnu') warnings.push('Ville de destination non reconnue')
      setVilleWarning(warnings.length > 0 ? warnings.join(' · ') : null)
    } catch {
      setError("Impossible de contacter l'assistant. Vérifiez votre connexion et réessayez.")
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  async function confirmSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        nom:          fields.nom ?? '',
        email:        fields.email ?? '',
        telephone:    fields.telephone ?? '',
        depart:       fields.depart ?? '',
        destination:  fields.destination ?? '',
        date_depart:  fields.date_depart ?? '',
        nb_passagers: Number(fields.nb_passagers) || 1,
        type_trajet:  fields.type_trajet || 'aller_simple',
        urgence:      (fields.urgence === 'prioritaire' ? 'tres_urgent' : fields.urgence) || 'normal',
        options:      Array.isArray(fields.options) ? fields.options : [],
      }
      // Champs optionnels : n'envoyer que s'ils ont une vraie valeur
      if (fields.societe)     payload.societe     = fields.societe
      if (fields.date_retour) payload.date_retour = fields.date_retour
      if (fields.commentaire) payload.commentaire = fields.commentaire

      await api.leads.create(payload)
      router.push('/merci')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi."
      setError(msg)
      setSubmitting(false)
    }
  }

  function reset() {
    if (typerRef.current) { clearInterval(typerRef.current); typerRef.current = null }
    setMessages([{ role: 'assistant', content: GREETING }])
    setInput('')
    setFields({})
    setMissingFields([])
    setConfidence(0)
    setIsComplete(false)
    setHitl({ needed: false, raison: null })
    setVilleWarning(null)
    setError(null)
    setUnavailable(false)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', boxShadow: '0 0 14px rgba(37,99,235,0.35)' }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Assistant NeoTravel</div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            L&apos;assistant collecte · le code calcule le prix
          </div>
        </div>
        <button onClick={reset} className="text-[11px] px-2.5 py-1 rounded-lg transition-all hover:bg-white/8" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Réinitialiser
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_200px] gap-4">
        {/* Chat column */}
        <div className="flex flex-col gap-3">
          {/* Messages */}
          <div
            ref={chatRef}
            className="space-y-3 max-h-80 overflow-y-auto pr-1 scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  variants={msgVar}
                  initial="hidden"
                  animate="visible"
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 mr-2 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'assistant'
                        ? 'rounded-tl-sm'
                        : 'rounded-tr-sm font-medium'
                    }`}
                    style={msg.role === 'assistant' ? {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.85)',
                    } : {
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      color: '#fff',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div variants={msgVar} initial="hidden" animate="visible" className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 mr-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Suggestions (only on first exchange) */}
          {messages.length === 1 && (
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-3 py-2.5 rounded-xl text-xs transition-all hover:bg-white/8"
                  style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-blue-400 mr-1.5">→</span>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Warnings */}
          {villeWarning && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#FBBF24' }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {villeWarning} — un conseiller vérifiera
            </div>
          )}

          {hitl.needed && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#FCA5A5' }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">Intervention conseiller NeoTravel</div>
                <div style={{ color: 'rgba(252,165,165,0.7)' }}>{hitl.raison ?? "Votre demande nécessite une validation par un conseiller."}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
              {error}
            </div>
          )}

          {/* Confirmation panel */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.12)' }}>
                  <Check className="w-4.5 h-4.5 text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Dossier complet</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Toutes les informations nécessaires ont été collectées
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/8"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Recommencer
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-105"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                    color: '#030D20',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                  }}
                >
                  {submitting
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Envoi…</>
                    : <><Send className="w-4 h-4" /> Confirmer ma demande</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* Input area — visible tant que non soumis, même si dossier complet */}
          {!submitting && (
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder={isComplete ? 'Vous pouvez encore ajouter des infos ou cliquer sur Confirmer…' : 'Décrivez votre besoin… (Entrée pour envoyer)'}
                rows={2}
                className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder-white/20"
                style={{ minHeight: '48px' }}
                disabled={loading}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={input.trim() && !loading ? {
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.25)',
                  }}
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Envoyer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fields summary sidebar */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Dossier — {filledCount}/{REQUIRED_FIELDS.length}
          </div>

          {/* Champs collectés */}
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(filledCount / REQUIRED_FIELDS.length) * 100}%`,
                background: filledCount === REQUIRED_FIELDS.length
                  ? 'linear-gradient(90deg, #4ADE80, #22D3EE)'
                  : 'linear-gradient(90deg, #2563EB, #0EA5E9)',
              }}
            />
          </div>

          {/* Confiance IA */}
          {confidence > 0 && (
            <div className="mb-1">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>Confiance IA</span>
                <span className="text-[9px] font-mono" style={{ color: confidence >= 0.8 ? '#4ADE80' : confidence >= 0.5 ? '#FCD34D' : '#F87171' }}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${confidence * 100}%`,
                    background: confidence >= 0.8 ? '#4ADE80' : confidence >= 0.5 ? '#FCD34D' : '#F87171',
                  }}
                />
              </div>
            </div>
          )}

          {Object.entries(FIELD_LABELS).map(([key, { label, icon: Icon }]) => {
            const val = (fields as Record<string, unknown>)[key]
            const isRequired = REQUIRED_FIELDS.includes(key as keyof ExtractedFields)
            const filled = val !== null && val !== undefined && val !== ''
            const display = filled ? formatFieldValue(key, val) : null

            return (
              <div
                key={key}
                className="flex items-start gap-2 px-2.5 py-2 rounded-xl"
                style={{
                  background: filled ? 'rgba(255,255,255,0.03)' : 'transparent',
                  border: filled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon
                    className="w-3 h-3"
                    style={{ color: filled ? '#60A5FA' : isRequired ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px]" style={{ color: filled ? 'rgba(255,255,255,0.4)' : isRequired ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)' }}>
                    {label}{isRequired && !filled && <span className="text-rose-500/60"> *</span>}
                  </div>
                  {display && (
                    <div className="text-[11px] font-medium text-white truncate mt-0.5">{display}</div>
                  )}
                </div>
                {filled && <Check className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />}
              </div>
            )
          })}

          {unavailable && (
            <div className="mt-2 px-2.5 py-2 rounded-xl text-[10px] leading-relaxed" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.7)' }}>
              Assistant IA non disponible. Utilisez l&apos;onglet Formulaire guidé.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, SkipForward, Check, Send, RotateCcw, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { ChatStep, LeadFormData } from '@/types'

const STEPS: ChatStep[] = [
  { id: 'nom', question: 'Quel est votre nom complet ?', field: 'nom', type: 'text', placeholder: 'Jean Dupont', validate: (v) => v.trim().length < 2 ? 'Veuillez entrer votre nom complet.' : null },
  { id: 'societe', question: 'Pour quelle société ou organisation ? (optionnel)', field: 'societe', type: 'text', placeholder: 'Entreprise XY, Lycée Victor Hugo...', optional: true },
  { id: 'email', question: 'Votre adresse email pour recevoir le devis ?', field: 'email', type: 'email', placeholder: 'jean.dupont@exemple.fr', validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Adresse email invalide.' },
  { id: 'telephone', question: 'Votre numéro de téléphone ?', field: 'telephone', type: 'tel', placeholder: '06 12 34 56 78', validate: (v) => v.replace(/\s/g, '').length >= 10 ? null : 'Numéro invalide.' },
  { id: 'depart', question: 'De quelle ville partez-vous ?', field: 'depart', type: 'text', placeholder: 'Paris, Lyon, Bordeaux...', validate: (v) => v.trim().length < 2 ? 'Ville de départ requise.' : null },
  { id: 'destination', question: 'Quelle est votre destination ?', field: 'destination', type: 'text', placeholder: 'Marseille, Toulouse, Lille...', validate: (v) => v.trim().length < 2 ? 'Ville de destination requise.' : null },
  { id: 'date_depart', question: 'Date de départ prévue ?', field: 'date_depart', type: 'date', validate: (v) => { if (!v) return 'Veuillez choisir une date.'; if (new Date(v) < new Date()) return 'La date doit être dans le futur.'; return null } },
  { id: 'date_retour', question: 'Date de retour ? (aller simple → passer)', field: 'date_retour', type: 'date', optional: true },
  { id: 'nb_passagers', question: 'Combien de passagers dans le groupe ?', field: 'nb_passagers', type: 'number', placeholder: 'Ex: 45', validate: (v) => { const n = parseInt(v); if (isNaN(n) || n < 1) return 'Au moins 1 passager.'; if (n > 85) return 'Max 85 passagers. Contactez-nous pour plus.'; return null } },
  { id: 'type_trajet', question: 'Quel type de trajet ?', field: 'type_trajet', type: 'select', options: [{ value: 'aller_simple', label: 'Aller simple' }, { value: 'aller_retour', label: 'Aller-retour' }, { value: 'circuit', label: 'Circuit / multi-étapes' }] },
  { id: 'urgence', question: 'Niveau d\'urgence ?', field: 'urgence', type: 'select', options: [{ value: 'normal', label: 'Normal — j\'ai le temps' }, { value: 'urgent', label: 'Urgent — 48h à 7 jours' }, { value: 'tres_urgent', label: 'Très urgent — moins de 24h' }] },
  { id: 'options', question: 'Options souhaitées ?', field: 'options', type: 'multiselect', options: [{ value: 'wifi', label: 'WiFi à bord' }, { value: 'hostesse', label: 'Hôtesse / accompagnateur' }, { value: 'repas', label: 'Repas servi à bord' }, { value: 'climatisation', label: 'Climatisation renforcée' }], optional: true },
  { id: 'commentaire', question: 'Informations complémentaires ?', field: 'commentaire', type: 'text', placeholder: 'Accès PMR, arrêts intermédiaires, horaires...', optional: true },
]

const INITIAL_DATA: LeadFormData = {
  nom: '', societe: '', email: '', telephone: '',
  depart: '', destination: '', date_depart: '', date_retour: '',
  nb_passagers: '', type_trajet: '', urgence: '', options: [], commentaire: '',
}

const msgVar = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function ChatBot() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_DATA)
  const [currentValue, setCurrentValue] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ from: 'bot' | 'user'; text: string }[]>([{ from: 'bot', text: STEPS[0].question }])
  const [showSummary, setShowSummary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const step = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const handleNext = () => {
    const value = step.type === 'multiselect' ? selectedOptions.join(',') : currentValue.trim()
    if (!step.optional && step.type !== 'multiselect' && !value) { setError('Ce champ est requis.'); return }
    if (step.validate && value) { const err = step.validate(value); if (err) { setError(err); return } }
    setError(null)

    const displayValue = step.type === 'multiselect'
      ? (selectedOptions.length === 0 ? 'Aucune option' : selectedOptions.map(o => step.options?.find(x => x.value === o)?.label || o).join(', '))
      : step.type === 'select' ? step.options?.find(o => o.value === value)?.label || value
      : value || '—'

    const newData = { ...formData, [step.field]: step.type === 'multiselect' ? selectedOptions : value }
    setFormData(newData)

    const newMessages = [...messages, { from: 'user' as const, text: displayValue || '—' }]
    if (currentStep < STEPS.length - 1) {
      newMessages.push({ from: 'bot' as const, text: STEPS[currentStep + 1].question })
      setMessages(newMessages); setCurrentStep(currentStep + 1); setCurrentValue(''); setSelectedOptions([])
    } else {
      setMessages(newMessages); setShowSummary(true)
    }
  }

  const toggleOption = (val: string) => setSelectedOptions(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await api.leads.create({ ...formData, nb_passagers: parseInt(formData.nb_passagers) || 0, options: typeof formData.options === 'string' ? (formData.options as string).split(',').filter(Boolean) : formData.options })
      router.push('/merci')
    } catch { setError('Erreur lors de l\'envoi. Veuillez réessayer.'); setIsSubmitting(false) }
  }

  if (showSummary) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="card-premium p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Résumé de votre demande</h2>
              <p className="text-xs text-white/40">Vérifiez avant d&apos;envoyer</p>
            </div>
          </div>

          <div className="space-y-1 mb-6">
            {STEPS.map((s) => {
              const val = formData[s.field]
              const display = Array.isArray(val)
                ? (val.length === 0 ? '—' : val.map(v => s.options?.find(o => o.value === v)?.label || v).join(', '))
                : s.options ? s.options.find(o => o.value === val)?.label || val || '—' : val || '—'
              return (
                <div key={s.id} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 text-sm gap-4">
                  <span className="text-white/35 shrink-0 capitalize">{s.id.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-white text-right">{display}</span>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setShowSummary(false); setCurrentStep(0); setMessages([{ from: 'bot', text: STEPS[0].question }]); setCurrentValue(''); setSelectedOptions([]); setFormData(INITIAL_DATA) }}
              className="btn-ghost flex-1 gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Recommencer
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-gold flex-1 gap-2">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-neo-900/30 border-t-neo-900 animate-spin" />
                  Envoi...
                </span>
              ) : (
                <><Send className="w-4 h-4" /> Envoyer ma demande</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-neo-blue"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs text-white/30 shrink-0 font-mono">{currentStep + 1}/{STEPS.length}</span>
      </div>

      {/* Conversation */}
      <div ref={chatRef} className="space-y-3 max-h-72 overflow-y-auto pr-1 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} variants={msgVar} initial="hidden" animate="visible" className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.from === 'bot' && (
                <div className="w-6 h-6 rounded-full shrink-0 mt-0.5 mr-2 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #4B8EF8, #22D3EE)' }}>
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5H7m0 0L3 9m4-4v14m4-7h6" />
                  </svg>
                </div>
              )}
              <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] leading-relaxed
                ${msg.from === 'bot'
                  ? 'bg-white/6 border border-white/8 text-white/85 rounded-tl-sm'
                  : 'bg-neo-blue text-white rounded-tr-sm font-medium'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input zone */}
      <div className="card-premium !p-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {(step.type === 'select' || step.type === 'multiselect') && step.options ? (
              <div className="space-y-2">
                {step.options.map((opt) => {
                  const selected = step.type === 'multiselect' ? selectedOptions.includes(opt.value) : currentValue === opt.value
                  return (
                    <button key={opt.value} onClick={() => { if (step.type === 'multiselect') toggleOption(opt.value); else { setCurrentValue(opt.value); setError(null) } }}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center gap-3
                        ${selected ? 'border-neo-blue/60 bg-neo-blue/12 text-white' : 'border-white/8 bg-white/3 text-white/60 hover:border-white/15 hover:text-white/80 hover:bg-white/5'}`}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                        ${selected ? 'border-neo-blue bg-neo-blue' : 'border-white/20'}`}>
                        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <input
                type={step.type}
                value={currentValue}
                onChange={(e) => { setCurrentValue(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
                placeholder={step.placeholder}
                min={step.type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
                className="input"
                autoFocus
              />
            )}

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />{error}
              </motion.p>
            )}

            <div className="flex gap-2 mt-3">
              {currentStep > 0 && (
                <button onClick={() => { setCurrentStep(s => s - 1); setMessages(m => m.slice(0, -2)); setCurrentValue(''); setError(null) }}
                  className="btn-ghost !px-3 !py-2.5 shrink-0" aria-label="Étape précédente">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {step.optional && (
                <button onClick={() => { setCurrentValue(''); setSelectedOptions([]); handleNext() }} className="btn-ghost !py-2.5 flex-1 gap-1.5 text-sm">
                  <SkipForward className="w-3.5 h-3.5" /> Passer
                </button>
              )}
              <button onClick={handleNext} className="btn-primary !py-2.5 flex-1 gap-1.5 text-sm">
                {currentStep === STEPS.length - 1 ? 'Voir le résumé' : 'Suivant'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

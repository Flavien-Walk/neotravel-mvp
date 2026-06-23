'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ChatStep, LeadFormData } from '@/types'

const STEPS: ChatStep[] = [
  {
    id: 'nom',
    question: 'Bonjour ! Pour commencer, quel est votre nom ?',
    field: 'nom',
    type: 'text',
    placeholder: 'Jean Dupont',
    validate: (v) => v.trim().length < 2 ? 'Veuillez entrer votre nom complet.' : null,
  },
  {
    id: 'societe',
    question: 'Pour quelle société ou organisation organisez-vous ce voyage ? (optionnel)',
    field: 'societe',
    type: 'text',
    placeholder: 'Entreprise XY, Lycée Victor Hugo...',
    optional: true,
  },
  {
    id: 'email',
    question: 'Quelle est votre adresse email pour recevoir le devis ?',
    field: 'email',
    type: 'email',
    placeholder: 'jean.dupont@exemple.fr',
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Adresse email invalide.',
  },
  {
    id: 'telephone',
    question: 'Votre numéro de téléphone ?',
    field: 'telephone',
    type: 'tel',
    placeholder: '06 12 34 56 78',
    validate: (v) => v.replace(/\s/g, '').length >= 10 ? null : 'Numéro de téléphone invalide.',
  },
  {
    id: 'depart',
    question: 'De quelle ville partez-vous ?',
    field: 'depart',
    type: 'text',
    placeholder: 'Paris, Lyon, Bordeaux...',
    validate: (v) => v.trim().length < 2 ? 'Veuillez indiquer la ville de départ.' : null,
  },
  {
    id: 'destination',
    question: 'Et quelle est votre destination ?',
    field: 'destination',
    type: 'text',
    placeholder: 'Marseille, Toulouse, Lille...',
    validate: (v) => v.trim().length < 2 ? 'Veuillez indiquer la ville de destination.' : null,
  },
  {
    id: 'date_depart',
    question: 'Quelle est la date de départ prévue ?',
    field: 'date_depart',
    type: 'date',
    validate: (v) => {
      if (!v) return 'Veuillez choisir une date.'
      if (new Date(v) < new Date()) return 'La date doit être dans le futur.'
      return null
    },
  },
  {
    id: 'date_retour',
    question: 'Y a-t-il une date de retour ? (laisser vide si aller simple)',
    field: 'date_retour',
    type: 'date',
    optional: true,
  },
  {
    id: 'nb_passagers',
    question: 'Combien de passagers seront dans le groupe ?',
    field: 'nb_passagers',
    type: 'number',
    placeholder: 'Ex: 45',
    validate: (v) => {
      const n = parseInt(v)
      if (isNaN(n) || n < 1) return 'Le nombre de passagers doit être au moins 1.'
      if (n > 85) return 'Capacité maximale : 85 passagers par véhicule. Contactez-nous pour des groupes plus importants.'
      return null
    },
  },
  {
    id: 'type_trajet',
    question: 'Quel type de trajet souhaitez-vous ?',
    field: 'type_trajet',
    type: 'select',
    options: [
      { value: 'aller_simple', label: 'Aller simple' },
      { value: 'aller_retour', label: 'Aller-retour' },
      { value: 'circuit', label: 'Circuit / multi-étapes' },
    ],
  },
  {
    id: 'urgence',
    question: 'Quel est le niveau d\'urgence de votre demande ?',
    field: 'urgence',
    type: 'select',
    options: [
      { value: 'normal', label: 'Normal — j\'ai le temps de planifier' },
      { value: 'urgent', label: 'Urgent — besoin sous 48h à 7 jours' },
      { value: 'tres_urgent', label: 'Très urgent — besoin dans les 24h' },
    ],
  },
  {
    id: 'options',
    question: 'Souhaitez-vous des options particulières ?',
    field: 'options',
    type: 'multiselect',
    options: [
      { value: 'wifi', label: 'WiFi à bord' },
      { value: 'hostesse', label: 'Hôtesse / accompagnateur' },
      { value: 'repas', label: 'Repas servi à bord' },
      { value: 'climatisation', label: 'Climatisation renforcée' },
    ],
    optional: true,
  },
  {
    id: 'commentaire',
    question: 'Avez-vous des informations complémentaires ou des besoins spécifiques ?',
    field: 'commentaire',
    type: 'text',
    placeholder: 'Accès PMR, arrêts intermédiaires, horaires précis...',
    optional: true,
  },
]

const INITIAL_DATA: LeadFormData = {
  nom: '', societe: '', email: '', telephone: '',
  depart: '', destination: '', date_depart: '', date_retour: '',
  nb_passagers: '', type_trajet: '', urgence: '', options: [], commentaire: '',
}

export default function ChatBot() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_DATA)
  const [currentValue, setCurrentValue] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ from: 'bot' | 'user'; text: string }[]>([
    { from: 'bot', text: STEPS[0].question },
  ])
  const [showSummary, setShowSummary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const step = STEPS[currentStep]

  const handleNext = () => {
    const value = step.type === 'multiselect' ? selectedOptions.join(',') : currentValue.trim()

    if (!step.optional && (step.type !== 'multiselect' && !value)) {
      setError('Ce champ est requis.')
      return
    }

    if (step.validate && value) {
      const err = step.validate(value)
      if (err) { setError(err); return }
    }

    setError(null)

    const displayValue = step.type === 'multiselect'
      ? (selectedOptions.length === 0 ? 'Aucune option' : selectedOptions.map(o => step.options?.find(x => x.value === o)?.label || o).join(', '))
      : step.type === 'select'
        ? step.options?.find(o => o.value === value)?.label || value
        : value || '—'

    const newData = { ...formData, [step.field]: step.type === 'multiselect' ? selectedOptions : value }
    setFormData(newData)

    const newMessages = [
      ...messages,
      { from: 'user' as const, text: displayValue || '—' },
    ]

    if (currentStep < STEPS.length - 1) {
      newMessages.push({ from: 'bot' as const, text: STEPS[currentStep + 1].question })
      setMessages(newMessages)
      setCurrentStep(currentStep + 1)
      setCurrentValue('')
      setSelectedOptions([])
    } else {
      setMessages(newMessages)
      setShowSummary(true)
    }
  }

  const toggleOption = (val: string) => {
    setSelectedOptions(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await api.leads.create({
        ...formData,
        nb_passagers: parseInt(formData.nb_passagers) || 0,
        options: typeof formData.options === 'string'
          ? (formData.options as string).split(',').filter(Boolean)
          : formData.options,
      })
      router.push('/merci')
    } catch (err) {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.')
      setIsSubmitting(false)
    }
  }

  if (showSummary) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Résumé de votre demande</h2>
          <p className="text-gray-500 text-sm mb-6">Vérifiez vos informations avant d&apos;envoyer</p>
          <div className="space-y-3">
            {STEPS.map((s) => {
              const val = formData[s.field]
              const display = Array.isArray(val)
                ? (val.length === 0 ? '—' : val.map(v => s.options?.find(o => o.value === v)?.label || v).join(', '))
                : s.options ? s.options.find(o => o.value === val)?.label || val || '—'
                : val || '—'
              return (
                <div key={s.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-500 w-40 shrink-0">{s.id.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-gray-900 text-right">{display}</span>
                </div>
              )
            })}
          </div>
          {error && <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setShowSummary(false); setCurrentStep(0); setMessages([{ from: 'bot', text: STEPS[0].question }]); setCurrentValue(''); setSelectedOptions([]); setFormData(INITIAL_DATA) }}
              className="btn-secondary flex-1"
            >
              Recommencer
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      {/* Barre de progression */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 shrink-0">{currentStep + 1}/{STEPS.length}</span>
      </div>

      {/* Fil de conversation */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-2xl px-4 py-3 text-sm max-w-xs sm:max-w-sm shadow-sm
                ${msg.from === 'bot'
                  ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  : 'bg-blue-600 text-white rounded-br-sm'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Zone de saisie */}
      <div className="card !p-4">
        {step.type === 'select' && step.options && (
          <div className="space-y-2">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setCurrentValue(opt.value); setError(null) }}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors
                  ${currentValue === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step.type === 'multiselect' && step.options && (
          <div className="space-y-2">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center gap-3
                  ${selectedOptions.includes(opt.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
              >
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                  ${selectedOptions.includes(opt.value) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {selectedOptions.includes(opt.value) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {(step.type === 'text' || step.type === 'email' || step.type === 'tel' || step.type === 'number' || step.type === 'date') && (
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

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 mt-3">
          {step.optional && (
            <button
              onClick={() => { setCurrentValue(''); setSelectedOptions([]); handleNext() }}
              className="btn-secondary flex-1"
            >
              Passer
            </button>
          )}
          <button onClick={handleNext} className="btn-primary flex-1">
            {currentStep === STEPS.length - 1 ? 'Voir le résumé' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  )
}

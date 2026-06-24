'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, X, Send, Sparkles, User, Loader2,
  ArrowRight, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

interface Fields {
  nom?: string | null
  email?: string | null
  depart?: string | null
  destination?: string | null
  date_depart?: string | null
  nb_passagers?: string | null
}

interface ApiResponse {
  message: string
  extractedFields?: Fields
  missingFields?: string[]
  isComplete?: boolean
  besoin_reprise_humaine?: boolean
  unavailable?: boolean
}

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

const WELCOME = 'Bonjour ! Je suis l’assistant NeoTravel. Décrivez votre besoin de transport de groupe et je prépare votre dossier.'

const CHIPS = [
  'Paris → Lyon, 40 personnes',
  'Transport scolaire Nantes',
  'Circuit Bretagne, 55 pax',
]

export default function FloatingAIWidget() {
  const [open, setOpen]           = useState(false)
  const [msgs, setMsgs]           = useState<Msg[]>([{ role: 'assistant', content: WELCOME }])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [fields, setFields]       = useState<Fields>({})
  const [isComplete, setComplete] = useState(false)
  const [hitl, setHitl]           = useState(false)
  const [badge, setBadge]         = useState(false)
  const [unavailable, setUnavail] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  useEffect(() => {
    if (open) {
      setBadge(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading || unavailable) return
    setInput('')

    const userMsg: Msg = { role: 'user', content: trimmed }
    const history = [...msgs, userMsg]
    setMsgs(history)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/quote-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, currentFields: fields }),
      })
      const data: ApiResponse = await res.json()

      if (data.unavailable) {
        setUnavail(true)
        setMsgs(prev => [...prev, { role: 'assistant', content: data.message || 'Assistant temporairement indisponible.' }])
      } else {
        setMsgs(prev => [...prev, { role: 'assistant', content: data.message }])
        if (data.extractedFields) {
          setFields(prev => {
            const next = { ...prev }
            for (const [k, v] of Object.entries(data.extractedFields!)) {
              if (v !== null && v !== undefined) (next as Record<string, unknown>)[k] = v
            }
            return next
          })
        }
        if (data.isComplete)             setComplete(true)
        if (data.besoin_reprise_humaine) setHitl(true)
        if (!open)                       setBadge(true)
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Une erreur est survenue. Veuillez réessayer.' }])
    }
    setLoading(false)
  }, [msgs, loading, fields, open, unavailable])

  const filledCount = Object.values(fields).filter(Boolean).length
  const progress    = Math.round((filledCount / 6) * 100)

  return (
    <>
      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop blur (mobile) */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] md:hidden"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 420 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 420 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 bottom-0 z-[9995] flex flex-col"
              style={{
                width: 'min(420px, 100vw)',
                background: 'linear-gradient(175deg, #06112A 0%, #040C1F 60%, #030B1C 100%)',
                borderLeft: '1px solid rgba(37,99,235,0.18)',
                boxShadow: '-24px 0 80px rgba(0,0,0,0.65)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)',
                    boxShadow: '0 0 22px rgba(37,99,235,0.45)',
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight">Assistant NeoTravel</div>
                  <div className="text-[11px] leading-tight" style={{ color: loading ? '#60A5FA' : 'rgba(255,255,255,0.3)' }}>
                    {loading ? 'En train de répondre…' : unavailable ? 'Indisponible' : 'En ligne'}
                  </div>
                </div>

                {/* Progress mini */}
                {filledCount > 0 && (
                  <div className="flex items-center gap-1.5 mr-1">
                    <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2563EB, #0EA5E9)' }}
                      />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: '#60A5FA' }}>{progress}%</span>
                  </div>
                )}

                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/8"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* HITL banner */}
              {hitl && (
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 flex-shrink-0"
                  style={{ background: 'rgba(192,132,252,0.06)', borderBottom: '1px solid rgba(192,132,252,0.12)' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C084FC' }} />
                  <p className="text-xs" style={{ color: '#DDD6FE' }}>
                    Un conseiller NeoTravel prendra en charge votre dossier personnellement.
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

                {/* Suggestion chips — only when fresh */}
                {msgs.length === 1 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ease: EASE }}
                    className="flex flex-wrap gap-1.5 mt-1"
                  >
                    {CHIPS.map(chip => (
                      <button
                        key={chip}
                        onClick={() => send(chip)}
                        className="text-[11px] px-3 py-1.5 rounded-full transition-all hover:opacity-80 active:scale-95"
                        style={{
                          background: 'rgba(37,99,235,0.1)',
                          color: '#93C5FD',
                          border: '1px solid rgba(37,99,235,0.2)',
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </motion.div>
                )}

                {msgs.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={msg.role === 'assistant' ? {
                        background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
                        boxShadow: '0 0 12px rgba(37,99,235,0.35)',
                      } : {
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {msg.role === 'assistant'
                        ? <Sparkles className="w-3 h-3 text-white" />
                        : <User className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.55)' }} />
                      }
                    </div>

                    <div
                      className={`max-w-[82%] text-sm leading-relaxed rounded-2xl px-3.5 py-2.5 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      style={msg.role === 'assistant' ? {
                        background: 'rgba(255,255,255,0.045)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.88)',
                      } : {
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.55) 0%, rgba(14,165,233,0.45) 100%)',
                        color: '#fff',
                        boxShadow: '0 2px 12px rgba(37,99,235,0.2)',
                      }}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)' }}
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3"
                      style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(j => (
                          <motion.div
                            key={j}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.35, 1, 0.35] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: j * 0.18, ease: 'easeInOut' }}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#60A5FA' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Complete CTA */}
                {isComplete && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: EASE }}
                    className="flex gap-2.5"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)' }}>
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <Link
                      href="/devis"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm font-semibold transition-all hover:brightness-105"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                        color: '#030D20',
                        boxShadow: '0 4px 18px rgba(245,158,11,0.3)',
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Compléter ma demande
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Disclaimer */}
              <div
                className="px-5 py-1.5 text-center text-[9.5px]"
                style={{ color: 'rgba(255,255,255,0.15)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
              >
                L&apos;assistant collecte uniquement — les prix sont calculés par le code NeoTravel
              </div>

              {/* Input */}
              <div className="px-4 pb-safe-4 pt-2 pb-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div
                  className="flex gap-2 rounded-2xl px-3.5 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.045)',
                    border: `1px solid ${input.trim() ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                    placeholder="Décrivez votre besoin de transport…"
                    disabled={loading || unavailable}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/22 outline-none py-0.5"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading || unavailable}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-110 disabled:opacity-25 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}
                  >
                    {loading
                      ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      : <Send className="w-3.5 h-3.5 text-white" />
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating Button ── */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center gap-2">
        {/* Tooltip */}
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.9 }}
              transition={{ delay: 1.5, duration: 0.25, ease: EASE }}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap pointer-events-none"
              style={{
                background: 'rgba(6,20,53,0.95)',
                border: '1px solid rgba(37,99,235,0.25)',
                color: '#93C5FD',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              Assistant IA
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <AnimatePresence>
          {badge && !open && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white z-10 pointer-events-none"
              style={{ background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
            >
              1
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
          style={open ? {
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          } : {
            background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)',
            border: '1px solid rgba(37,99,235,0.5)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.5), 0 0 0 0 rgba(37,99,235,0.3)',
            animation: badge ? 'widget-pulse 2s ease-in-out infinite' : undefined,
          }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                exit={{   rotate:  90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <X className="w-5 h-5 text-white" />
              </motion.span>
            ) : (
              <motion.span
                key="chat"
                initial={{ rotate: 90,  opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                exit={{   rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <style>{`
        @keyframes widget-pulse {
          0%  { box-shadow: 0 8px 32px rgba(37,99,235,0.5), 0 0 0   0   rgba(37,99,235,0.4); }
          70% { box-shadow: 0 8px 32px rgba(37,99,235,0.5), 0 0 0 12px rgba(37,99,235,0);   }
          100%{ box-shadow: 0 8px 32px rgba(37,99,235,0.5), 0 0 0   0   rgba(37,99,235,0);   }
        }
      `}</style>
    </>
  )
}

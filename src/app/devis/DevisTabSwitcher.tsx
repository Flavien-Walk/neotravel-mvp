'use client'

import { useState } from 'react'
import { MessageSquare, ListOrdered, Check, Zap } from 'lucide-react'
import ChatBot from '@/components/ChatBot'
import AIAssistantChat from '@/components/AIAssistantChat'

type TabId = 'form' | 'assistant'

const MODES = [
  {
    id: 'form' as TabId,
    Icon: ListOrdered,
    PointIcon: Check,
    label: 'Formulaire guidé',
    badge: 'Recommandé',
    tagline: 'Questions précises, étape par étape',
    points: ['~5 minutes', 'Résultat immédiat', 'Zéro ambiguïté'],
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
  },
  {
    id: 'assistant' as TabId,
    Icon: MessageSquare,
    PointIcon: Zap,
    label: 'Assistant IA',
    badge: 'IA',
    tagline: 'Décrivez votre besoin librement',
    points: ['Conversation naturelle', 'Extraction automatique', 'Cas complexes bienvenus'],
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
  },
]

export default function DevisTabSwitcher() {
  const [active, setActive] = useState<TabId>('form')
  const activeMode = MODES.find(m => m.id === active)!

  return (
    <div className="flex flex-col gap-4">

      {/* ── Mode picker ── */}
      <div className="grid grid-cols-2 gap-3">
        {MODES.map(({ id, Icon, PointIcon, label, badge, tagline, points, color, bg }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="relative text-left rounded-2xl p-4 sm:p-5 transition-all duration-300 focus-visible:outline-none"
              style={{
                background: isActive ? bg : 'rgba(255,255,255,0.022)',
                border: `1.5px solid ${isActive ? `${color}42` : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? `${color}18` : 'rgba(255,255,255,0.05)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? color : 'rgba(255,255,255,0.28)' }} />
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? `${color}16` : 'rgba(255,255,255,0.05)',
                    color: isActive ? color : 'rgba(255,255,255,0.2)',
                    border: `1px solid ${isActive ? `${color}28` : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  {badge}
                </span>
              </div>

              {/* Title */}
              <div
                className="font-bold text-sm mb-1"
                style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}
              >
                {label}
              </div>

              {/* Tagline */}
              <div
                className="text-[11px] mb-3 leading-snug hidden sm:block"
                style={{ color: isActive ? `${color}CC` : 'rgba(255,255,255,0.2)' }}
              >
                {tagline}
              </div>

              {/* Feature points */}
              <ul className="space-y-1.5 hidden sm:block">
                {points.map(pt => (
                  <li
                    key={pt}
                    className="flex items-center gap-1.5 text-[11px]"
                    style={{ color: isActive ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.14)' }}
                  >
                    <PointIcon
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: isActive ? color : 'rgba(255,255,255,0.15)' }}
                    />
                    {pt}
                  </li>
                ))}
              </ul>

              {/* Bottom accent */}
              {isActive && (
                <div
                  className="absolute bottom-0 inset-x-0 h-px rounded-b-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Active mode status bar ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
        style={{
          background: `${activeMode.color}07`,
          border: `1px solid ${activeMode.color}18`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ background: activeMode.color }}
        />
        <span className="text-xs font-semibold" style={{ color: activeMode.color }}>
          {activeMode.label}
        </span>
        <span className="text-white/15 text-xs">·</span>
        <span className="text-xs text-white/30">{activeMode.tagline}</span>
      </div>

      {/* ── Content ── */}
      <div>
        {active === 'form'      && <ChatBot />}
        {active === 'assistant' && <AIAssistantChat />}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { MessageSquare, ListOrdered } from 'lucide-react'
import ChatBot from '@/components/ChatBot'
import AIAssistantChat from '@/components/AIAssistantChat'

const TABS = [
  { id: 'form',      label: 'Formulaire guidé',  Icon: ListOrdered,   desc: 'Étape par étape'      },
  { id: 'assistant', label: 'Assistant IA',       Icon: MessageSquare, desc: 'Conversation libre'    },
] as const

type TabId = typeof TABS[number]['id']

export default function DevisTabSwitcher() {
  const [active, setActive] = useState<TabId>('form')

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {TABS.map(({ id, label, Icon, desc }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(14,165,233,0.08) 100%)',
                border: '1px solid rgba(37,99,235,0.28)',
                color: '#fff',
              } : {
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid transparent',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#60A5FA' : undefined }} />
              <span>{label}</span>
              <span
                className="hidden sm:block text-[10px] font-normal"
                style={{ color: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}
              >
                · {desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {active === 'form'      && <ChatBot />}
      {active === 'assistant' && <AIAssistantChat />}
    </div>
  )
}

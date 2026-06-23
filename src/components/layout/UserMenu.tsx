'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!user) return null

  const initials = user.nom
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all"
        aria-expanded={open}
        aria-label="Menu utilisateur"
      >
        <div className="w-7 h-7 rounded-full bg-neo-blue/25 border border-neo-blue/35 flex items-center justify-center text-neo-blue text-xs font-bold select-none">
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/35 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-52 rounded-2xl z-50 overflow-hidden"
            style={{
              background: '#071432',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="text-sm font-semibold text-white truncate">{user.nom}</div>
              <div className="text-[11px] text-white/35 mt-0.5 capitalize">{user.role}</div>
            </div>
            <div className="p-1.5">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Mon dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Settings className="w-4 h-4" />
                Mes paramètres
              </Link>
              <div className="my-1.5 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <button
                onClick={() => { logout(); router.push('/'); setOpen(false) }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-white/45 hover:text-red-400 hover:bg-red-500/8 transition-all text-left"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

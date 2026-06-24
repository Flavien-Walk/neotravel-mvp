'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, ScrollText, Settings, LogOut, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV = [
  { href: '/dashboard',          label: 'Vue d\'ensemble', icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/leads',    label: 'Leads',           icon: Users,           exact: false },
  { href: '/dashboard/logs',     label: 'Logs',            icon: ScrollText,      exact: false },
  { href: '/dashboard/settings', label: 'Paramètres',      icon: Settings,        exact: false },
]

const ROLE_MAP: Record<string, string> = {
  admin:      'Administrateur',
  commercial: 'Commercial',
}

function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <aside
      className="w-[232px] flex flex-col h-screen sticky top-0 flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #050F26 0%, #030C1E 100%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 h-14 flex-shrink-0 group"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)',
            boxShadow: '0 0 18px rgba(37,99,235,0.45)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M1.5 9.5 L6.5 2.5 L11.5 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.5 9.5 L6.5 7.5 L8.5 9.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6"/>
          </svg>
        </div>
        <div>
          <span className="font-bold text-sm text-white tracking-tight">NeoTravel</span>
          <div className="text-[9px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Dashboard
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-5 flex flex-col gap-0.5 overflow-y-auto">
        <div className="px-3 mb-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Espace commercial
          </span>
        </div>

        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={active ? {
                background: 'linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(14,165,233,0.06) 100%)',
                border: '1px solid rgba(37,99,235,0.22)',
                color: '#fff',
                fontWeight: 600,
              } : {
                color: 'rgba(255,255,255,0.38)',
                border: '1px solid transparent',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={active ? {
                  background: 'rgba(37,99,235,0.22)',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: active ? '#60A5FA' : 'rgba(255,255,255,0.32)' }} />
              </div>
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(96,165,250,0.45)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {user && (
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1.5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(14,165,233,0.22))',
                color: '#93C5FD',
                border: '1px solid rgba(37,99,235,0.28)',
              }}
            >
              {user.nom.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate leading-tight">{user.nom}</div>
              <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {ROLE_MAP[user.role] ?? user.role}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs rounded-xl transition-all text-white/30 hover:text-red-400 hover:bg-red-500/8"
        >
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#030D20' }}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
    if (!loading && user && user.role === 'client') router.replace('/client')
  }, [user, loading, router])

  if (loading) return <LoadingScreen />
  if (!user) return null

  return (
    <div className="min-h-screen text-white flex" style={{ background: '#060F22' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}

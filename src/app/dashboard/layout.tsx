'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, ScrollText, Settings, LogOut,
  ChevronRight, Plus, Zap,
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
const ROLE_COLOR: Record<string, string> = {
  admin:      '#F87171',
  commercial: '#4ADE80',
}

function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <aside
      className="w-[236px] flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #071028 0%, #040B1A 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Top ambient glow */}
      <div
        className="absolute top-0 inset-x-0 h-48 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% -10%, rgba(37,99,235,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Decorative dot grid bottom */}
      <div
        className="absolute bottom-0 inset-x-0 h-40 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 flex items-center gap-3 px-5 h-16 flex-shrink-0 group"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)',
            boxShadow: '0 0 22px rgba(37,99,235,0.55), 0 0 44px rgba(37,99,235,0.18)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M1.5 9.5 L6.5 2.5 L11.5 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 9.5 L6.5 7.5 L8.5 9.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-sm text-white tracking-tight">NeoTravel</div>
          <div className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Commercial
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 p-3 pt-4 flex flex-col gap-0.5 overflow-y-auto">

        {/* Quick action */}
        <Link
          href="/devis"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-3 text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(14,165,233,0.1) 100%)',
            border: '1px solid rgba(37,99,235,0.25)',
            color: '#93C5FD',
          }}
        >
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37,99,235,0.3)' }}
          >
            <Plus className="w-3 h-3 text-white" />
          </div>
          Nouveau lead
        </Link>

        <div className="px-3 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Navigation
          </span>
        </div>

        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={active ? {
                background: 'linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(14,165,233,0.06) 100%)',
                border: '1px solid rgba(37,99,235,0.22)',
                color: '#fff',
                fontWeight: 600,
              } : {
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid transparent',
              }}
            >
              {active && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #2563EB, #0EA5E9)' }}
                />
              )}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={active ? {
                  background: 'rgba(37,99,235,0.22)',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: active ? '#60A5FA' : 'rgba(255,255,255,0.3)' }} />
              </div>
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(96,165,250,0.4)' }} />}
            </Link>
          )
        })}

        {/* Status badge */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>Système opérationnel</span>
        </div>
      </nav>

      {/* User section */}
      <div className="relative z-10 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {user && (
          <div
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl mb-2"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.38), rgba(14,165,233,0.22))',
                color: '#93C5FD',
                border: '1px solid rgba(37,99,235,0.28)',
              }}
            >
              {user.nom.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate leading-tight">{user.nom}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Zap className="w-2.5 h-2.5 flex-shrink-0" style={{ color: ROLE_COLOR[user.role] ?? '#60A5FA' }} />
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {ROLE_MAP[user.role] ?? user.role}
                </span>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs rounded-xl transition-all hover:text-red-400 hover:bg-red-500/8"
          style={{ color: 'rgba(255,255,255,0.25)' }}
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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #0F1F3E 0%, #080F22 100%)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)', boxShadow: '0 0 24px rgba(37,99,235,0.5)' }}
        >
          <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
            <path d="M1.5 9.5 L6.5 2.5 L11.5 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 9.5 L6.5 7.5 L8.5 9.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55" />
          </svg>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
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
    <div className="min-h-screen text-white flex" style={{ background: '#0B1728' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}

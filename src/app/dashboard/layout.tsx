'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, ScrollText, Settings, LogOut,
  ChevronRight, Plus, FileText, Sun, Moon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import ManualQuoteModal from '@/components/ManualQuoteModal'

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

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all"
      style={{
        color: 'var(--dash-text-muted)',
        background: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-muted)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      aria-label="Basculer thème"
    >
      {theme === 'light' ? (
        <Moon className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <Sun className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
    </button>
  )
}

function Sidebar({ onOpenQuoteModal }: { onOpenQuoteModal: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside
      className="w-[220px] flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden transition-colors duration-200"
      style={{
        background: 'var(--dash-sidebar-bg)',
        borderRight: '1px solid var(--dash-sidebar-border)',
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 h-14 flex-shrink-0 group"
        style={{ borderBottom: '1px solid var(--dash-sidebar-border)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M1.5 9.5 L6.5 2.5 L11.5 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 9.5 L6.5 7.5 L8.5 9.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight" style={{ color: 'var(--dash-text)' }}>NeoTravel</div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--dash-text-faint)' }}>
            Espace commercial
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 p-3 pt-4 flex flex-col gap-0.5 overflow-y-auto">

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mb-4">
          <Link
            href="/devis"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
            style={{
              background: '#2563EB',
              color: '#fff',
            }}
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            Créer une demande
          </Link>
          <button
            onClick={onOpenQuoteModal}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
            style={{
              background: 'var(--dash-muted)',
              color: 'var(--dash-text)',
              border: '1px solid var(--dash-border)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-border)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--dash-muted)')}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            Créer un devis manuel
          </button>
        </div>

        <div className="px-1 mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--dash-text-faint)' }}>
            Navigation
          </span>
        </div>

        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
              style={active ? {
                background: 'var(--dash-active-bg)',
                color: 'var(--dash-active-text)',
                fontWeight: 600,
                border: '1px solid var(--dash-active-border)',
              } : {
                color: 'var(--dash-sidebar-text)',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--dash-muted)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: active ? 'var(--dash-active-text)' : 'var(--dash-text-faint)' }}
              />
              <span className="flex-1 leading-none">{label}</span>
              {active && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--dash-active-text)', opacity: 0.5 }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 flex flex-col gap-1" style={{ borderTop: '1px solid var(--dash-sidebar-border)' }}>
        <ThemeToggle />

        {user && (
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ background: 'var(--dash-muted)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                color: '#1D4ED8',
              }}
            >
              {user.nom.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate leading-tight" style={{ color: 'var(--dash-text)' }}>{user.nom}</div>
              <div className="text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>
                {ROLE_MAP[user.role] ?? user.role}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg transition-all"
          style={{ color: 'var(--dash-text-faint)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#DC2626'
            e.currentTarget.style.background = '#FEF2F2'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--dash-text-faint)'
            e.currentTarget.style.background = 'transparent'
          }}
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dash-bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)' }}
        >
          <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
            <path d="M1.5 9.5 L6.5 2.5 L11.5 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 9.5 L6.5 7.5 L8.5 9.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55" />
          </svg>
        </div>
        <div className="w-5 h-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
    if (!loading && user && user.role === 'client') router.replace('/client')
  }, [user, loading, router])

  if (loading) return <LoadingScreen />
  if (!user) return null

  return (
    <div className="min-h-screen flex transition-colors duration-200" style={{ background: 'var(--dash-bg)' }}>
      <Sidebar onOpenQuoteModal={() => setQuoteModalOpen(true)} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
      {quoteModalOpen && (
        <ManualQuoteModal onClose={() => setQuoteModalOpen(false)} />
      )}
    </div>
  )
}

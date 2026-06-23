'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, ScrollText, Settings, LogOut, ChevronRight, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/brand/Logo'

const NAV = [
  { href: '/dashboard',          label: 'Vue d\'ensemble', icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/leads',    label: 'Leads',           icon: Users,           exact: false },
  { href: '/dashboard/logs',     label: 'Logs',            icon: ScrollText,      exact: false },
  { href: '/dashboard/settings', label: 'Paramètres',      icon: Settings,        exact: false },
]

function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <aside className="w-60 border-r border-white/8 flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/8">
        <Link href="/"><Logo size="sm" /></Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? 'bg-neo-blue/12 text-neo-blue font-semibold'
                  : 'text-white/45 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          )
        })}

        <div className="mt-4 pt-4 border-t border-white/6">
          <Link
            href="/devis"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-neo-gold hover:bg-neo-gold/10 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            Nouvelle demande de devis
          </Link>
        </div>
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-white/8">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 mb-1">
            <div className="w-7 h-7 rounded-full bg-neo-blue/20 flex items-center justify-center text-neo-blue text-xs font-bold flex-shrink-0">
              {user.nom.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user.nom}</div>
              <div className="text-[10px] text-white/35 truncate capitalize">{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/35 hover:text-red-400 hover:bg-red-500/8 rounded-lg transition-all"
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
    <div className="min-h-screen bg-neo-900 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-neo-blue/30 border-t-neo-blue animate-spin" />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, loginDemo } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Auto-login en mode démo pour faciliter la navigation
      loginDemo()
    }
  }, [user, loading, loginDemo])

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-neo-900 text-white flex">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}

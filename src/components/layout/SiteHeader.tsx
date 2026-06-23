'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight, LayoutDashboard, LogIn, LogOut, User } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/#pour-qui',  label: 'Pour qui ?' },
  { href: '/#parcours',  label: 'Parcours' },
  { href: '/#fiabilite', label: 'Fiabilité' },
  { href: '/#faq',       label: 'FAQ' },
]

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  function handleLogout() {
    logout()
    router.push('/')
    setOpen(false)
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-neo-900/90 backdrop-blur-xl border-b border-white/8'
            : 'bg-transparent'
        }`}
      >
        <div className="container-neo px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          {/* Desktop nav — only on home */}
          {isHome && (
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm text-white/55 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-150"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-white/40 px-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {user.nom}
                </span>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/55 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/40 hover:text-red-400 rounded-lg hover:bg-red-500/8 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/55 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Connexion
              </Link>
            )}
            <Link href="/devis" className="btn-gold !px-4 !py-2 !text-sm gap-1.5">
              Demander un devis
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden glass rounded-lg p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-neo-900/95 backdrop-blur-xl border-b border-white/8 p-4"
          >
            <nav className="flex flex-col gap-1 mb-4">
              {isHome && NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-sm text-white/65 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  {item.label}
                </a>
              ))}
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-sm text-white/65 hover:text-white rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-sm text-left text-white/45 hover:text-red-400 rounded-xl hover:bg-red-500/8 transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-sm text-white/65 hover:text-white rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Connexion
                </Link>
              )}
            </nav>
            <Link href="/devis" onClick={() => setOpen(false)} className="btn-gold w-full !justify-center">
              Demander un devis <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

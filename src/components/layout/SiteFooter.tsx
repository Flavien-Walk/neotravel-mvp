import Link from 'next/link'
import Logo from '@/components/brand/Logo'

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/6 mt-auto">
      <div className="container-neo px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <Logo size="sm" />
            <p className="mt-3 text-sm text-white/40 max-w-xs">
              Plateforme d&apos;intermédiation transport de groupe. De la demande au devis, sans friction.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-1">Produit</span>
              <Link href="/devis" className="text-white/50 hover:text-white transition-colors">Demander un devis</Link>
              <Link href="/admin" className="text-white/50 hover:text-white transition-colors">Dashboard admin</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-1">Technique</span>
              <a href="https://github.com/Flavien-Walk/neotravel-mvp" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">GitHub</a>
              <span className="text-white/30 text-xs">MVP v0.1</span>
            </div>
          </div>
        </div>
        <div className="divider my-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
          <p>© 2024 NeoTravel — Prototype fonctionnel</p>
          <p className="italic">&ldquo;L&apos;agent collecte et orchestre, le code calcule.&rdquo;</p>
        </div>
      </div>
    </footer>
  )
}

import Image from 'next/image'
import AnimatedSection from '@/components/ui/AnimatedSection'

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
    alt: 'Équipe en séminaire corporate',
    caption: 'Séminaires d\'entreprise',
    size: 'col-span-2 row-span-2',
    height: 'h-full',
  },
  {
    src: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
    alt: 'Autocar de transport professionnel',
    caption: 'Autocars professionnels',
    size: 'col-span-1 row-span-1',
    height: 'h-full',
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    alt: 'Autocar sur autoroute',
    caption: 'Longue distance',
    size: 'col-span-1 row-span-1',
    height: 'h-full',
  },
  {
    src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=700&q=80',
    alt: 'Charter bus pour groupe',
    caption: 'Location charter',
    size: 'col-span-1 row-span-1',
    height: 'h-full',
  },
  {
    src: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=700&q=80',
    alt: 'Transport scolaire',
    caption: 'Sorties scolaires',
    size: 'col-span-1 row-span-1',
    height: 'h-full',
  },
]

export default function CorporatePhotoSection() {
  return (
    <section className="bg-white section-padding overflow-hidden">
      <div className="container-neo">
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="label-tag-dark mb-4">Notre flotte</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-4">
              Des autocars pour chaque occasion
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Minibus 8 places, autocar 50 passagers, bus à impériale — NeoTravel vous trouve
              le bon véhicule pour votre groupe, votre budget et votre trajet.
            </p>
          </div>
        </AnimatedSection>

        {/* Grille de photos */}
        <AnimatedSection delay={0.1}>
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl overflow-hidden"
            style={{ height: 420 }}
          >
            {/* Grande photo gauche */}
            <div className="relative col-span-2 row-span-2 overflow-hidden rounded-xl group">
              <Image
                src={PHOTOS[0].src}
                alt={PHOTOS[0].alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 text-white text-sm font-semibold">{PHOTOS[0].caption}</span>
            </div>

            {/* Photos droite — 2×2 */}
            {PHOTOS.slice(1).map((p) => (
              <div key={p.src} className="relative overflow-hidden rounded-xl group">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-white text-xs font-semibold">{p.caption}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Stats sous les photos */}
        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-slate-100">
            {[
              { value: '8 → 500', label: 'passagers par trajet', sub: 'Minibus, autocar standard ou grand tourisme' },
              { value: '48h', label: 'délai de confirmation', sub: 'Devis validé et véhicule réservé en moins de 48h' },
              { value: '100 %', label: 'traçabilité', sub: 'Chaque devis est documenté, chaque action est logguée' },
            ].map(({ value, label, sub }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
                <div className="text-sm font-semibold text-slate-700 mb-1">{label}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{sub}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

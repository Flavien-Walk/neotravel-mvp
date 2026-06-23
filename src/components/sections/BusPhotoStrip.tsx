import Image from 'next/image'

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    alt: 'Autocar moderne sur autoroute',
  },
  {
    src: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    alt: 'Flotte d\'autocars de transport de groupe',
  },
  {
    src: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80',
    alt: 'Autocar de voyage confortable',
  },
  {
    src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',
    alt: 'Autocar charter pour groupe',
  },
]

export default function BusPhotoStrip() {
  return (
    <div className="relative overflow-hidden" style={{ height: 220 }}>
      {/* Photo grid */}
      <div className="flex h-full">
        {PHOTOS.map(({ src, alt }, i) => (
          <div
            key={i}
            className="relative flex-1 overflow-hidden"
            style={{ minWidth: 0 }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="25vw"
            />
            {/* Overlay pour maintenir la lisibilité */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(3,13,32,0.35) 0%, rgba(3,13,32,0.55) 100%)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Fade gauche/droite depuis le fond de page */}
      <div
        className="absolute inset-y-0 left-0 w-24 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #030D20, transparent)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-24 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #030D20, transparent)' }}
      />

      {/* Label centré */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="px-5 py-2 rounded-full text-xs font-semibold text-white/80 uppercase tracking-widest"
          style={{ background: 'rgba(3,13,32,0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
        >
          Transport d&apos;autocar · Groupes de 8 à 500 passagers
        </div>
      </div>
    </div>
  )
}

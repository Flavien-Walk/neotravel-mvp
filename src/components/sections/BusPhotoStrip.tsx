import Image from 'next/image'

const PHOTOS = [
  { src: '/images/neotravel/bus-road.jpg',     alt: 'Autocar moderne sur autoroute' },
  { src: '/images/neotravel/group-travel.jpg',  alt: 'Groupe de voyageurs en autocar' },
  { src: '/images/neotravel/bus-group.jpg',     alt: 'Autocar charter pour transport de groupe' },
  { src: '/images/neotravel/bus-hero.jpg',      alt: 'Autocar de voyage longue distance' },
]

export default function BusPhotoStrip() {
  return (
    <div className="relative overflow-hidden" style={{ height: 240 }}>
      <div className="flex h-full">
        {PHOTOS.map(({ src, alt }, i) => (
          <div key={i} className="relative flex-1 overflow-hidden" style={{ minWidth: 0 }}>
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-center"
              sizes="25vw"
            />
            {/* Overlay minimal — on veut voir les photos */}
            <div className="absolute inset-0" style={{ background: 'rgba(3,13,32,0.15)' }} />
            {i < PHOTOS.length - 1 && (
              <div className="absolute inset-y-0 right-0 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Fondu latéral pour ne pas tronquer brutalement */}
      <div
        className="absolute inset-y-0 left-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(3,13,32,0.5), transparent)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(3,13,32,0.5), transparent)' }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none">
        <div
          className="px-5 py-2 rounded-full text-xs font-semibold text-white/95 uppercase tracking-widest"
          style={{
            background: 'rgba(3,13,32,0.5)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
          }}
        >
          Transport d&apos;autocar · Groupes de 8 à 500 passagers
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'

interface Props { size?: 'sm' | 'md' | 'lg'; href?: string }

export default function Logo({ size = 'md', href = '/' }: Props) {
  const sizes = { sm: 'h-7', md: 'h-8', lg: 'h-10' }
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }

  const el = (
    <span className="flex items-center gap-2.5 group">
      <span className={`${sizes[size]} aspect-square rounded-xl flex items-center justify-center relative overflow-hidden`}
        style={{ background: 'linear-gradient(135deg, #4B8EF8 0%, #22D3EE 100%)', boxShadow: '0 0 20px rgba(75,142,248,0.4)' }}>
        <svg className="w-[55%] h-[55%] text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5H7m0 0L3 9m4-4v14m4-7h6m0 0l4-4m-4 4v6" />
        </svg>
        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </span>
      <span className={`${textSizes[size]} font-bold tracking-tight text-white`}>
        Neo<span className="text-gradient-blue">Travel</span>
      </span>
    </span>
  )

  return href ? <Link href={href}>{el}</Link> : el
}

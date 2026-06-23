import { UrgenceLevel, URGENCE_LABELS, URGENCE_COLORS } from '@/types'

interface Props { urgence: UrgenceLevel; size?: 'sm' | 'md' }

export default function UrgencyBadge({ urgence, size = 'md' }: Props) {
  const label = URGENCE_LABELS[urgence] || urgence
  const color = URGENCE_COLORS[urgence] || 'bg-white/5 text-white/40 border border-white/10'
  const cls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${color} ${cls}`}>
      {label}
    </span>
  )
}

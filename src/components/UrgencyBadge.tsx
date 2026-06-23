import { UrgenceLevel, URGENCE_LABELS, URGENCE_COLORS } from '@/types'

interface Props {
  urgence: UrgenceLevel
  size?: 'sm' | 'md'
}

export default function UrgencyBadge({ urgence, size = 'md' }: Props) {
  const label = URGENCE_LABELS[urgence] || urgence
  const color = URGENCE_COLORS[urgence] || 'bg-gray-100 text-gray-700'
  const cls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${cls}`}>
      {label}
    </span>
  )
}

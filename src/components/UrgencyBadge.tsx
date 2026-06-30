import { UrgenceLevel, URGENCE_LABELS, URGENCE_COLORS } from '@/types'

interface Props { urgence: UrgenceLevel; size?: 'sm' | 'md' }

export default function UrgencyBadge({ urgence, size = 'md' }: Props) {
  const label = URGENCE_LABELS[urgence] || urgence
  const color = URGENCE_COLORS[urgence] || 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-500/12 dark:text-slate-400 dark:border-slate-500/20'
  const cls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${color} ${cls}`}>
      {label}
    </span>
  )
}

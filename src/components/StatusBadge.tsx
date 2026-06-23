import { LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'

interface Props { status: LeadStatus; size?: 'sm' | 'md' }

export default function StatusBadge({ status, size = 'md' }: Props) {
  const label = LEAD_STATUS_LABELS[status] || status
  const color = LEAD_STATUS_COLORS[status] || 'bg-white/5 text-white/40 border border-white/10'
  const cls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${color} ${cls}`}>
      {label}
    </span>
  )
}

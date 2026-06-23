import { LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'

interface Props {
  status: LeadStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const label = LEAD_STATUS_LABELS[status] || status
  const color = LEAD_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
  const cls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${cls}`}>
      {label}
    </span>
  )
}

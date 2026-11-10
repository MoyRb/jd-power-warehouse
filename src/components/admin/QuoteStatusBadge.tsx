import type { QuoteStatus } from '@/lib/db/types'

const STATUS_STYLES: Record<QuoteStatus, string> = {
  pending:   'bg-yellow-900/30 text-yellow-400 border border-yellow-700/40',
  reviewing: 'bg-blue-900/30 text-blue-400 border border-blue-700/40',
  sent:      'bg-purple-900/30 text-purple-400 border border-purple-700/40',
  accepted:  'bg-green-900/30 text-green-400 border border-green-700/40',
  rejected:  'bg-red-900/30 text-red-400 border border-red-700/40',
  expired:   'bg-[#2e2e2e] text-[#8c8c8c]',
}

interface Props {
  status: QuoteStatus
  className?: string
}

export default function QuoteStatusBadge({ status, className = '' }: Props) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status]} ${className}`}>
      {status}
    </span>
  )
}

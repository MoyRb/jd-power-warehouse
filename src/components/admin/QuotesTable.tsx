'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Quote, QuoteStatus } from '@/lib/db/types'
import QuoteStatusBadge from './QuoteStatusBadge'

interface Props {
  quotes: Quote[]
}

const STATUS_TABS: { label: string; value: QuoteStatus | 'all' }[] = [
  { label: 'All',       value: 'all'       },
  { label: 'Pending',   value: 'pending'   },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Sent',      value: 'sent'      },
  { label: 'Accepted',  value: 'accepted'  },
  { label: 'Rejected',  value: 'rejected'  },
  { label: 'Expired',   value: 'expired'   },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function displayName(quote: Quote): string {
  if (quote.customer?.company_name) return quote.customer.company_name
  if (quote.anon_company) return quote.anon_company
  return quote.anon_name ?? '—'
}

export default function QuotesTable({ quotes: initialQuotes }: Props) {
  const [tab, setTab] = useState<QuoteStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const quotes = initialQuotes

  const filtered = quotes.filter((q) => {
    const matchStatus = tab === 'all' || q.status === tab
    const term = search.toLowerCase()
    const matchSearch = !term || (
      q.quote_ref.toLowerCase().includes(term) ||
      (q.anon_name?.toLowerCase().includes(term) ?? false) ||
      (q.anon_company?.toLowerCase().includes(term) ?? false) ||
      (q.anon_email?.toLowerCase().includes(term) ?? false) ||
      (q.customer?.company_name?.toLowerCase().includes(term) ?? false)
    )
    return matchStatus && matchSearch
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          placeholder="Search ref, name, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#f3c41b] placeholder:text-[#555]"
        />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {STATUS_TABS.map((t) => {
          const count = t.value === 'all'
            ? quotes.length
            : quotes.filter((q) => q.status === t.value).length
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'bg-[#f3c41b] text-[#0f0f0f]'
                  : 'bg-[#1a1a1a] text-[#8c8c8c] hover:text-[#f6f4ee]'
              }`}
            >
              {t.label}
              {count > 0 && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8c8c8c] text-sm">
          {search ? 'No quotes match your search.' : 'No quotes in this status.'}
        </div>
      ) : (
        <div className="rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e2e] bg-[#141414]">
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Ref</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden lg:table-cell">Lines</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[#8c8c8c] font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-[#2e2e2e] hover:bg-[#141414]/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#f3c41b]">{quote.quote_ref}</span>
                  </td>
                  <td className="px-4 py-3 text-[#f6f4ee] font-medium">{displayName(quote)}</td>
                  <td className="px-4 py-3 text-[#8c8c8c] hidden md:table-cell">
                    {quote.anon_email ?? quote.customer?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#8c8c8c] hidden lg:table-cell">
                    {quote.lines?.length ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#8c8c8c] hidden lg:table-cell">
                    {formatDate(quote.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="text-xs text-[#8c8c8c] hover:text-[#f3c41b] transition-colors font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

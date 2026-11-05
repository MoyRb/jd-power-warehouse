'use client'

import { useState, useTransition } from 'react'
import type { Inquiry, InquiryStatus, InquiryType } from '@/lib/db/types'
import { updateInquiryStatusAction } from '@/app/admin/_actions/inquiries'

interface InquiriesTableProps {
  inquiries: Inquiry[]
}

const TYPE_BADGE: Record<InquiryType, string> = {
  quick_inquiry: 'bg-blue-900/30 text-blue-400 border border-blue-700/40',
  contact: 'bg-purple-900/30 text-purple-400 border border-purple-700/40',
  sell_request: 'bg-amber-900/30 text-amber-400 border border-amber-700/40',
}

const TYPE_LABEL: Record<InquiryType, string> = {
  quick_inquiry: 'Quick',
  contact: 'Contact',
  sell_request: 'Sell',
}

const STATUS_BADGE: Record<InquiryStatus, string> = {
  new: 'bg-green-900/30 text-green-400 border border-green-700/40',
  read: 'bg-[#2e2e2e] text-[#8c8c8c]',
  replied: 'bg-blue-900/30 text-blue-400 border border-blue-700/40',
  archived: 'bg-red-900/20 text-red-400/70 border border-red-900/30',
}

const TABS: { label: string; value: InquiryStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Read', value: 'read' },
  { label: 'Replied', value: 'replied' },
  { label: 'Archived', value: 'archived' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function InquiriesTable({ inquiries: initialInquiries }: InquiriesTableProps) {
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [tab, setTab] = useState<InquiryStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered =
    tab === 'all' ? inquiries : inquiries.filter((i) => i.status === tab)

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  function handleStatusChange(id: string, status: InquiryStatus) {
    startTransition(async () => {
      await updateInquiryStatusAction(id, status)
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i)),
      )
    })
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {TABS.map((t) => {
          const count =
            t.value === 'all'
              ? inquiries.length
              : inquiries.filter((i) => i.status === t.value).length
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
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8c8c8c] text-sm">
          No inquiries in this category.
        </div>
      ) : (
        <div className="rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e2e] bg-[#141414]">
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium w-20">Type</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[#8c8c8c] font-medium w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inquiry) => (
                <>
                  <tr
                    key={inquiry.id}
                    className={`border-b border-[#2e2e2e] hover:bg-[#141414]/60 transition-colors cursor-pointer ${
                      expanded === inquiry.id ? 'bg-[#141414]/40' : ''
                    }`}
                    onClick={() => toggleExpand(inquiry.id)}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[inquiry.type]}`}>
                        {TYPE_LABEL[inquiry.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#f6f4ee] font-medium">{inquiry.name}</td>
                    <td className="px-4 py-3 text-[#8c8c8c] hidden md:table-cell">{inquiry.email}</td>
                    <td className="px-4 py-3 text-[#8c8c8c] hidden lg:table-cell">
                      {formatDate(inquiry.created_at)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inquiry.status}
                        disabled={pending}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f3c41b] ${STATUS_BADGE[inquiry.status]}`}
                      >
                        <option value="new">new</option>
                        <option value="read">read</option>
                        <option value="replied">replied</option>
                        <option value="archived">archived</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right text-[#8c8c8c]">
                      {expanded === inquiry.id ? '▲' : '▼'}
                    </td>
                  </tr>

                  {expanded === inquiry.id && (
                    <tr key={`${inquiry.id}-expanded`} className="border-b border-[#2e2e2e] bg-[#141414]/20">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-3 text-sm">
                          {inquiry.phone && (
                            <p className="text-[#8c8c8c]">
                              Phone: <span className="text-[#f6f4ee]">{inquiry.phone}</span>
                            </p>
                          )}
                          <div>
                            <p className="text-[#8c8c8c] mb-1">Message:</p>
                            <p className="text-[#f6f4ee] whitespace-pre-wrap">{inquiry.message}</p>
                          </div>
                          {inquiry.type === 'sell_request' && (
                            <div className="mt-3 pt-3 border-t border-[#2e2e2e] grid sm:grid-cols-2 gap-3">
                              {inquiry.item_name && (
                                <p className="text-[#8c8c8c]">
                                  Item: <span className="text-[#f6f4ee]">{inquiry.item_name}</span>
                                </p>
                              )}
                              {inquiry.item_condition && (
                                <p className="text-[#8c8c8c]">
                                  Condition: <span className="text-[#f6f4ee]">{inquiry.item_condition}</span>
                                </p>
                              )}
                              {inquiry.asking_price !== null && (
                                <p className="text-[#8c8c8c]">
                                  Asking: <span className="text-[#f3c41b] font-bold">${inquiry.asking_price}</span>
                                </p>
                              )}
                              {inquiry.item_description && (
                                <div className="sm:col-span-2">
                                  <p className="text-[#8c8c8c] mb-1">Description:</p>
                                  <p className="text-[#f6f4ee]">{inquiry.item_description}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

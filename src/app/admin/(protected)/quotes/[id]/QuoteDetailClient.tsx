'use client'

import { useState, useTransition } from 'react'
import type { Quote, QuoteStatus } from '@/lib/db/types'
import { formatPrice } from '@/lib/utils'
import QuoteStatusBadge from '@/components/admin/QuoteStatusBadge'
import {
  updateQuoteStatusAction,
  setQuoteLinePricesAction,
  removeQuoteLineAction,
} from '@/app/admin/_actions/quotes'

// Valid transitions from each status (mirrors state machine in mock + migration)
const NEXT_STATUSES: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
  pending:   ['reviewing', 'rejected'],
  reviewing: ['sent', 'rejected'],
  sent:      ['accepted', 'rejected'],
  accepted:  [],
  rejected:  [],
  expired:   ['reviewing'],
}

interface Props {
  quote: Quote
}

export default function QuoteDetailClient({ quote: initial }: Props) {
  const [quote, setQuote] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [statusNote, setStatusNote] = useState('')
  const [statusTarget, setStatusTarget] = useState<QuoteStatus | ''>('')
  const [statusError, setStatusError] = useState('')
  const [priceMap, setPriceMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const l of initial.lines ?? []) {
      m[l.id] = l.unit_quoted_price != null ? String(l.unit_quoted_price) : ''
    }
    return m
  })
  const [priceError, setPriceError] = useState('')
  const [priceSuccess, setPriceSuccess] = useState(false)

  const nextOptions = NEXT_STATUSES[quote.status] ?? []

  function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!statusTarget) return
    setStatusError('')
    startTransition(async () => {
      const res = await updateQuoteStatusAction(quote.id, statusTarget, statusNote)
      if (res.success) {
        setQuote((prev) => ({ ...prev, status: statusTarget }))
        setStatusTarget('')
        setStatusNote('')
      } else {
        setStatusError(res.error ?? 'Failed to update status')
      }
    })
  }

  function handlePriceSave(e: React.FormEvent) {
    e.preventDefault()
    setPriceError('')
    setPriceSuccess(false)
    const prices = (quote.lines ?? []).map((l) => ({
      lineId: l.id,
      unitQuotedPrice: priceMap[l.id] !== '' ? Number(priceMap[l.id]) : null,
    }))
    startTransition(async () => {
      const res = await setQuoteLinePricesAction(quote.id, prices)
      if (res.success) {
        setQuote((prev) => ({
          ...prev,
          lines: prev.lines?.map((l) => ({
            ...l,
            unit_quoted_price: priceMap[l.id] !== '' ? Number(priceMap[l.id]) : null,
          })),
        }))
        setPriceSuccess(true)
      } else {
        setPriceError(res.error ?? 'Failed to save prices')
      }
    })
  }

  function handleRemoveLine(lineId: string) {
    startTransition(async () => {
      const res = await removeQuoteLineAction(quote.id, lineId)
      if (res.success) {
        setQuote((prev) => ({
          ...prev,
          lines: prev.lines?.filter((l) => l.id !== lineId),
        }))
        setPriceMap((prev) => {
          const copy = { ...prev }
          delete copy[lineId]
          return copy
        })
      }
    })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-[#f6f4ee]">{quote.quote_ref}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="text-[#8c8c8c] text-sm">Submitted {formatDate(quote.created_at)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: contact + lines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <section className="bg-[#141414] rounded-xl border border-[#2e2e2e] p-5">
            <h2 className="text-sm font-semibold text-[#8c8c8c] uppercase tracking-widest mb-4">Contact</h2>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#555] mb-0.5">Name</dt>
                <dd className="text-[#f6f4ee] font-medium">{quote.anon_name ?? quote.customer?.contact_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[#555] mb-0.5">Email</dt>
                <dd className="text-[#f6f4ee]">{quote.anon_email ?? quote.customer?.email ?? '—'}</dd>
              </div>
              {(quote.anon_phone ?? quote.customer?.phone) && (
                <div>
                  <dt className="text-[#555] mb-0.5">Phone</dt>
                  <dd className="text-[#f6f4ee]">{quote.anon_phone ?? quote.customer?.phone}</dd>
                </div>
              )}
              {(quote.anon_company ?? quote.customer?.company_name) && (
                <div>
                  <dt className="text-[#555] mb-0.5">Company</dt>
                  <dd className="text-[#f6f4ee]">{quote.anon_company ?? quote.customer?.company_name}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Lines */}
          <section className="bg-[#141414] rounded-xl border border-[#2e2e2e] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2e2e2e]">
              <h2 className="text-sm font-semibold text-[#8c8c8c] uppercase tracking-widest">Items</h2>
            </div>
            <form onSubmit={handlePriceSave}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e2e]">
                    <th className="text-left px-4 py-2.5 text-[#8c8c8c] font-medium">Item</th>
                    <th className="text-right px-4 py-2.5 text-[#8c8c8c] font-medium w-16">Qty</th>
                    <th className="text-right px-4 py-2.5 text-[#8c8c8c] font-medium w-28">List</th>
                    <th className="text-right px-4 py-2.5 text-[#8c8c8c] font-medium w-32">Quoted</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(quote.lines ?? []).map((line) => (
                    <tr key={line.id} className="border-b border-[#1e1e1e] last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-[#f6f4ee] font-medium">
                          {line.product?.name ?? line.description ?? '—'}
                        </p>
                        {line.product?.sku && (
                          <p className="text-xs text-[#555] mt-0.5">SKU: {line.product.sku}</p>
                        )}
                        {line.customer_note && (
                          <p className="text-xs text-[#8c8c8c] mt-1 italic">{line.customer_note}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[#f6f4ee]">{line.quantity}</td>
                      <td className="px-4 py-3 text-right text-[#8c8c8c]">
                        {line.unit_list_price != null ? formatPrice(line.unit_list_price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceMap[line.id] ?? ''}
                          onChange={(e) => {
                            setPriceMap((prev) => ({ ...prev, [line.id]: e.target.value }))
                            setPriceSuccess(false)
                          }}
                          className="w-28 bg-[#0a0a0a] border border-[#2e2e2e] text-[#f6f4ee] text-sm rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#f3c41b] placeholder:text-[#555]"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleRemoveLine(line.id)}
                          className="text-[#555] hover:text-red-400 transition-colors disabled:opacity-30"
                          title="Remove line"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-[#1e1e1e] flex items-center justify-between gap-3">
                {priceError && <p className="text-red-400 text-xs">{priceError}</p>}
                {priceSuccess && <p className="text-green-400 text-xs">Prices saved.</p>}
                {!priceError && !priceSuccess && <span />}
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-1.5 bg-[#f3c41b] text-[#0a0a0a] text-sm font-bold rounded-lg hover:bg-[#e6b800] transition-colors disabled:opacity-50"
                >
                  Save Prices
                </button>
              </div>
            </form>
          </section>

          {/* Event history */}
          {(quote.events?.length ?? 0) > 0 && (
            <section className="bg-[#141414] rounded-xl border border-[#2e2e2e] p-5">
              <h2 className="text-sm font-semibold text-[#8c8c8c] uppercase tracking-widest mb-4">History</h2>
              <ol className="space-y-3">
                {[...(quote.events ?? [])].reverse().map((ev) => (
                  <li key={ev.id} className="flex gap-3 text-sm">
                    <span className="text-[#555] shrink-0 w-36">
                      {new Date(ev.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </span>
                    <div>
                      <p className="text-[#f6f4ee] capitalize">{ev.event_type.replace(/_/g, ' ')}</p>
                      {ev.old_status && ev.new_status && (
                        <p className="text-xs text-[#8c8c8c]">
                          {ev.old_status} → {ev.new_status}
                        </p>
                      )}
                      {ev.note && <p className="text-xs text-[#8c8c8c] mt-0.5 italic">{ev.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Right: status change */}
        <div className="space-y-6">
          <section className="bg-[#141414] rounded-xl border border-[#2e2e2e] p-5">
            <h2 className="text-sm font-semibold text-[#8c8c8c] uppercase tracking-widest mb-4">Update Status</h2>
            {nextOptions.length === 0 ? (
              <p className="text-sm text-[#8c8c8c]">No transitions available from <span className="text-[#f6f4ee]">{quote.status}</span>.</p>
            ) : (
              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-[#8c8c8c] mb-1.5">New Status</label>
                  <select
                    value={statusTarget}
                    onChange={(e) => setStatusTarget(e.target.value as QuoteStatus)}
                    className="w-full bg-[#0a0a0a] border border-[#2e2e2e] text-[#f6f4ee] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f3c41b]"
                  >
                    <option value="">Select…</option>
                    {nextOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#8c8c8c] mb-1.5">
                    Note {statusTarget === 'reviewing' && quote.status === 'expired' ? '(required for reopen)' : '(optional)'}
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#2e2e2e] text-[#f6f4ee] text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#f3c41b] placeholder:text-[#555]"
                    placeholder="Add a note…"
                  />
                </div>
                {statusError && <p className="text-red-400 text-xs">{statusError}</p>}
                <button
                  type="submit"
                  disabled={pending || !statusTarget}
                  className="w-full py-2 bg-[#f3c41b] text-[#0a0a0a] text-sm font-bold rounded-lg hover:bg-[#e6b800] transition-colors disabled:opacity-50"
                >
                  Update
                </button>
              </form>
            )}
          </section>

          {quote.valid_until && (
            <section className="bg-[#141414] rounded-xl border border-[#2e2e2e] p-5">
              <h2 className="text-sm font-semibold text-[#8c8c8c] uppercase tracking-widest mb-2">Valid Until</h2>
              <p className="text-[#f6f4ee] text-sm">{formatDate(quote.valid_until)}</p>
            </section>
          )}

          {quote.admin_notes && (
            <section className="bg-[#141414] rounded-xl border border-[#2e2e2e] p-5">
              <h2 className="text-sm font-semibold text-[#8c8c8c] uppercase tracking-widest mb-2">Admin Notes</h2>
              <p className="text-[#f6f4ee] text-sm whitespace-pre-wrap">{quote.admin_notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

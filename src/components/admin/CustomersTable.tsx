'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { BusinessCustomer } from '@/lib/db/types'

interface Props {
  customers: BusinessCustomer[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function CustomersTable({ customers }: Props) {
  const [search, setSearch] = useState('')

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase()
    return !term || (
      c.company_name.toLowerCase().includes(term) ||
      c.contact_name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    )
  })

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search company, contact, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#f3c41b] placeholder:text-[#555]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8c8c8c] text-sm">
          {search ? 'No customers match your search.' : 'No customers yet.'}
        </div>
      ) : (
        <div className="rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e2e] bg-[#141414]">
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium">Company</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden sm:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden lg:table-cell">Country</th>
                <th className="text-left px-4 py-3 text-[#8c8c8c] font-medium hidden lg:table-cell">Added</th>
                <th className="text-right px-4 py-3 text-[#8c8c8c] font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[#2e2e2e] hover:bg-[#141414]/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[#f6f4ee] font-medium">{c.company_name}</p>
                    {c.price_tier && (
                      <span className="text-xs text-[#f3c41b] bg-[#f3c41b]/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {c.price_tier}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#8c8c8c] hidden sm:table-cell">{c.contact_name}</td>
                  <td className="px-4 py-3 text-[#8c8c8c] hidden md:table-cell">{c.email}</td>
                  <td className="px-4 py-3 text-[#8c8c8c] hidden lg:table-cell">{c.country ?? '—'}</td>
                  <td className="px-4 py-3 text-[#8c8c8c] hidden lg:table-cell">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${c.id}`}
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

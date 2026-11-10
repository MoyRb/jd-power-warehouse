import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import QuoteDetailClient from './QuoteDetailClient'

export const instant = false

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminQuoteDetailPage({ params }: Props) {
  await requireAdmin()
  const { id } = await params
  const quote = await db.getQuote(id)

  if (!quote) notFound()

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <nav className="text-sm text-[#8c8c8c] mb-6">
        <Link href="/admin/quotes" className="hover:text-[#f6f4ee] transition-colors">Quotes</Link>
        <span className="mx-2">/</span>
        <span className="text-[#f6f4ee]">{quote.quote_ref}</span>
      </nav>
      <QuoteDetailClient quote={quote} />
    </div>
  )
}

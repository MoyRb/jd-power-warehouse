import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import CustomerEditClient from './CustomerEditClient'

export const instant = false

interface Props {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: Props) {
  await requireAdmin()
  const { id } = await params
  const customer = await db.getCustomer(id)

  if (!customer) notFound()

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <nav className="text-sm text-[#8c8c8c] mb-6">
        <Link href="/admin/customers" className="hover:text-[#f6f4ee] transition-colors">Customers</Link>
        <span className="mx-2">/</span>
        <span className="text-[#f6f4ee]">{customer.company_name}</span>
      </nav>
      <h1 className="text-2xl font-black text-[#f6f4ee] mb-8">{customer.company_name}</h1>
      <CustomerEditClient customer={customer} />
    </div>
  )
}

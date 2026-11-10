import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/server'
import { createCustomerAction } from '@/app/admin/_actions/customers'
import CustomerForm from './CustomerForm'

export const instant = false

export default async function NewCustomerPage() {
  await requireAdmin()

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <nav className="text-sm text-[#8c8c8c] mb-6">
        <Link href="/admin/customers" className="hover:text-[#f6f4ee] transition-colors">Customers</Link>
        <span className="mx-2">/</span>
        <span className="text-[#f6f4ee]">New</span>
      </nav>
      <h1 className="text-2xl font-black text-[#f6f4ee] mb-8">New Customer</h1>
      <CustomerForm action={createCustomerAction} submitLabel="Create Customer" />
    </div>
  )
}

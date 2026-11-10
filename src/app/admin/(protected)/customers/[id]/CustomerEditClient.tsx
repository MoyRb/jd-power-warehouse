'use client'

import { useActionState } from 'react'
import type { BusinessCustomer } from '@/lib/db/types'
import { updateCustomerAction, type CustomerActionResult } from '@/app/admin/_actions/customers'

interface Props {
  customer: BusinessCustomer
}

const FIELD_CLASS = 'w-full bg-[#141414] border border-[#2e2e2e] text-[#f6f4ee] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#f3c41b] placeholder:text-[#555]'
const LABEL_CLASS = 'block text-xs text-[#8c8c8c] mb-1.5'

export default function CustomerEditClient({ customer }: Props) {
  const boundAction = updateCustomerAction.bind(null, customer.id)
  const [state, formAction, isPending] = useActionState<CustomerActionResult | null, FormData>(
    boundAction,
    null,
  )

  const err = (field: string) => state?.fieldErrors?.[field]

  return (
    <form action={formAction} className="space-y-5 max-w-xl">
      {state?.success && (
        <div className="bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3 text-sm text-green-400">
          Customer updated successfully.
        </div>
      )}
      {state?.error && !state.fieldErrors && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS} htmlFor="company_name">Company Name *</label>
          <input id="company_name" name="company_name" defaultValue={customer.company_name} className={FIELD_CLASS} required />
          {err('company_name') && <p className="text-red-400 text-xs mt-1">{err('company_name')}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="contact_name">Contact Name *</label>
          <input id="contact_name" name="contact_name" defaultValue={customer.contact_name} className={FIELD_CLASS} required />
          {err('contact_name') && <p className="text-red-400 text-xs mt-1">{err('contact_name')}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS} htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" defaultValue={customer.email} className={FIELD_CLASS} required />
          {err('email') && <p className="text-red-400 text-xs mt-1">{err('email')}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={customer.phone ?? ''} className={FIELD_CLASS} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="address">Address</label>
        <input id="address" name="address" defaultValue={customer.address ?? ''} className={FIELD_CLASS} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLASS} htmlFor="country">Country (ISO)</label>
          <input id="country" name="country" maxLength={2} defaultValue={customer.country ?? ''} className={FIELD_CLASS} />
          {err('country') && <p className="text-red-400 text-xs mt-1">{err('country')}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="tax_id">Tax ID</label>
          <input id="tax_id" name="tax_id" defaultValue={customer.tax_id ?? ''} className={FIELD_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="tax_id_type">Tax ID Type</label>
          <input id="tax_id_type" name="tax_id_type" placeholder="RFC / EIN / VAT" defaultValue={customer.tax_id_type ?? ''} className={FIELD_CLASS} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="price_tier">Price Tier</label>
        <input id="price_tier" name="price_tier" placeholder="standard / preferred / contract" defaultValue={customer.price_tier ?? ''} className={FIELD_CLASS} />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={customer.notes ?? ''} className={`${FIELD_CLASS} resize-none`} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 bg-[#f3c41b] text-[#0a0a0a] text-sm font-bold rounded-lg hover:bg-[#e6b800] transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}

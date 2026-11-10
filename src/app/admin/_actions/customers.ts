'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { CreateCustomerSchema, UpdateCustomerSchema } from '@/lib/validations/customer'

export interface CustomerActionResult {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createCustomerAction(
  _prev: CustomerActionResult | null,
  formData: FormData,
): Promise<CustomerActionResult> {
  await requireAdmin()

  const raw = {
    company_name: formData.get('company_name') as string,
    contact_name: formData.get('contact_name') as string,
    email:        formData.get('email') as string,
    phone:        (formData.get('phone') as string) || null,
    address:      (formData.get('address') as string) || null,
    country:      (formData.get('country') as string) || null,
    tax_id:       (formData.get('tax_id') as string) || null,
    tax_id_type:  (formData.get('tax_id_type') as string) || null,
    notes:        (formData.get('notes') as string) || null,
  }

  const parsed = CreateCustomerSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { success: false, error: parsed.error.issues[0]?.message, fieldErrors }
  }

  const customer = await db.createCustomer(parsed.data)
  revalidatePath('/admin/customers')
  redirect(`/admin/customers/${customer.id}`)
}

export async function updateCustomerAction(
  id: string,
  _prev: CustomerActionResult | null,
  formData: FormData,
): Promise<CustomerActionResult> {
  await requireAdmin()

  const raw = {
    company_name: (formData.get('company_name') as string) || undefined,
    contact_name: (formData.get('contact_name') as string) || undefined,
    email:        (formData.get('email') as string) || undefined,
    phone:        (formData.get('phone') as string) || null,
    address:      (formData.get('address') as string) || null,
    country:      (formData.get('country') as string) || null,
    tax_id:       (formData.get('tax_id') as string) || null,
    tax_id_type:  (formData.get('tax_id_type') as string) || null,
    notes:        (formData.get('notes') as string) || null,
    price_tier:   (formData.get('price_tier') as string) || null,
  }

  const parsed = UpdateCustomerSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { success: false, error: parsed.error.issues[0]?.message, fieldErrors }
  }

  await db.updateCustomer(id, parsed.data)
  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${id}`)
  return { success: true }
}

import { z } from 'zod'

export const CreateCustomerSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(100),
  email: z.string().email('A valid email address is required'),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  country: z.string().length(2, 'Use ISO-3166-1 alpha-2 (e.g. US, MX)').optional().nullable(),
  tax_id: z.string().max(50).optional().nullable(),
  tax_id_type: z.string().max(20).optional().nullable(),  // 'RFC' | 'EIN' | 'VAT' | custom
  notes: z.string().max(2000).optional().nullable(),
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  price_tier: z.string().max(50).optional().nullable(),
})

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>

import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0, 'Price must be non-negative').max(999999.99, 'Price is too large'),
  original_price: z.number().min(0).max(999999.99).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  badge: z.enum(['Sale', 'New']).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

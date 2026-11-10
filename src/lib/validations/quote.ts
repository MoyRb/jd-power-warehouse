import { z } from 'zod'

// ---------------------------------------------------------------------------
// Individual quote line schemas
// ---------------------------------------------------------------------------

export const CatalogLineSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(99999),
  description: z.string().max(500).optional().nullable(),
  customer_note: z.string().max(1000).optional().nullable(),
})

export const FreeFormLineSchema = z.object({
  product_id: z.null().optional(),
  quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(99999),
  description: z.string().min(1, 'Description is required for custom items').max(500),
  customer_note: z.string().max(1000).optional().nullable(),
})

export const QuoteLineInputSchema = z
  .union([CatalogLineSchema, FreeFormLineSchema])
  .refine(
    (line) =>
      (line.product_id != null && line.product_id !== '') ||
      (line.description != null && line.description.trim().length > 0),
    { message: 'Each item must reference a catalog product or include a description' },
  )

// ---------------------------------------------------------------------------
// Public quote submission
// ---------------------------------------------------------------------------

export const CreateQuoteSchema = z.object({
  anon_name: z.string().min(1, 'Name is required').max(100),
  anon_email: z.string().email('A valid email address is required'),
  anon_phone: z.string().max(30).optional().nullable(),
  anon_company: z.string().max(200).optional().nullable(),
  lines: z
    .array(QuoteLineInputSchema)
    .min(1, 'Add at least one item to your quote request')
    .max(20, 'A quote request can contain at most 20 items'),
  ip_hash: z.string().optional().nullable(),
})

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>

// ---------------------------------------------------------------------------
// Admin: set quoted prices
// ---------------------------------------------------------------------------

export const SetLinePricesSchema = z.object({
  prices: z
    .array(
      z.object({
        lineId: z.string().uuid(),
        unitQuotedPrice: z
          .number()
          .min(0, 'Price must be zero or positive')
          .max(9999999.99, 'Price exceeds maximum'),
      }),
    )
    .min(1),
})

export type SetLinePricesInput = z.infer<typeof SetLinePricesSchema>

// ---------------------------------------------------------------------------
// Admin: add a line to an existing quote
// ---------------------------------------------------------------------------

export const AddQuoteLineSchema = z
  .object({
    product_id: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1).max(99999),
    description: z.string().max(500).optional().nullable(),
  })
  .refine(
    (d) =>
      (d.product_id != null && d.product_id !== '') ||
      (d.description != null && d.description.trim().length > 0),
    { message: 'Provide a catalog product or a description' },
  )

export type AddQuoteLineInput = z.infer<typeof AddQuoteLineSchema>

// ---------------------------------------------------------------------------
// Admin: update quote status
// ---------------------------------------------------------------------------

export const UpdateQuoteStatusSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'sent', 'accepted', 'rejected', 'expired']),
  note: z.string().max(2000).optional().nullable(),
})

export type UpdateQuoteStatusInput = z.infer<typeof UpdateQuoteStatusSchema>

// ---------------------------------------------------------------------------
// Admin: update admin notes / valid_until on a quote
// ---------------------------------------------------------------------------

export const UpdateQuoteMetaSchema = z.object({
  admin_notes: z.string().max(2000).optional().nullable(),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional().nullable(),
})

export type UpdateQuoteMetaInput = z.infer<typeof UpdateQuoteMetaSchema>

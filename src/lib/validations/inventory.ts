import { z } from 'zod'

export const AdjustInventorySchema = z.object({
  product_id: z.string().uuid(),
  delta: z.number().int('Delta must be an integer'),
  reason: z.string().min(1).max(500),
})

export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>

import { z } from 'zod'

export const CreateInquirySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('quick_inquiry'),
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    message: z.string().min(1, 'Message is required').max(2000),
  }),
  z.object({
    type: z.literal('contact'),
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Valid email is required'),
    phone: z.string().max(30).optional(),
    message: z.string().min(1, 'Message is required').max(2000),
  }),
  z.object({
    type: z.literal('sell_request'),
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Valid email is required'),
    phone: z.string().max(30).optional(),
    message: z.string().min(1, 'Message is required').max(2000),
    item_name: z.string().min(1, 'Item name is required').max(200),
    item_description: z.string().max(2000).optional(),
    item_condition: z.enum(['new', 'used']).optional(),
    asking_price: z.number().min(0).max(999999.99).optional(),
  }),
])

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>

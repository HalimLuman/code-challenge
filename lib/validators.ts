import { z } from 'zod'

export const interestSchema = z.object({
  name: z
    .string()
    .min(1, 'Interest name is required')
    .max(50, 'Interest name must be 50 characters or fewer')
    .transform((v) => v.trim().toLowerCase()),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

export const connectionRequestSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID'),
})

export const connectionUpdateSchema = z.object({
  status: z.enum(['accepted', 'declined']),
})

export const messageSchema = z.object({
  body: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be 2000 characters or fewer'),
})

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only')
    .optional(),
  bio: z.string().max(280).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['public', 'connections', 'private']).optional(),
})

export const resetRequestSchema = z.object({
  email: z.string().email('Valid email required'),
})

export const resetConfirmSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const reportSchema = z.object({
  reported_id: z.string().uuid(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
  detail: z.string().max(500).optional(),
})

export function validationError(issues: z.ZodIssue[]) {
  return {
    error: 'Validation failed',
    fields: Object.fromEntries(issues.map((i) => [i.path.join('.'), i.message])),
  }
}

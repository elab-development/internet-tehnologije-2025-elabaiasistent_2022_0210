// src/lib/validations/admin.ts

import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
})

export const blockUserSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED']),
  reason: z.string().optional(),
})

export const createSourceSchema = z.object({
  url: z.string().url('Nevažeći URL'),
  sourceType: z.enum(['ELAB_MAIN', 'ELAB_BC', 'ELAB_EBT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  crawlFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL']).default('WEEKLY'),
})

export const updateSourceSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  crawlFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL']).optional(),
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type BlockUserInput = z.infer<typeof blockUserSchema>
export type CreateSourceInput = z.infer<typeof createSourceSchema>
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>
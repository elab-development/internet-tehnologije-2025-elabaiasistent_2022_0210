// src/lib/validations/moderator.ts

import { z } from 'zod'

export const createFlagSchema = z.object({
  messageId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  flagType: z.enum([
    'INAPPROPRIATE_CONTENT',
    'SPAM',
    'INCORRECT_ANSWER',
    'TECHNICAL_ERROR',
    'OTHER',
  ]),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
})

export const resolveFlagSchema = z.object({
  status: z.enum(['REVIEWED', 'RESOLVED', 'DISMISSED']),
})

export const createFAQSchema = z.object({
  question: z.string().min(10, 'Pitanje mora imati najmanje 10 karaktera'),
  answer: z.string().min(20, 'Odgovor mora imati najmanje 20 karaktera'),
  category: z.string().default('Opšte'),
})

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Naslov mora imati najmanje 5 karaktera'),
  description: z.string().min(20, 'Opis mora imati najmanje 20 karaktera'),
  ticketType: z.enum(['BUG', 'FEATURE_REQUEST', 'CRAWLING_ERROR', 'LLM_ERROR', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  attachmentUrl: z.string().url().optional(),
})

export type CreateFlagInput = z.infer<typeof createFlagSchema>
export type ResolveFlagInput = z.infer<typeof resolveFlagSchema>
export type CreateFAQInput = z.infer<typeof createFAQSchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
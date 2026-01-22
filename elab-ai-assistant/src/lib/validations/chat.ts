// src/lib/validations/chat.ts

import { z } from 'zod'

export const createConversationSchema = z.object({
  title: z.string().optional(),
})

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Nevažeći ID konverzacije'),
  content: z.string().min(1, 'Poruka ne može biti prazna').max(2000, 'Poruka je predugačka'),
})

export const rateMessageSchema = z.object({
  messageId: z.string().uuid('Nevažeći ID poruke'),
  rating: z.enum(['POSITIVE', 'NEGATIVE']),
  feedbackText: z.string().max(500).optional(),
})

export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type RateMessageInput = z.infer<typeof rateMessageSchema>
import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
} from '@/lib/validations/auth'
import {
  createConversationSchema,
  sendMessageSchema,
  rateMessageSchema,
} from '@/lib/validations/chat'

describe('Validation Schemas', () => {
  describe('Auth Validation - registerSchema', () => {
    it('should validate correct FON email and strong password', () => {
      const validData = {
        email: 'test@fon.bg.ac.rs',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate student FON email', () => {
      const validData = {
        email: 'student@student.fon.bg.ac.rs',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject non-FON email', () => {
      const invalidData = {
        email: 'test@gmail.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('FON email')
      }
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject weak password - too short', () => {
      const invalidData = {
        email: 'test@fon.bg.ac.rs',
        password: 'Short1!',
        confirmPassword: 'Short1!',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('8 karaktera')
      }
    })

    it('should reject password without uppercase', () => {
      const invalidData = {
        email: 'test@fon.bg.ac.rs',
        password: 'securepass123!',
        confirmPassword: 'securepass123!',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('veliko slovo')
      }
    })

    it('should reject password without lowercase', () => {
      const invalidData = {
        email: 'test@fon.bg.ac.rs',
        password: 'SECUREPASS123!',
        confirmPassword: 'SECUREPASS123!',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('malo slovo')
      }
    })

    it('should reject password without number', () => {
      const invalidData = {
        email: 'test@fon.bg.ac.rs',
        password: 'SecurePass!',
        confirmPassword: 'SecurePass!',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('broj')
      }
    })

    it('should reject password without special character', () => {
      const invalidData = {
        email: 'test@fon.bg.ac.rs',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('specijalni karakter')
      }
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@fon.bg.ac.rs',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ne poklapaju')
      }
    })
  })

  describe('Auth Validation - loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('obavezna')
      }
    })
  })

  describe('Chat Validation - createConversationSchema', () => {
    it('should validate with optional title', () => {
      const validData = {
        title: 'Test Conversation',
      }

      const result = createConversationSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate without title', () => {
      const validData = {}

      const result = createConversationSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Chat Validation - sendMessageSchema', () => {
    it('should validate correct message', () => {
      const validData = {
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Hello, this is a test message',
      }

      const result = sendMessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidData = {
        conversationId: 'not-a-uuid',
        content: 'Hello',
      }

      const result = sendMessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ID konverzacije')
      }
    })

    it('should reject empty message', () => {
      const invalidData = {
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        content: '',
      }

      const result = sendMessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('prazna')
      }
    })

    it('should reject message longer than 2000 characters', () => {
      const invalidData = {
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'a'.repeat(2001),
      }

      const result = sendMessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('predugačka')
      }
    })
  })

  describe('Chat Validation - rateMessageSchema', () => {
    it('should validate positive rating without feedback', () => {
      const validData = {
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 'POSITIVE' as const,
      }

      const result = rateMessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate negative rating with feedback', () => {
      const validData = {
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 'NEGATIVE' as const,
        feedbackText: 'The answer was not helpful',
      }

      const result = rateMessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid rating', () => {
      const invalidData = {
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 'INVALID',
      }

      const result = rateMessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject feedback longer than 500 characters', () => {
      const invalidData = {
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 'NEGATIVE' as const,
        feedbackText: 'a'.repeat(501),
      }

      const result = rateMessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid message ID', () => {
      const invalidData = {
        messageId: 'not-a-uuid',
        rating: 'POSITIVE' as const,
      }

      const result = rateMessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

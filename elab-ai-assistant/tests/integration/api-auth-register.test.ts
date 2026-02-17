import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: () => 'mock-token-123456789',
  })),
}))

vi.mock('next/server', () => ({
  NextRequest: class {
    headers = new Map()
    json = vi.fn()
  },
  NextResponse: {
    json: vi.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      data,
    })),
  },
}))

describe('API Integration - Auth Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with FON email', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@fon.bg.ac.rs',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1'),
        },
      } as any

      const mockUser = {
        id: '123',
        email: 'test@fon.bg.ac.rs',
        role: 'USER',
        verified: false,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password')
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser as any)
      vi.mocked(sendVerificationEmail).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123',
      })
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toContain('Registracija uspešna')
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('test@fon.bg.ac.rs')
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should reject registration if user already exists', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'existing@fon.bg.ac.rs',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1'),
        },
      } as any

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: '123',
        email: 'existing@fon.bg.ac.rs',
      } as any)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('već postoji')
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should reject registration with non-FON email', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@gmail.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1'),
        },
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validacija neuspešna')
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should reject registration with weak password', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@fon.bg.ac.rs',
          password: 'weak',
          confirmPassword: 'weak',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1'),
        },
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validacija neuspešna')
    })

    it('should reject registration with mismatched passwords', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@fon.bg.ac.rs',
          password: 'SecurePass123!',
          confirmPassword: 'DifferentPass123!',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1'),
        },
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validacija neuspešna')
    })

    it('should continue registration even if email fails to send', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@fon.bg.ac.rs',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1'),
        },
      } as any

      const mockUser = {
        id: '123',
        email: 'test@fon.bg.ac.rs',
        role: 'USER',
        verified: false,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password')
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser as any)
      vi.mocked(sendVerificationEmail).mockResolvedValueOnce({
        success: false,
        error: 'Email service unavailable',
      })
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toContain('email nije poslat')
      expect(data.emailError).toBeDefined()
      expect(prisma.user.create).toHaveBeenCalled()
    })

    it('should hash password before saving', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@fon.bg.ac.rs',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
        headers: {
          get: vi.fn().mockReturnValue('127.0.0.1'),
        },
      } as any

      const mockUser = {
        id: '123',
        email: 'test@fon.bg.ac.rs',
        role: 'USER',
        verified: false,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password-123')
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser as any)
      vi.mocked(sendVerificationEmail).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123',
      })
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any)

      await POST(mockRequest)

      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10)
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'hashed-password-123',
          }),
        })
      )
    })

    it('should create audit log entry', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'test@fon.bg.ac.rs',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        }),
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1'),
        },
      } as any

      const mockUser = {
        id: '123',
        email: 'test@fon.bg.ac.rs',
        role: 'USER',
        verified: false,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password')
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser as any)
      vi.mocked(sendVerificationEmail).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123',
      })
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any)

      await POST(mockRequest)

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: '123',
            action: 'USER_REGISTERED',
            resourceType: 'User',
            ipAddress: '192.168.1.1',
          }),
        })
      )
    })
  })
})

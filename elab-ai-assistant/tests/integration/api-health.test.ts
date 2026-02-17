import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/health/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      data,
    })),
  },
}))

describe('API Integration - Health Check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('should return healthy status when database is connected', async () => {
      // Mock successful database query
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }])

      const response = await GET()
      const data = await response.json()

      expect(data.status).toBe('healthy')
      expect(data).toHaveProperty('timestamp')
      expect(data.database).toBe('connected')
      expect(data).toHaveProperty('uptime')
      expect(response.status).toBe(200)
    })

    it('should return unhealthy status when database is disconnected', async () => {
      // Mock failed database query
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(data.status).toBe('unhealthy')
      expect(data.database).toBe('disconnected')
      expect(data.error).toBe('Database connection failed')
      expect(response.status).toBe(503)
    })

    it('should include timestamp in response', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }])

      const response = await GET()
      const data = await response.json()

      expect(data.timestamp).toBeDefined()
      expect(typeof data.timestamp).toBe('string')
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date')
    })

    it('should include uptime when healthy', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }])

      const response = await GET()
      const data = await response.json()

      expect(data.uptime).toBeDefined()
      expect(typeof data.uptime).toBe('number')
      expect(data.uptime).toBeGreaterThanOrEqual(0)
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { ApiError, successResponse, errorResponse } from '@/lib/api-response'
import { NextResponse } from 'next/server'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({
      data,
      status: options?.status || 200,
    })),
  },
}))

describe('api-response.ts - API Response Utilities', () => {
  describe('ApiError', () => {
    it('should create ApiError with default status code 500', () => {
      const error = new ApiError('Test error')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('ApiError')
    })

    it('should create ApiError with custom status code', () => {
      const error = new ApiError('Not found', 404)

      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
    })

    it('should create ApiError with details', () => {
      const details = { field: 'email', reason: 'invalid format' }
      const error = new ApiError('Validation failed', 400, details)

      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual(details)
    })
  })

  describe('successResponse', () => {
    it('should create success response with default status 200', () => {
      const data = { message: 'Success' }
      successResponse(data)

      expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 200 })
    })

    it('should create success response with custom status', () => {
      const data = { id: 123 }
      successResponse(data, 201)

      expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 201 })
    })

    it('should handle empty data', () => {
      successResponse({})

      expect(NextResponse.json).toHaveBeenCalledWith({}, { status: 200 })
    })

    it('should handle array data', () => {
      const data = [1, 2, 3]
      successResponse(data)

      expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 200 })
    })
  })

  describe('errorResponse', () => {
    it('should handle ApiError', () => {
      const error = new ApiError('Custom error', 400, { field: 'email' })
      errorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Custom error',
          details: { field: 'email' },
        },
        { status: 400 }
      )
    })

    it('should handle ZodError', () => {
      const zodError = {
        name: 'ZodError',
        errors: [{ path: ['email'], message: 'Invalid email' }],
      }
      errorResponse(zodError)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Validacija neuspešna',
          details: zodError.errors,
        },
        { status: 400 }
      )
    })

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong')
      errorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Interna greška servera' },
        { status: 500 }
      )
    })

    it('should handle unknown errors', () => {
      const error = { unknown: 'error' }
      errorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Interna greška servera' },
        { status: 500 }
      )
    })

    it('should handle string errors', () => {
      const error = 'String error message'
      errorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Interna greška servera' },
        { status: 500 }
      )
    })
  })
})

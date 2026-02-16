// src/middleware.ts

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from '@prisma/client'
import { addCORSHeaders, createCORSPreflightResponse } from './lib/cors'
import { addSecurityHeaders } from './lib/security-headers'
import { createAPILimiter, createGuestLimiter, getClientIP } from './lib/rate-limit'

const apiLimiter = createAPILimiter()
const guestLimiter = createGuestLimiter()

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const origin = req.headers.get('origin')

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return createCORSPreflightResponse(origin)
    }

    // Rate limiting za API endpoint-e
    if (path.startsWith('/api/')) {
      const clientIP = getClientIP(req.headers)
      const limiter = token ? apiLimiter : guestLimiter
      const result = limiter.check(clientIP, path)

      if (!result.allowed) {
        const response = NextResponse.json(
          { error: result.message || 'Rate limit exceeded' },
          { status: 429 }
        )
        response.headers.set('X-RateLimit-Limit', String(token ? 100 : 10))
        response.headers.set('X-RateLimit-Remaining', String(result.remaining))
        response.headers.set('X-RateLimit-Reset', String(result.resetTime))
        return addSecurityHeaders(addCORSHeaders(response, origin))
      }
    }

    // Role-based access control
    if (path.startsWith('/admin')) {
      if (token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    if (path.startsWith('/moderator')) {
      if (token?.role !== UserRole.MODERATOR && token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Email verification check
    if (path.startsWith('/chat') || path.startsWith('/dashboard')) {
      if (!token?.verified) {
        return NextResponse.redirect(new URL('/verify-email-required', req.url))
      }
    }

    // Create response
    const response = NextResponse.next()

    // Add security headers
    addSecurityHeaders(response)
    addCORSHeaders(response, origin)

    return response
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/moderator/:path*',
    '/admin/:path*',
    '/api/chat/:path*',
    '/api/moderator/:path*',
    '/api/admin/:path*',
  ],
}
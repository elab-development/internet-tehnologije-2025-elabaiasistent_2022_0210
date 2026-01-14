// src/middleware.ts

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Proveri role-based access
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

    // Proveri verifikaciju
    if (path.startsWith('/chat') || path.startsWith('/dashboard')) {
      if (!token?.verified) {
        return NextResponse.redirect(new URL('/verify-email-required', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Mora biti ulogovan
    },
  }
)

// Definiši koje rute su zaštićene
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
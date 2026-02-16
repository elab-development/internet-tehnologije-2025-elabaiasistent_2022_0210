// src/middleware.ts

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // 🔍 DEBUG LOGOVI
    console.log('🟨 [MIDDLEWARE] ===== REQUEST =====')
    console.log('🟨 [MIDDLEWARE] Path:', path)
    console.log('🟨 [MIDDLEWARE] Method:', req.method)
    console.log('🟨 [MIDDLEWARE] Token exists:', !!token)
    console.log('🟨 [MIDDLEWARE] Token role:', token?.role)
    console.log('🟨 [MIDDLEWARE] Token verified:', token?.verified)

    // Proveri role-based access
    if (path.startsWith('/admin')) {
      console.log('🟨 [MIDDLEWARE] Admin route check...')
      if (token?.role !== UserRole.ADMIN) {
        console.log('🔴 [MIDDLEWARE] Unauthorized - redirecting')
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    if (path.startsWith('/moderator')) {
      console.log('🟨 [MIDDLEWARE] Moderator route check...')
      if (token?.role !== UserRole.MODERATOR && token?.role !== UserRole.ADMIN) {
        console.log('🔴 [MIDDLEWARE] Unauthorized - redirecting')
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
      console.log('🟨 [MIDDLEWARE] ✅ Moderator access granted')
    }

    // Proveri verifikaciju
    if (path.startsWith('/chat') || path.startsWith('/dashboard')) {
      console.log('🟨 [MIDDLEWARE] Verification check...')
      if (!token?.verified) {
        console.log('🔴 [MIDDLEWARE] Not verified - redirecting')
        return NextResponse.redirect(new URL('/verify-email-required', req.url))
      }
    }

    console.log('🟨 [MIDDLEWARE] ✅ Passing through to route handler')
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('🟨 [MIDDLEWARE] authorized callback - token exists:', !!token)
        return !!token
      },
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
// src/app/api/auth/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    // ✅ Koristi APP_URL iz env
    const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    console.log('🔵 [VERIFY] Token:', token)
    console.log('🔵 [VERIFY] APP_URL:', APP_URL)

    if (!token) {
      console.log('🔵 [VERIFY] Missing token, redirecting...')
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="0; url=${APP_URL}/login?error=missing_token">
          </head>
          <body><p>Redirecting...</p></body>
        </html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        tokenExpiresAt: { gte: new Date() },
      },
    })

    if (!user) {
      console.log('🔵 [VERIFY] Invalid token, redirecting...')
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="0; url=${APP_URL}/login?error=invalid_token">
          </head>
          <body><p>Invalid token. Redirecting...</p></body>
        </html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        status: 'ACTIVE',
        verificationToken: null,
        tokenExpiresAt: null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        resourceType: 'User',
        entityId: user.id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    console.log('✅ Email verified for user:', user.email)
    console.log('🔵 [VERIFY] Redirecting to:', `${APP_URL}/login?verified=true`)

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0; url=${APP_URL}/login?verified=true">
          <title>Verification Successful</title>
        </head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f3f4f6;">
          <div style="text-align: center;">
            <h1 style="color: #10b981; font-size: 48px; margin: 0;">✅</h1>
            <h2 style="color: #111827; margin: 16px 0;">Email verifikovan!</h2>
            <p style="color: #6b7280;">Redirectujemo vas na login stranicu...</p>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('❌ Verification error:', error)
    const APP_URL = process.env.APP_URL || 'http://localhost:3000'
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0; url=${APP_URL}/login?error=verification_failed">
        </head>
        <body><p>Error. Redirecting...</p></body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }
}
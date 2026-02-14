// src/app/api/auth/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔹 KLJUČNO: Spreči statički rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', req.url))
    }

    // Pronađi korisnika sa tokenom
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        tokenExpiresAt: {
          gte: new Date(), // Token nije istekao
        },
      },
    })

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url))
    }

    // Verifikuj korisnika
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        status: 'ACTIVE',
        verificationToken: null,
        tokenExpiresAt: null,
      },
    })

    // Audit log
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

    // Redirect na login sa success porukom
    return NextResponse.redirect(new URL('/login?verified=true', req.url))
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(new URL('/login?error=verification_failed', req.url))
  }
}
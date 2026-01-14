// src/app/api/auth/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token je obavezan' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Nevažeći ili istekli token' },
        { status: 400 }
      )
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

    return NextResponse.json({
      message: 'Email uspešno verifikovan! Možete se prijaviti.',
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Greška pri verifikaciji' },
      { status: 500 }
    )
  }
}
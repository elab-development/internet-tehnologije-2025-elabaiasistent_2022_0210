// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import { sendVerificationEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validacija input-a
    const validatedData = registerSchema.parse(body)

    // Proveri da li korisnik već postoji
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Korisnik sa ovom email adresom već postoji' },
        { status: 400 }
      )
    }

    // Hash lozinke
    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    // Generiši verification token
    const verificationToken = randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    // Kreiraj korisnika
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        role: 'USER',
        verified: false,
        status: 'PENDING_VERIFICATION',
        verificationToken,
        tokenExpiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        verified: true,
        status: true,
        createdAt: true,
      },
    })

    // Pošalji verifikacioni email
    const emailResult = await sendVerificationEmail(user.email, verificationToken)

    if (!emailResult.success) {
      console.error('⚠ Failed to send verification email:', emailResult.error)
      
      // Ne blokiraj registraciju ako email ne uspe
      // Korisnik može kasnije zatražiti novi verifikacioni email
      return NextResponse.json(
        {
          message: 'Registracija uspešna, ali email nije poslat. Kontaktirajte podršku.',
          user,
          emailError: emailResult.error,
        },
        { status: 201 }
      )
    }

    console.log('✅ User registered and verification email sent:', user.email)

    // Kreiraj audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        entityId: user.id,
        details: {
          email: user.email,
          role: user.role,
          emailSent: true,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    return NextResponse.json(
      {
        message: 'Registracija uspešna! Proverite email za verifikaciju.',
        user,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)

    // Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validacija neuspešna', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Greška pri registraciji. Pokušajte ponovo.' },
      { status: 500 }
    )
  }
}
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
    console.log('🟦 [REGISTER] POST /api/auth/register called')
    
    const body = await req.json()
    console.log('🟦 [REGISTER] Body received:', { email: body.email })

    // Validacija input-a
    const validatedData = registerSchema.parse(body)
    console.log('🟦 [REGISTER] Validation passed')

    // Proveri da li korisnik već postoji
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      console.log('🟦 [REGISTER] User already exists:', validatedData.email)
      return NextResponse.json(
        { error: 'Korisnik sa ovom email adresom već postoji' },
        { status: 400 }
      )
    }

    // Hash lozinke
    const passwordHash = await bcrypt.hash(validatedData.password, 10)
    console.log('🟦 [REGISTER] Password hashed')

    // Generiši verification token
    const verificationToken = randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    console.log('🟦 [REGISTER] Verification token generated:', verificationToken.substring(0, 10) + '...')

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
    console.log('🟦 [REGISTER] User created in database:', user.id)

    // 🔵 KLJUČNI DEO - Pošalji verifikacioni email
    console.log('🟦 [REGISTER] Attempting to send verification email...')
    console.log('🟦 [REGISTER] Environment check:', {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing',
      EMAIL_FROM: process.env.EMAIL_FROM || 'Not set',
      EMAIL_TO_OVERRIDE: process.env.EMAIL_TO_OVERRIDE || 'Not set',
      APP_URL: process.env.APP_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV,
    })
    
    const emailResult = await sendVerificationEmail(user.email, verificationToken)
    console.log('🟦 [REGISTER] Email result:', emailResult)

    if (!emailResult.success) {
      console.error('⚠ [REGISTER] Failed to send verification email:', emailResult.error)
      
      // Ne blokiraj registraciju ako email ne uspe
      return NextResponse.json(
        {
          message: 'Registracija uspešna, ali email nije poslat. Kontaktirajte podršku.',
          user,
          emailError: emailResult.error,
        },
        { status: 201 }
      )
    }

    console.log('✅ [REGISTER] User registered and verification email sent:', user.email)

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
    console.error('❌ [REGISTER] Fatal error:', error)

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
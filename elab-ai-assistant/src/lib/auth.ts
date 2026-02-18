// src/lib/auth.ts

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { createLoginLimiter } from './rate-limit'

const loginLimiter = createLoginLimiter()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'student@fon.bg.ac.rs' },
        password: { label: 'Lozinka', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email i lozinka su obavezni')
        }

        // Rate limiting (brute force protection)
        const clientIP = req?.headers?.['x-forwarded-for'] || 'unknown'
        const rateLimitResult = loginLimiter.check(clientIP as string, 'login')

        if (!rateLimitResult.allowed) {
          throw new Error(rateLimitResult.message || 'Previše pokušaja prijavljivanja')
        }

        // Validacija FON email domena
        const fonEmailRegex = /@([a-z0-9-]+\.)*fon\.bg\.ac\.rs$/i
        if (!fonEmailRegex.test(credentials.email)) {
          throw new Error('Morate koristiti FON email adresu (@fon.bg.ac.rs)')
        }

        // Pronađi korisnika
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('Neispravni kredencijali')
        }

        // Proveri status naloga
        if (user.status === 'BLOCKED') {
          throw new Error('Vaš nalog je blokiran. Kontaktirajte administratora.')
        }

        // Proveri lozinku
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Neispravni kredencijali')
        }

        // Uspešan login - resetuj rate limit
        loginLimiter.reset(clientIP as string, 'login')

        // Ažuriraj lastLogin
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.verified,
          status: user.status,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.verified = user.verified
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.verified = token.verified as boolean
        session.user.status = token.status as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dana
  },
  secret: process.env.NEXTAUTH_SECRET,
}
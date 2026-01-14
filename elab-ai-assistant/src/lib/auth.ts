// src/lib/auth.ts

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'student@fon.bg.ac.rs' },
        password: { label: 'Lozinka', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email i lozinka su obavezni')
        }

        // Validacija FON email domena (FZ-1)
        if (!credentials.email.endsWith('@fon.bg.ac.rs')) {
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

        // Ažuriraj lastLogin
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        // Vrati korisnika (bez passwordHash)
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
      // Dodaj custom polja u JWT token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.verified = user.verified
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      // Dodaj custom polja u session
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
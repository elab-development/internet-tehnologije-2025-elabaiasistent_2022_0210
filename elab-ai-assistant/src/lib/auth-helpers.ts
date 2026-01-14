// src/lib/auth-helpers.ts

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'

/**
 * Dobavi trenutnu sesiju na serveru
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

/**
 * Proveri da li je korisnik autentifikovan
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Proveri da li korisnik ima određenu ulogu
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }
  
  return user
}

/**
 * Proveri da li je korisnik Admin
 */
export async function requireAdmin() {
  return requireRole([UserRole.ADMIN])
}

/**
 * Proveri da li je korisnik Moderator ili Admin
 */
export async function requireModerator() {
  return requireRole([UserRole.MODERATOR, UserRole.ADMIN])
}
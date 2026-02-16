// src/lib/auth-helpers.ts

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'

/**
 * Dobavi trenutnu sesiju na serveru
 */
export async function getCurrentUser() {
  console.log('🟪 [AUTH-HELPERS] getCurrentUser called')
  const session = await getServerSession(authOptions)
  console.log('🟪 [AUTH-HELPERS] Session:', session ? 'exists' : 'null')
  console.log('🟪 [AUTH-HELPERS] User:', session?.user ? JSON.stringify(session.user) : 'null')
  return session?.user
}

/**
 * Proveri da li je korisnik autentifikovan
 */
export async function requireAuth() {
  console.log('🟪 [AUTH-HELPERS] requireAuth called')
  const user = await getCurrentUser()
  if (!user) {
    console.error('🔴 [AUTH-HELPERS] No user found - throwing Unauthorized')
    throw new Error('Unauthorized')
  }
  console.log('🟪 [AUTH-HELPERS] ✅ User authenticated:', user.email)
  return user
}

/**
 * Proveri da li korisnik ima određenu ulogu
 */
export async function requireRole(allowedRoles: UserRole[]) {
  console.log('🟪 [AUTH-HELPERS] requireRole called with:', allowedRoles)
  const user = await requireAuth()
  
  console.log('🟪 [AUTH-HELPERS] User role:', user.role)
  if (!allowedRoles.includes(user.role)) {
    console.error('🔴 [AUTH-HELPERS] Insufficient permissions - User has:', user.role, 'Needs:', allowedRoles)
    throw new Error('Forbidden: Insufficient permissions')
  }
  
  console.log('🟪 [AUTH-HELPERS] ✅ Role check passed')
  return user
}

/**
 * Proveri da li je korisnik Admin
 */
export async function requireAdmin() {
  console.log('🟪 [AUTH-HELPERS] requireAdmin called')
  return requireRole([UserRole.ADMIN])
}

/**
 * Proveri da li je korisnik Moderator ili Admin
 */
export async function requireModerator() {
  console.log('🟪 [AUTH-HELPERS] requireModerator called')
  return requireRole([UserRole.MODERATOR, UserRole.ADMIN])
}
// src/hooks/useAuth.ts

'use client'

import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isAdmin: session?.user?.role === UserRole.ADMIN,
    isModerator: 
      session?.user?.role === UserRole.MODERATOR || 
      session?.user?.role === UserRole.ADMIN,
    isUser: session?.user?.role === UserRole.USER,
  }
}
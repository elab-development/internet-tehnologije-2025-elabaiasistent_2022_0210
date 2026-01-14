// src/types/next-auth.d.ts

import { UserRole } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    role: UserRole
    verified: boolean
    status: string
  }

  interface Session {
    user: {
      id: string
      email: string
      role: UserRole
      verified: boolean
      status: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    verified: boolean
    status: string
  }
}
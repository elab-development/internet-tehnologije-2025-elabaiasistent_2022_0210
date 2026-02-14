// src/app/api/admin/users/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { errorResponse, successResponse } from '@/lib/api-response'

// 🔹 KLJUČNO: Spreči statički rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/users
 * Vraća sve korisnike
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = req.nextUrl
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(status && { status: status as any }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        verified: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            conversations: true,
            ratings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ users })
  } catch (error) {
    return errorResponse(error)
  }
}
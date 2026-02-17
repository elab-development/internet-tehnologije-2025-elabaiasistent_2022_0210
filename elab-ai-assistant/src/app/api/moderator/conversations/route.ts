// src/app/api/moderator/conversations/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { errorResponse, successResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/moderator/conversations
 * Vraća sve konverzacije svih korisnika
 */
export async function GET(req: NextRequest) {
  try {
    await requireModerator()

    const conversations = await prisma.conversation.findMany({
      where: {
        isArchived: false,
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            ratings: {
              select: {
                rating: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            flags: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100, // Limit za performanse
    })

    return successResponse({ conversations })
  } catch (error) {
    return errorResponse(error)
  }
}
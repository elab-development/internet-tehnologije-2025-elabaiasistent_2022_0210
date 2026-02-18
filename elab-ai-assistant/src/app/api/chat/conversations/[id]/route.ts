// src/app/api/chat/conversations/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/chat/conversations/:id
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            ratings: {
              where: { userId: user.id },
              select: {
                rating: true,
                feedbackText: true,
              },
            },
          },
        },
      },
    }) as any

    if (!conversation) {
      throw new ApiError('Konverzacija nije pronađena', 404)
    }

    // Proveri da li korisnik ima pristup
    if (conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj konverzaciji', 403)
    }

    return successResponse({ conversation })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/chat/conversations/:id
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    })

    if (!conversation) {
      throw new ApiError('Konverzacija nije pronađena', 404)
    }

    if (conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj konverzaciji', 403)
    }

    // Arhiviraj umesto brisanja
    await prisma.conversation.update({
      where: { id },
      data: { isArchived: true },
    })

    return successResponse({ message: 'Konverzacija arhivirana' })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PATCH /api/chat/conversations/:id
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    })

    if (!conversation) {
      throw new ApiError('Konverzacija nije pronađena', 404)
    }

    if (conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj konverzaciji', 403)
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { title: body.title },
    })

    return successResponse({ conversation: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
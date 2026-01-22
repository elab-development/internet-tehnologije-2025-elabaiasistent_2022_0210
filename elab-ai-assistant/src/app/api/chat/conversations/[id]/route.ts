// src/app/api/chat/conversations/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * GET /api/chat/conversations/:id
 * Vraća jednu konverzaciju sa svim porukama
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
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
    })

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
 * Briše konverzaciju (ili je arhivira)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    })

    if (!conversation) {
      throw new ApiError('Konverzacija nije pronađena', 404)
    }

    if (conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj konverzaciji', 403)
    }

    // Arhiviraj umesto brisanja
    await prisma.conversation.update({
      where: { id: params.id },
      data: { isArchived: true },
    })

    return successResponse({ message: 'Konverzacija arhivirana' })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PATCH /api/chat/conversations/:id
 * Ažurira naslov konverzacije
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await req.json()

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    })

    if (!conversation) {
      throw new ApiError('Konverzacija nije pronađena', 404)
    }

    if (conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj konverzaciji', 403)
    }

    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: { title: body.title },
    })

    return successResponse({ conversation: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
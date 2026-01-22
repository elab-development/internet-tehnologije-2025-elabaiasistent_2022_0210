// src/app/api/chat/ratings/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { rateMessageSchema } from '@/lib/validations/chat'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * POST /api/chat/ratings
 * Ocenjuje AI odgovor
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const validatedData = rateMessageSchema.parse(body)

    // Proveri da li poruka postoji
    const message = await prisma.message.findUnique({
      where: { id: validatedData.messageId },
      include: { conversation: true },
    })

    if (!message) {
      throw new ApiError('Poruka nije pronađena', 404)
    }

    // Proveri da li korisnik ima pristup
    if (message.conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj poruci', 403)
    }

    // Proveri da li je već ocenio
    const existingRating = await prisma.rating.findUnique({
      where: {
        messageId_userId: {
          messageId: validatedData.messageId,
          userId: user.id,
        },
      },
    })

    if (existingRating) {
      // Ažuriraj postojeću ocenu
      const updated = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          rating: validatedData.rating,
          feedbackText: validatedData.feedbackText,
        },
      })

      return successResponse({ rating: updated })
    }

    // Kreiraj novu ocenu
    const rating = await prisma.rating.create({
      data: {
        messageId: validatedData.messageId,
        userId: user.id,
        rating: validatedData.rating,
        feedbackText: validatedData.feedbackText,
      },
    })

    return successResponse({ rating }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
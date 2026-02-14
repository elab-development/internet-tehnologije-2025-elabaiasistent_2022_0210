// src/app/api/moderator/faq/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { createFAQSchema } from '@/lib/validations/moderator'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/moderator/faq/:id
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireModerator()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    const faq = await prisma.fAQEntry.findUnique({
      where: { id },
      include: {
        creator: {
          select: { email: true },
        },
        updater: {
          select: { email: true },
        },
      },
    })

    if (!faq) {
      throw new ApiError('FAQ nije pronađen', 404)
    }

    return successResponse({ faq })
  } catch (error) {
    console.error('GET /api/moderator/faq/[id] error:', error)
    return errorResponse(error)
  }
}

/**
 * PATCH /api/moderator/faq/:id
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireModerator()
    const body = await req.json()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    console.log(`Updating FAQ ${id} with data:`, body)

    const validatedData = createFAQSchema.parse(body)

    const existingFAQ = await prisma.fAQEntry.findUnique({
      where: { id },
    })

    if (!existingFAQ) {
      throw new ApiError('FAQ nije pronađen', 404)
    }

    const updatedFAQ = await prisma.fAQEntry.update({
      where: { id },
      data: {
        question: validatedData.question,
        answer: validatedData.answer,
        category: validatedData.category,
        updatedBy: user.id,
      },
      include: {
        creator: {
          select: { email: true },
        },
        updater: {
          select: { email: true },
        },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FAQ_UPDATED',
        resourceType: 'FAQEntry',
        entityId: id,
        details: {
          oldQuestion: existingFAQ.question,
          newQuestion: validatedData.question,
        },
      },
    })

    return successResponse({ faq: updatedFAQ })
  } catch (error) {
    console.error('PATCH /api/moderator/faq/[id] error:', error)
    return errorResponse(error)
  }
}

/**
 * DELETE /api/moderator/faq/:id
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireModerator()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    console.log(`Deleting FAQ ${id}`)

    const existingFAQ = await prisma.fAQEntry.findUnique({
      where: { id },
    })

    if (!existingFAQ) {
      throw new ApiError('FAQ nije pronađen', 404)
    }

    await prisma.fAQEntry.delete({
      where: { id },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FAQ_DELETED',
        resourceType: 'FAQEntry',
        entityId: id,
        details: {
          question: existingFAQ.question,
        },
      },
    })

    return successResponse({ message: 'FAQ uspešno obrisan' })
  } catch (error) {
    console.error('DELETE /api/moderator/faq/[id] error:', error)
    return errorResponse(error)
  }
}
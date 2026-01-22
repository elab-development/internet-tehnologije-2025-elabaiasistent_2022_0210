// src/app/api/moderator/faq/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { createFAQSchema } from '@/lib/validations/moderator'
import { errorResponse, successResponse } from '@/lib/api-response'

/**
 * GET /api/moderator/faq
 * Vraća sve FAQ unose
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get('category')

    const faqs = await prisma.fAQEntry.findMany({
      where: category ? { category } : undefined,
      include: {
        creator: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ faqs })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/moderator/faq
 * Kreira novi FAQ unos
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireModerator()
    const body = await req.json()
    
    const validatedData = createFAQSchema.parse(body)

    const faq = await prisma.fAQEntry.create({
      data: {
        ...validatedData,
        createdBy: user.id,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FAQ_CREATED',
        resourceType: 'FAQEntry',
        entityId: faq.id,
      },
    })

    return successResponse({ faq }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
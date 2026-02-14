// src/app/api/moderator/flags/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { createFlagSchema } from '@/lib/validations/moderator'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/moderator/flags
 * Vraća sve flag-ove
 */
export async function GET(req: NextRequest) {
  try {
    await requireModerator()

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const flags = await prisma.flag.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
      },
      include: {
        flaggedByUser: {
          select: { email: true, role: true },
        },
        message: {
          select: { content: true, createdAt: true },
        },
        conversation: {
          select: { title: true },
        },
        resolvedByUser: {
          select: { email: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return successResponse({ flags })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/moderator/flags
 * Kreira novi flag
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireModerator()
    const body = await req.json()
    
    const validatedData = createFlagSchema.parse(body)

    if (!validatedData.messageId && !validatedData.conversationId) {
      throw new ApiError('Morate navesti messageId ili conversationId', 400)
    }

    const flag = await prisma.flag.create({
      data: {
        ...validatedData,
        flaggedBy: user.id,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FLAG_CREATED',
        resourceType: 'Flag',
        entityId: flag.id,
        details: { flagType: validatedData.flagType },
      },
    })

    return successResponse({ flag }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
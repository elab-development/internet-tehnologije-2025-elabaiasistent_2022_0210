// src/app/api/moderator/flags/[id]/resolve/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { resolveFlagSchema } from '@/lib/validations/moderator'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * PATCH /api/moderator/flags/:id/resolve
 * Rešava flag
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireModerator()
    const body = await req.json()
    
    const validatedData = resolveFlagSchema.parse(body)

    const flag = await prisma.flag.findUnique({
      where: { id: params.id },
    })

    if (!flag) {
      throw new ApiError('Flag nije pronađen', 404)
    }

    const updated = await prisma.flag.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        resolvedBy: user.id,
        resolvedAt: new Date(),
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FLAG_RESOLVED',
        resourceType: 'Flag',
        entityId: updated.id,
        details: { status: validatedData.status },
      },
    })

    return successResponse({ flag: updated })
  } catch (error) {
    return errorResponse(error)
  }
}
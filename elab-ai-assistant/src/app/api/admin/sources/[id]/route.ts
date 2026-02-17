// src/app/api/admin/sources/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * DELETE /api/admin/sources/:id
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const params = await context.params
    const { id } = params

    const source = await prisma.source.findUnique({
      where: { id },
    })

    if (!source) {
      throw new ApiError('Izvor nije pronađen', 404)
    }

    // Obriši izvor (CASCADE će obrisati i crawl job-ove)
    await prisma.source.delete({
      where: { id },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'SOURCE_DELETED',
        resourceType: 'Source',
        entityId: id,
        details: { url: source.url },
      },
    })

    return successResponse({ message: 'Izvor uspešno obrisan' })
  } catch (error) {
    return errorResponse(error)
  }
}
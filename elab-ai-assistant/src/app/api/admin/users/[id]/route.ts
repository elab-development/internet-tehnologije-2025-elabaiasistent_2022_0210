// src/app/api/admin/users/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { updateUserRoleSchema, blockUserSchema } from '@/lib/validations/admin'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * PATCH /api/admin/users/:id
 * Ažurira korisnika (role ili status)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      throw new ApiError('Korisnik nije pronađen', 404)
    }

    // Ne dozvoli adminu da menja samog sebe
    if (user.id === admin.id) {
      throw new ApiError('Ne možete menjati sopstveni nalog', 400)
    }

    let updated
    let action = ''

    // Update role
    if (body.role) {
      const validatedData = updateUserRoleSchema.parse(body)
      updated = await prisma.user.update({
        where: { id: params.id },
        data: { role: validatedData.role },
      })
      action = 'USER_ROLE_CHANGED'
    }
    // Update status (block/unblock)
    else if (body.status) {
      const validatedData = blockUserSchema.parse(body)
      updated = await prisma.user.update({
        where: { id: params.id },
        data: { status: validatedData.status },
      })
      action = validatedData.status === 'BLOCKED' ? 'USER_BLOCKED' : 'USER_UNBLOCKED'
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action,
        resourceType: 'User',
        entityId: params.id,
        details: body,
      },
    })

    return successResponse({ user: updated })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/admin/users/:id
 * Briše korisnika
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      throw new ApiError('Korisnik nije pronađen', 404)
    }

    if (user.id === admin.id) {
      throw new ApiError('Ne možete obrisati sopstveni nalog', 400)
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'USER_DELETED',
        resourceType: 'User',
        entityId: params.id,
        details: { email: user.email },
      },
    })

    return successResponse({ message: 'Korisnik obrisan' })
  } catch (error) {
    return errorResponse(error)
  }
}
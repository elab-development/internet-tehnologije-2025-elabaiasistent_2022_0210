// src/app/api/admin/users/[id]/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { updateUserRoleSchema, blockUserSchema } from '@/lib/validations/admin'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * GET /api/admin/users/:id
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        verified: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            conversations: true,
            ratings: true,
          },
        },
      },
    })

    if (!user) {
      throw new ApiError('Korisnik nije pronađen', 404)
    }

    return successResponse({ user })
  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error)
    return errorResponse(error)
  }
}

/**
 * PATCH /api/admin/users/:id
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    console.log(`PATCH /api/admin/users/${id}`)
    console.log('Request body:', body)
    console.log('Admin user:', admin.id)

    const user = await prisma.user.findUnique({
      where: { id },
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
    let details: any = {}

    // Update role
    if (body.role !== undefined) {
      console.log('Changing role to:', body.role)
      
      const validatedData = updateUserRoleSchema.parse({ role: body.role })
      
      updated = await prisma.user.update({
        where: { id },
        data: { role: validatedData.role },
        select: {
          id: true,
          email: true,
          role: true,
          verified: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              conversations: true,
              ratings: true,
            },
          },
        },
      })
      
      action = 'USER_ROLE_CHANGED'
      details = {
        oldRole: user.role,
        newRole: validatedData.role,
      }
    }
    // Update status (block/unblock)
    else if (body.status !== undefined) {
      console.log('Changing status to:', body.status)
      
      const validatedData = blockUserSchema.parse({ 
        status: body.status,
        reason: body.reason 
      })
      
      updated = await prisma.user.update({
        where: { id },
        data: { status: validatedData.status },
        select: {
          id: true,
          email: true,
          role: true,
          verified: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              conversations: true,
              ratings: true,
            },
          },
        },
      })
      
      action = validatedData.status === 'BLOCKED' ? 'USER_BLOCKED' : 'USER_UNBLOCKED'
      details = {
        oldStatus: user.status,
        newStatus: validatedData.status,
        reason: validatedData.reason,
      }
    } else {
      throw new ApiError('Morate navesti role ili status', 400)
    }

    console.log('User updated successfully:', updated.id)

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action,
        resourceType: 'User',
        entityId: id,
        details,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    return successResponse({ user: updated })
  } catch (error) {
    console.error('PATCH /api/admin/users/[id] error:', error)
    return errorResponse(error)
  }
}

/**
 * DELETE /api/admin/users/:id
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    
    const params = await context.params // ← AWAIT params
    const { id } = params

    console.log(`DELETE /api/admin/users/${id}`)
    console.log('Admin user:', admin.id)

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new ApiError('Korisnik nije pronađen', 404)
    }

    if (user.id === admin.id) {
      throw new ApiError('Ne možete obrisati sopstveni nalog', 400)
    }

    console.log('Deleting user:', user.email)

    // Briši korisnika (Cascade će obrisati sve povezane zapise)
    await prisma.user.delete({
      where: { id },
    })

    console.log('User deleted successfully')

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'USER_DELETED',
        resourceType: 'User',
        entityId: id,
        details: { 
          email: user.email,
          role: user.role,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    return successResponse({ message: 'Korisnik uspešno obrisan' })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return errorResponse(error)
  }
}
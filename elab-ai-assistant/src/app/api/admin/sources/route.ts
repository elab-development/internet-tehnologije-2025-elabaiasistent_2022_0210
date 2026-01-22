// src/app/api/admin/sources/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { createSourceSchema } from '@/lib/validations/admin'
import { errorResponse, successResponse } from '@/lib/api-response'

/**
 * GET /api/admin/sources
 * Vraća sve izvore
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const sources = await prisma.source.findMany({
      include: {
        creator: {
          select: { email: true },
        },
        _count: {
          select: { crawlJobs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ sources })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/admin/sources
 * Dodaje novi izvor
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    
    const validatedData = createSourceSchema.parse(body)

    const source = await prisma.source.create({
      data: {
        ...validatedData,
        createdBy: admin.id,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'SOURCE_CREATED',
        resourceType: 'Source',
        entityId: source.id,
        details: { url: validatedData.url },
      },
    })

    return successResponse({ source }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
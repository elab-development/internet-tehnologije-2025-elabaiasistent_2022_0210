// src/app/api/moderator/tickets/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { createTicketSchema } from '@/lib/validations/moderator'
import { errorResponse, successResponse } from '@/lib/api-response'

/**
 * GET /api/moderator/tickets
 * Vraća sve tikete
 */
export async function GET(req: NextRequest) {
  try {
    await requireModerator()

    const tickets = await prisma.ticket.findMany({
      include: {
        creator: {
          select: { email: true, role: true },
        },
        assignee: {
          select: { email: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return successResponse({ tickets })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/moderator/tickets
 * Kreira novi tiket
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireModerator()
    const body = await req.json()
    
    const validatedData = createTicketSchema.parse(body)

    const ticket = await prisma.ticket.create({
      data: {
        ...validatedData,
        createdBy: user.id,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TICKET_CREATED',
        resourceType: 'Ticket',
        entityId: ticket.id,
        details: { ticketType: validatedData.ticketType },
      },
    })

    return successResponse({ ticket }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
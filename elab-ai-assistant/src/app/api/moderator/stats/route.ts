// src/app/api/moderator/stats/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { errorResponse, successResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/moderator/stats
 * Vraća statistiku za moderator dashboard
 */
export async function GET(req: NextRequest) {
  try {
    await requireModerator()

    // Paralelno fetch svih podataka za performanse
    const [
      pendingFlagsCount,
      openTicketsCount,
      totalFAQsCount,
      resolvedTodayCount,
      totalConversationsCount,
    ] = await Promise.all([
      // Pending Flags - flags sa statusom PENDING
      prisma.flag.count({
        where: { status: 'PENDING' },
      }),

      // Open Tickets - tickets sa statusom OPEN ili IN_PROGRESS
      prisma.ticket.count({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      }),

      // Total FAQs
      prisma.fAQEntry.count(),

      // Resolved Today - flags rešeni danas
      prisma.flag.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Početak današnjeg dana
          },
        },
      }),

      // Total Conversations (sve konverzacije koje nisu arhivirane)
      prisma.conversation.count({
        where: { isArchived: false },
      }),
    ])

    return successResponse({
      stats: {
        pendingFlags: pendingFlagsCount,
        openTickets: openTicketsCount,
        totalFAQs: totalFAQsCount,
        resolvedToday: resolvedTodayCount,
        totalConversations: totalConversationsCount,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

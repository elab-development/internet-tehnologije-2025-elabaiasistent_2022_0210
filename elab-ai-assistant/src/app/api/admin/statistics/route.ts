// src/app/api/admin/statistics/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { errorResponse, successResponse } from '@/lib/api-response'

// 🔹 KLJUČNO: Spreči statički rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/statistics
 * Vraća statistiku sistema
 */
export async function GET(req: NextRequest) {
  try {
    await requireModerator()

    // Paralelno izvršavanje upita
    const [
      totalUsers,
      totalConversations,
      totalMessages,
      totalRatings,
      positiveRatings,
      activeUsers,
      pendingFlags,
      openTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.rating.count(),
      prisma.rating.count({ where: { rating: 'POSITIVE' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.flag.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
    ])

    // Korisnici po ulogama
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    // Poruke po danima (poslednih 7 dana)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const messagesByDay = await prisma.message.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    })

    return successResponse({
      overview: {
        totalUsers,
        totalConversations,
        totalMessages,
        totalRatings,
        positiveRatings,
        negativeRatings: totalRatings - positiveRatings,
        satisfactionRate: totalRatings > 0 
          ? ((positiveRatings / totalRatings) * 100).toFixed(2) + '%'
          : '0%',
        activeUsers,
        pendingFlags,
        openTickets,
      },
      usersByRole: (usersByRole as any[]).map(item => ({
        role: item.role,
        count: item._count,
      })),
      messagesByDay: (messagesByDay as any[]).map(item => ({
        date: item.createdAt,
        count: item._count,
      })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
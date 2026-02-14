// src/app/api/chat/conversations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { createConversationSchema } from '@/lib/validations/chat'
import { errorResponse, successResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/chat/conversations
 * Vraća sve konverzacije trenutnog korisnika
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            role: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return successResponse({
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv._count.messages,
        lastMessage: conv.messages[0] || null,
      })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/chat/conversations
 * Kreira novu konverzaciju
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const validatedData = createConversationSchema.parse(body)

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: validatedData.title || 'Nova konverzacija',
      },
    })

    return successResponse({ conversation }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
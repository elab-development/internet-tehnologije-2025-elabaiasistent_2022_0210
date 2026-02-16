// src/app/api/moderator/flags/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireModerator } from '@/lib/auth-helpers'
import { createFlagSchema } from '@/lib/validations/moderator'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'
import { z } from 'zod'

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
  console.log('🟩 [BACKEND] POST /api/moderator/flags pozvana!')
  
  try {
    console.log('🟩 [BACKEND] Step 1: Checking moderator...')
    const user = await requireModerator()
    console.log('🟩 [BACKEND] Step 1: User authenticated:', user.email, user.role)
    
    console.log('🟩 [BACKEND] Step 2: Parsing body...')
    const body = await req.json()
    console.log('🟩 [BACKEND] Step 2: Body primljen:', JSON.stringify(body, null, 2))
    console.log('🟩 [BACKEND] Step 2: Body types:', {
      conversationId: typeof body.conversationId,
      messageId: typeof body.messageId,
      flagType: typeof body.flagType,
      description: typeof body.description,
      priority: typeof body.priority,
    })
    
    console.log('🟩 [BACKEND] Step 3: Validating with Zod...')
    let validatedData
    try {
      validatedData = createFlagSchema.parse(body)
      console.log('🟩 [BACKEND] Step 3: ✅ Validation SUCCESS!')
      console.log('🟩 [BACKEND] Step 3: Validated data:', JSON.stringify(validatedData, null, 2))
    } catch (validationError) {
      console.error('🔴 [BACKEND] Step 3: ❌ Validation FAILED!')
      
      if (validationError instanceof z.ZodError) {
        console.error('🔴 [BACKEND] Zod errors:', JSON.stringify(validationError.errors, null, 2))
        
        return new Response(
          JSON.stringify({
            error: 'Validacija neuspešna',
            details: validationError.errors.map(e => ({
              field: e.path.join('.') || 'root',
              message: e.message,
              code: e.code,
              received: (e as any).received,
            }))
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      throw validationError
    }

    console.log('🟩 [BACKEND] Step 4: Checking messageId/conversationId...')
    if (!validatedData.messageId && !validatedData.conversationId) {
      console.error('🔴 [BACKEND] Step 4: ❌ Ni messageId ni conversationId nisu prosleđeni!')
      throw new ApiError('Morate navesti messageId ili conversationId', 400)
    }
    console.log('🟩 [BACKEND] Step 4: ✅ At least one ID present')

    console.log('🟩 [BACKEND] Step 5: Creating flag in database...')
    const flag = await prisma.flag.create({
      data: {
        ...validatedData,
        flaggedBy: user.id,
      },
    })
    console.log('🟩 [BACKEND] Step 5: ✅ Flag created with ID:', flag.id)

    console.log('🟩 [BACKEND] Step 6: Creating audit log...')
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FLAG_CREATED',
        resourceType: 'Flag',
        entityId: flag.id,
        details: { flagType: validatedData.flagType },
      },
    })
    console.log('🟩 [BACKEND] Step 6: ✅ Audit log created')

    console.log('🟩 [BACKEND] ✅ SUCCESS - Returning response')
    return successResponse({ flag }, 201)
  } catch (error) {
    console.error('🔴 [BACKEND] ❌ FATAL ERROR:', error)
    return errorResponse(error)
  }
}
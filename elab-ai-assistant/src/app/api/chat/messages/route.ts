// src/app/api/chat/messages/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { sendMessageSchema } from '@/lib/validations/chat'
import { getVectorDB } from '@/lib/vector-db'
import { getOllamaClient } from '@/lib/ollama'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * POST /api/chat/messages
 * Šalje poruku i generiše AI odgovor koristeći RAG
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const validatedData = sendMessageSchema.parse(body)

    // Proveri da li konverzacija pripada korisniku
    const conversation = await prisma.conversation.findUnique({
      where: { id: validatedData.conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Poslednje 10 poruka za kontekst
        },
      },
    })

    if (!conversation) {
      throw new ApiError('Konverzacija nije pronađena', 404)
    }

    if (conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj konverzaciji', 403)
    }

    const startTime = Date.now()

    // 1. Kreiraj korisničku poruku
    const userMessage = await prisma.message.create({
      data: {
        conversationId: validatedData.conversationId,
        role: 'USER',
        content: validatedData.content,
      },
    })

    console.log('💬 User message:', validatedData.content)

    // 2. Pretraži vektorsku bazu za relevantne kontekste
    const vectorDB = await getVectorDB()
    const searchResults = await vectorDB.search(validatedData.content, {
      limit: 5,
      minRelevance: 0.3,
    })

    console.log(`📚 Found ${searchResults.length} relevant contexts`)

    // 3. Pripremi kontekste za RAG
    const contexts = searchResults.map(result => ({
      content: result.content,
      url: result.metadata.url,
      title: result.metadata.title,
      relevanceScore: result.relevanceScore,
    }))

    // 4. Pripremi istoriju konverzacije
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.role === 'USER' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
    }))

    // 5. Generiši AI odgovor koristeći Ollama + RAG
    let aiResponse: string
    let sources: any[]
    let processingTime: number

    try {
      const ollamaClient = getOllamaClient()

      // Proveri da li je Ollama dostupan
      const isHealthy = await ollamaClient.healthCheck()
      if (!isHealthy) {
        throw new Error('Ollama servis nije dostupan')
      }

      const ragResponse = await ollamaClient.generateRAGResponse(
        validatedData.content,
        contexts,
        conversationHistory
      )

      aiResponse = ragResponse.answer
      sources = ragResponse.sources
      processingTime = ragResponse.processingTime

      console.log(`✅ AI response generated in ${processingTime}ms`)
    } catch (ollamaError: any) {
      console.error('❌ Ollama error:', ollamaError.message)

      // Fallback na mock odgovor ako Ollama ne radi
      aiResponse = generateFallbackResponse(validatedData.content, contexts)
      sources = contexts.map(ctx => ({
        url: ctx.url,
        title: ctx.title,
        relevanceScore: Math.round(ctx.relevanceScore * 100),
      }))
      processingTime = Date.now() - startTime
    }

    // 6. Sačuvaj AI poruku
    const aiMessage = await prisma.message.create({
      data: {
        conversationId: validatedData.conversationId,
        role: 'ASSISTANT',
        content: aiResponse,
        sources: sources,
        processingTime,
      },
    })

    // 7. Ažuriraj updatedAt konverzacije
    await prisma.conversation.update({
      where: { id: validatedData.conversationId },
      data: { updatedAt: new Date() },
    })

    return successResponse(
      {
        userMessage,
        aiMessage,
      },
      201
    )
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * Fallback odgovor ako Ollama nije dostupan
 */
function generateFallbackResponse(question: string, contexts: any[]): string {
  if (contexts.length === 0) {
    return `Nisam pronašao relevantne informacije u ELAB dokumentaciji za pitanje: "${question}". 

Molim vas da:
1. Preformulišete pitanje
2. Posetite direktno ELAB sajtove:
   - https://elab.fon.bg.ac.rs
   - https://bc.elab.fon.bg.ac.rs
   - https://ebt.rs

Napomena: AI servis trenutno nije dostupan, koristim osnovnu pretragu.`
  }

  const contextSummary = contexts
    .slice(0, 2)
    .map(ctx => `- ${ctx.title}: ${ctx.content.slice(0, 150)}...`)
    .join('\n')

  return `Na osnovu pronađenih informacija:

${contextSummary}

Napomena: AI servis trenutno nije dostupan. Ovo je automatski generisan odgovor baziran na pretrazi dokumenata. Za detaljnije informacije, posetite izvorne stranice.`
}
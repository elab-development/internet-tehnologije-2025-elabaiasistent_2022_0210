// src/app/api/chat/messages/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { sendMessageSchema } from '@/lib/validations/chat'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/chat/messages
 * Šalje poruku i generiše AI odgovor (mock za sada)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const validatedData = sendMessageSchema.parse(body)

    // Proveri da li konverzacija pripada korisniku
    const conversation = await prisma.conversation.findUnique({
      where: { id: validatedData.conversationId },
    })

    if (!conversation) {
      throw new ApiError('Konverzacija nije pronađena', 404)
    }

    if (conversation.userId !== user.id) {
      throw new ApiError('Nemate pristup ovoj konverzaciji', 403)
    }

    const startTime = Date.now()

    // Kreiraj korisničku poruku
    const userMessage = await prisma.message.create({
      data: {
        conversationId: validatedData.conversationId,
        role: 'USER',
        content: validatedData.content,
      },
    })

    // MOCK AI RESPONSE (za sada)
    // TODO: Integrisati RAG engine i Ollama
    const mockAIResponse = generateMockResponse(validatedData.content)
    const processingTime = Date.now() - startTime

    const aiMessage = await prisma.message.create({
      data: {
        conversationId: validatedData.conversationId,
        role: 'ASSISTANT',
        content: mockAIResponse.content,
        sources: mockAIResponse.sources,
        processingTime,
      },
    })

    // Ažuriraj updatedAt konverzacije
    await prisma.conversation.update({
      where: { id: validatedData.conversationId },
      data: { updatedAt: new Date() },
    })

    return successResponse({
      userMessage,
      aiMessage,
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * Mock funkcija za generisanje AI odgovora
 * TODO: Zameniti sa pravim RAG engine-om
 */
function generateMockResponse(question: string) {
  const mockResponses = [
    {
      content: 'Na osnovu dostupnih informacija sa ELAB platforme, mogu vam reći da...\n\nIspitni rokovi za E-poslovanje su:\n- Januarski rok: 15.01.2024\n- Februarski rok: 10.02.2024\n- Junski rok: 20.06.2024\n\nPreporučujem da proverite tačne termine na zvaničnom sajtu.',
      sources: [
        {
          url: 'https://elab.fon.bg.ac.rs/ispiti',
          title: 'Raspored ispita - ELAB',
          relevanceScore: 0.95,
        },
        {
          url: 'https://elab.fon.bg.ac.rs/predmeti/e-poslovanje',
          title: 'E-poslovanje - Informacije o predmetu',
          relevanceScore: 0.87,
        },
      ],
    },
    {
      content: 'Pronašao sam sledeće informacije u bazi znanja:\n\nMaterijali za učenje su dostupni u sekciji "Materijali" svakog predmeta. Možete preuzeti:\n- Prezentacije sa predavanja\n- Skripte\n- Primere zadataka\n- Video snimke',
      sources: [
        {
          url: 'https://elab.fon.bg.ac.rs/materijali',
          title: 'Materijali za učenje',
          relevanceScore: 0.92,
        },
      ],
    },
  ]

  // Vraća random mock odgovor
  return mockResponses[Math.floor(Math.random() * mockResponses.length)]
}
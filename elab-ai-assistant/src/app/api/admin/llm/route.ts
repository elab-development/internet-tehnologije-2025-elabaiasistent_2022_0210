// src/app/api/admin/llm/route.ts

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { getOllamaClient } from '@/lib/ollama'
import { errorResponse, successResponse } from '@/lib/api-response'

/**
 * GET /api/admin/llm
 * Vraća status i informacije o LLM servisu
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const ollamaClient = getOllamaClient()

    // Proveri health
    const isHealthy = await ollamaClient.healthCheck()

    if (!isHealthy) {
      return successResponse({
        status: 'offline',
        message: 'Ollama servis nije dostupan',
        baseUrl: process.env.OLLAMA_BASE_URL,
      })
    }

    // Učitaj dostupne modele
    const models = await ollamaClient.listModels()

    // Učitaj info o trenutnom modelu
    const modelInfo = await ollamaClient.getModelInfo()

    return successResponse({
      status: 'online',
      baseUrl: process.env.OLLAMA_BASE_URL,
      currentModel: process.env.OLLAMA_MODEL,
      availableModels: models,
      modelInfo: modelInfo ? {
        name: modelInfo.modelfile,
        size: modelInfo.size,
        parameters: modelInfo.details?.parameter_size,
        quantization: modelInfo.details?.quantization_level,
      } : null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/admin/llm/test
 * Testira LLM sa probnim pitanjem
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { question = 'Šta je ELAB platforma?' } = body

    const ollamaClient = getOllamaClient()

    const startTime = Date.now()
    const response = await ollamaClient.chat([
      {
        role: 'system',
        content: 'Ti si ELAB AI Assistant. Odgovori kratko i jasno.',
      },
      {
        role: 'user',
        content: question,
      },
    ])
    const processingTime = Date.now() - startTime

    return successResponse({
      question,
      answer: response,
      processingTime,
      model: process.env.OLLAMA_MODEL,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
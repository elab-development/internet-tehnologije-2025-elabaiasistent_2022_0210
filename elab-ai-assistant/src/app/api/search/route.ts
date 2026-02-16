// src/app/api/search/route.ts

import { NextRequest } from 'next/server'
import { getVectorDB } from '@/lib/vector-db'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

/**
 * GET /api/search?q=query&limit=5&sourceType=ELAB_MAIN
 * Semantic search kroz indeksirane dokumente
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '5')
    const sourceType = searchParams.get('sourceType') || undefined

    if (!query || query.trim().length === 0) {
      throw new ApiError('Query parametar je obavezan', 400)
    }

    const vectorDB = await getVectorDB()

    const results = await vectorDB.search(query, {
      limit,
      sourceType,
      minRelevance: 0.3,
    })

    return successResponse({
      query,
      results: results.map(r => ({
        content: r.content,
        url: r.metadata.url,
        title: r.metadata.title,
        sourceType: r.metadata.sourceType,
        relevanceScore: Math.round(r.relevanceScore * 100),
      })),
      total: results.length,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
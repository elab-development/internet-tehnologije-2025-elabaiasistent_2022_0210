// src/app/api/admin/crawl/reset/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { getVectorDB, resetVectorDBInstance } from '@/lib/vector-db'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * DELETE /api/admin/crawl/reset
 * Briše sve crawlovane podatke (ChromaDB + istorija)
 * OPASNA AKCIJA - potrebna admin autorizacija
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin()

    console.log(`⚠️  RESET initiated by admin: ${admin.email}`)

    // 1. Prebroj podatke pre brisanja (za statistiku)
    const vectorDB = await getVectorDB()
    const chromaStats = await vectorDB.getStats()
    const crawlJobsCount = await prisma.crawlJob.count()

    console.log(`📊 Stats before reset:`)
    console.log(`   - ChromaDB documents: ${chromaStats.totalDocuments}`)
    console.log(`   - CrawlJobs: ${crawlJobsCount}`)

    // 2. Obriši ChromaDB kolekciju (kompletno)
    console.log(`🗑️  Deleting ChromaDB collection...`)
    await vectorDB.clear()
    resetVectorDBInstance() // Invalidate singleton so next request re-initializes

    // 3. Obriši sve crawl job zapise iz baze
    console.log(`🗑️  Deleting all CrawlJob records...`)
    const deletedJobs = await prisma.crawlJob.deleteMany({})

    // 4. Resetuj lastCrawledAt za sve source-e
    console.log(`🔄 Resetting Source lastCrawledAt...`)
    const updatedSources = await prisma.source.updateMany({
      data: {
        lastCrawledAt: null,
        lastError: null,
      },
    })

    // 5. Logiraj akciju
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'CRAWL_DATA_RESET',
        resourceType: 'CrawlJob',
        details: {
          chromaDocumentsDeleted: chromaStats.totalDocuments,
          crawlJobsDeleted: deletedJobs.count,
          sourcesReset: updatedSources.count,
        },
      },
    })

    console.log(`✅ RESET completed successfully`)
    console.log(`   - ${chromaStats.totalDocuments} ChromaDB documents deleted`)
    console.log(`   - ${deletedJobs.count} CrawlJobs deleted`)
    console.log(`   - ${updatedSources.count} Sources reset`)

    return successResponse({
      message: 'Svi crawlovani podaci su uspešno obrisani',
      stats: {
        chromaDocumentsDeleted: chromaStats.totalDocuments,
        crawlJobsDeleted: deletedJobs.count,
        sourcesReset: updatedSources.count,
      },
    })
  } catch (error) {
    console.error('❌ RESET failed:', error)
    return errorResponse(error)
  }
}

/**
 * GET /api/admin/crawl/reset
 * Vraća statistiku koja će biti obrisana (za preview)
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const vectorDB = await getVectorDB()
    const chromaStats = await vectorDB.getStats()
    const crawlJobsCount = await prisma.crawlJob.count()
    const sourcesCount = await prisma.source.count()
    const activeSources = await prisma.source.count({
      where: { status: 'ACTIVE' },
    })

    return successResponse({
      stats: {
        chromaDocuments: chromaStats.totalDocuments,
        crawlJobs: crawlJobsCount,
        totalSources: sourcesCount,
        activeSources,
        collectionName: chromaStats.collectionName,
        chromaUrl: chromaStats.chromaUrl,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

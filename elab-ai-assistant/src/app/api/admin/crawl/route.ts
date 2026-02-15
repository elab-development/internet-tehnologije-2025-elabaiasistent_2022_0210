// src/app/api/admin/crawl/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { WebCrawler } from '@/lib/crawler'
import { TextChunker } from '@/lib/text-chunker'
import { errorResponse, successResponse, ApiError } from '@/lib/api-response'

/**
 * POST /api/admin/crawl
 * Pokreće crawl job za odabrane izvore
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()

    const { sourceIds } = body // Array of source IDs to crawl

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      throw new ApiError('Morate navesti najmanje jedan izvor', 400)
    }

    // Učitaj izvore iz baze
    const sources = await prisma.source.findMany({
      where: {
        id: { in: sourceIds },
        status: 'ACTIVE',
      },
    })

    if (sources.length === 0) {
      throw new ApiError('Nijedan aktivan izvor nije pronađen', 404)
    }

    console.log(`🚀 Starting crawl job for ${sources.length} sources`)

    // Kreiraj crawl job u bazi
    const crawlJob = await prisma.crawlJob.create({
      data: {
        sourceId: sources[0].id, // Za sada koristimo prvi izvor
        status: 'RUNNING',
        startedAt: new Date(),
        createdBy: admin.id,
      },
    })

    // Pokreni crawling (asinhrono)
    crawlDocuments(sources, crawlJob.id).catch(error => {
      console.error('❌ Crawl job failed:', error)
    })

    return successResponse(
      {
        message: 'Crawl job pokrenut',
        crawlJob: {
          id: crawlJob.id,
          status: crawlJob.status,
          startedAt: crawlJob.startedAt,
        },
      },
      202 // Accepted
    )
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * Asinhrona funkcija za crawlovanje dokumenata
 */
async function crawlDocuments(sources: any[], crawlJobId: string) {
  try {
    const crawler = new WebCrawler({
      maxDepth: 2,
      maxPages: 50,
      timeout: 10000,
    })

    const chunker = new TextChunker({
      chunkSize: 512,
      chunkOverlap: 50,
    })

    let totalDocuments = 0
    let totalChunks = 0
    const errors: string[] = []

    // Crawluj svaki izvor
    for (const source of sources) {
      try {
        console.log(`🕷  Crawling source: ${source.url}`)

        const documents = await crawler.crawl(source.url)
        totalDocuments += documents.length

        // Kreiraj chunk-ove za svaki dokument
        for (const doc of documents) {
          const chunks = chunker.createChunks(doc.content)
          totalChunks += chunks.length

          console.log(`📄 Document: ${doc.title} → ${chunks.length} chunks`)

          // TODO: U sledećem commit-u ćemo čuvati chunk-ove u ChromaDB
          // Za sada samo logujemo
        }

        // Ažuriraj source lastCrawledAt
        await prisma.source.update({
          where: { id: source.id },
          data: { lastCrawledAt: new Date() },
        })
      } catch (error: any) {
        console.error(`❌ Failed to crawl ${source.url}:`, error.message)
        errors.push(`${source.url}: ${error.message}`)
      }
    }

    // Ažuriraj crawl job
    await prisma.crawlJob.update({
      where: { id: crawlJobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        stats: {
          totalDocuments,
          totalChunks,
          sources: sources.length,
        },
        errors: errors.length > 0 ? errors : null,
      },
    })

    console.log(`✅ Crawl job completed: ${totalDocuments} docs, ${totalChunks} chunks`)
  } catch (error: any) {
    console.error('❌ Crawl job error:', error)

    // Ažuriraj status na FAILED
    await prisma.crawlJob.update({
      where: { id: crawlJobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [error.message],
      },
    })
  }
}

/**
 * GET /api/admin/crawl
 * Vraća status crawl job-ova
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const crawlJobs = await prisma.crawlJob.findMany({
      include: {
        source: {
          select: {
            url: true,
            sourceType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return successResponse({ crawlJobs })
  } catch (error) {
    return errorResponse(error)
  }
}
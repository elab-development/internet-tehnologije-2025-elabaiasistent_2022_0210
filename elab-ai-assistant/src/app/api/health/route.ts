// src/app/api/health/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 🔹 KLJUČNO: Spreči statički rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/health
 * Health check endpoint za Docker i monitoring
 */
export async function GET() {
  try {
    // Proveri konekciju sa bazom
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}
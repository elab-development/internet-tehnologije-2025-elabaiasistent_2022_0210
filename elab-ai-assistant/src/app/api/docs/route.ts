// src/app/api/docs/route.ts

import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

/**
 * GET /api/docs
 * Vraća OpenAPI specifikaciju u JSON formatu
 */
export async function GET() {
  return NextResponse.json(swaggerSpec)
}
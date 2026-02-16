// src/lib/cors.ts

/**
 * CORS Configuration
 * Zaštita od Cross-Origin napada
 */

import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXTAUTH_URL || '',
  process.env.APP_URL || '',
].filter(Boolean)

/**
 * Proverava da li je origin dozvoljen
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // Same-origin zahtevi
  
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed === '*') return true
    return origin === allowed || origin.startsWith(allowed)
  })
}

/**
 * Dodaje CORS headers na response
 */
export function addCORSHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400') // 24h
  
  return response
}

/**
 * Kreira CORS preflight response
 */
export function createCORSPreflightResponse(origin: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCORSHeaders(response, origin)
}
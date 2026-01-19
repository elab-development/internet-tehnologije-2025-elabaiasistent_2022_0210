// src/lib/api-response.ts

import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(error: any) {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  if (error.name === 'ZodError') {
    return NextResponse.json(
      {
        error: 'Validacija neuspešna',
        details: error.errors,
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { error: 'Interna greška servera' },
    { status: 500 }
  )
}
// src/app/api/weather/route.ts

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getWeatherAPI } from '@/lib/weather-api'
import { errorResponse, successResponse } from '@/lib/api-response'

/**
 * GET /api/weather?city=Belgrade
 * Vraća trenutno vreme za grad
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const city = searchParams.get('city') || undefined

    const weatherAPI = getWeatherAPI()

    if (!weatherAPI.isConfigured()) {
      return successResponse({
        message: 'Weather API is not configured',
        configured: false,
      })
    }

    const weather = await weatherAPI.getCurrentWeather(city)

    return successResponse({
      weather,
      configured: true,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
// src/app/api/weather/forecast/route.ts

import { NextRequest } from 'next/server'
import { getWeatherAPI } from '@/lib/weather-api'
import { errorResponse, successResponse } from '@/lib/api-response'

/**
 * GET /api/weather/forecast?city=Belgrade
 * Vraća 5-dnevnu prognozu
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

    const forecast = await weatherAPI.getForecast(city)

    return successResponse({
      forecast,
      configured: true,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
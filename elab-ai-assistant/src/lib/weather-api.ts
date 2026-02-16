// src/lib/weather-api.ts

/**
 * OpenWeatherMap API Service
 * External API #2 za projekat
 */

const API_KEY = process.env.OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'
const DEFAULT_CITY = process.env.OPENWEATHER_CITY || 'Belgrade,RS'

/**
 * Tip za trenutno vreme
 */
export interface CurrentWeather {
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  description: string
  icon: string
  windSpeed: number
  city: string
  country: string
  timestamp: number
}

/**
 * Tip za prognozu
 */
export interface WeatherForecast {
  date: string
  temperature: {
    min: number
    max: number
    avg: number
  }
  description: string
  icon: string
  humidity: number
}

/**
 * Weather API Client
 */
export class WeatherAPI {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠  OpenWeatherMap API key not configured')
    }
  }

  /**
   * Proverava da li je API key konfigurisan
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Dobija trenutno vreme za grad
   */
  async getCurrentWeather(city: string = DEFAULT_CITY): Promise<CurrentWeather> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key is not configured')
    }

    try {
      const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=sr`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        city: data.name,
        country: data.sys.country,
        timestamp: data.dt,
      }
    } catch (error: any) {
      console.error('❌ Weather API error:', error.message)
      throw error
    }
  }

  /**
   * Dobija 5-dnevnu prognozu
   */
  async getForecast(city: string = DEFAULT_CITY): Promise<WeatherForecast[]> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key is not configured')
    }

    try {
      const response = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=sr`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Grupiši po danima
      const dailyData: Record<string, any[]> = {}

      data.list.forEach((item: any) => {
        const date = item.dt_txt.split(' ')[0]
        if (!dailyData[date]) {
          dailyData[date] = []
        }
        dailyData[date].push(item)
      })

      // Kreiraj forecast za svaki dan
      const forecasts: WeatherForecast[] = Object.entries(dailyData).map(([date, items]) => {
        const temps = items.map((item: any) => item.main.temp)
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length

        // Uzmi podatke iz sredine dana (12:00)
        const midDayItem = items.find((item: any) => item.dt_txt.includes('12:00')) || items[0]

        return {
          date,
          temperature: {
            min: Math.round(Math.min(...temps)),
            max: Math.round(Math.max(...temps)),
            avg: Math.round(avgTemp),
          },
          description: midDayItem.weather[0].description,
          icon: midDayItem.weather[0].icon,
          humidity: midDayItem.main.humidity,
        }
      })

      return forecasts.slice(0, 5) // Prvih 5 dana
    } catch (error: any) {
      console.error('❌ Weather forecast error:', error.message)
      throw error
    }
  }

  /**
   * Formatira temperaturu sa simbolom
   */
  static formatTemp(temp: number): string {
    return `${temp}°C`
  }

  /**
   * Vraća URL za weather ikonu
   */
  static getIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`
  }
}

/**
 * Singleton instanca Weather API-ja
 */
let weatherAPIInstance: WeatherAPI | null = null

export function getWeatherAPI(): WeatherAPI {
  if (!weatherAPIInstance) {
    weatherAPIInstance = new WeatherAPI()
  }
  return weatherAPIInstance
}
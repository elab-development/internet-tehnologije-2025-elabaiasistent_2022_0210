// scripts/test-weather.ts

import { getWeatherAPI, WeatherAPI } from '../src/lib/weather-api'

async function testWeatherAPI() {
  console.log('🧪 Testing Weather API Integration...\n')

  const weatherAPI = getWeatherAPI()

  if (!weatherAPI.isConfigured()) {
    console.log('⚠  Weather API is not configured')
    console.log('   Add OPENWEATHER_API_KEY to .env file')
    return
  }

  // Test 1: Current weather
  console.log('1⃣ Testing current weather...')
  try {
    const weather = await weatherAPI.getCurrentWeather('Belgrade,RS')
    console.log('   ✅ Current weather:')
    console.log(`      📍 Location: ${weather.city}, ${weather.country}`)
    console.log(`      🌡  Temperature: ${WeatherAPI.formatTemp(weather.temperature)}`)
    console.log(`      💨 Feels like: ${WeatherAPI.formatTemp(weather.feelsLike)}`)
    console.log(`      📝 Description: ${weather.description}`)
    console.log(`      💧 Humidity: ${weather.humidity}%`)
    console.log(`      🌬  Wind: ${weather.windSpeed} m/s`)
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test 2: Forecast
  console.log('\n2⃣ Testing 5-day forecast...')
  try {
    const forecast = await weatherAPI.getForecast('Belgrade,RS')
    console.log('   ✅ Forecast:')
    forecast.forEach((day, i) => {
      console.log(`      ${i + 1}. ${day.date}: ${day.temperature.min}°C - ${day.temperature.max}°C (${day.description})`)
    })
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  console.log('\n✅ Weather API test completed!')
}

testWeatherAPI()
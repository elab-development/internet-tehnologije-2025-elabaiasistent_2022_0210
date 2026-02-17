// src/app/(dashboard)/admin/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import DoughnutChart from '@/components/charts/DoughnutChart'
import { Users, Database, TrendingUp, Activity, Cloud, Thermometer } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [weather, setWeather] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, weatherRes] = await Promise.all([
        fetch('/api/admin/statistics'),
        fetch('/api/weather'),
      ])

      const statsData = await statsRes.json()
      const weatherData = await weatherRes.json()

      setStats(statsData)
      setWeather(weatherData.configured ? weatherData.weather : null)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  // Pripremi podatke za grafikone
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
  })

  // Mock podaci za demo (u produkciji bi došli iz baze)
  const messagesPerDay = [12, 18, 15, 22, 28, 25, 30]
  const usersPerDay = [2, 3, 1, 4, 2, 3, 5]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Pregled sistema i upravljanje korisnicima
        </p>
      </div>

      {/* Weather Widget (External API #2) */}
      {weather && (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Cloud className="h-12 w-12" />
                <div>
                  <h3 className="text-2xl font-bold">
                    {weather.city}, {weather.country}
                  </h3>
                  <p className="text-blue-100 capitalize">{weather.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-8 w-8" />
                  <span className="text-5xl font-bold">{weather.temperature}°C</span>
                </div>
                <p className="text-blue-100 text-sm mt-1">
                  Oseća se kao {weather.feelsLike}°C
                </p>
              </div>
              <div className="text-sm text-blue-100">
                <p>💧 Vlažnost: {weather.humidity}%</p>
                <p>🌬 Vetar: {weather.windSpeed} m/s</p>
                <p>🔽 Pritisak: {weather.pressure} hPa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Ukupno korisnika</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.totalUsers || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Konverzacije</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.totalConversations || 0}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Poruke</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.totalMessages || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Satisfaction Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.satisfactionRate || '0%'}
              </p>
            </div>
            <Database className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <LineChart
              title="Poruke po danima (poslednja nedelja)"
              labels={last7Days}
              data={messagesPerDay}
              label="Broj poruka"
              color="rgb(59, 130, 246)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <BarChart
              title="Novi korisnici po danima"
              labels={last7Days}
              data={usersPerDay}
              label="Novi korisnici"
              color="rgb(34, 197, 94)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <DoughnutChart
              title="Korisnici po ulogama"
              labels={stats?.usersByRole?.map((r: any) => r.role) || []}
              data={stats?.usersByRole?.map((r: any) => r._count) || []}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <DoughnutChart
              title="Ocenjivanje odgovora"
              labels={['Pozitivne', 'Negativne']}
              data={[
                stats?.overview?.positiveRatings || 0,
                stats?.overview?.negativeRatings || 0,
              ]}
              colors={['rgb(34, 197, 94)', 'rgb(239, 68, 68)']}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/users">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle>Upravljanje korisnicima</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Pregledajte, blokirajte ili menjajte uloge korisnika
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/sources">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle>Izvori podataka</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Upravljajte URL-ovima za crawling i indeksiranje
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/crawl">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle>Crawl Job-ovi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Pokrenite indeksiranje i pratite status job-ova
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
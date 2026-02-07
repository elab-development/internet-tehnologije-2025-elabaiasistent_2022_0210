// src/app/(dashboard)/admin/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { Users, Database, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/statistics')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Pregled sistema i upravljanje korisnicima
        </p>
      </div>

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

        <Link href="/admin/logs">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle>Sistemski logovi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Pregledajte audit trail i sistemske greške
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Users by Role */}
      {stats?.usersByRole && (
        <Card>
          <CardHeader>
            <CardTitle>Korisnici po ulogama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.usersByRole.map((item: any) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{item.role}</span>
                  <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
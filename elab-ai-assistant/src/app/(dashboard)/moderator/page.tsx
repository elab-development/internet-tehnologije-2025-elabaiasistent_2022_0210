// src/app/(dashboard)/moderator/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { Flag, FileQuestion, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ModeratorPage() {
  const [stats, setStats] = useState({
    pendingFlags: 0,
    openTickets: 0,
    totalFAQs: 0,
    resolvedToday: 0,
    totalConversations: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Mock data for now
      setStats({
        pendingFlags: 3,
        openTickets: 2,
        totalFAQs: 12,
        resolvedToday: 5,
        totalConversations: 8
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Moderator Panel</h1>
        <p className="text-gray-600 mt-1">
          Upravljanje sadržajem i korisničkim upitima
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Pending Flags</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingFlags}</p>
            </div>
            <Flag className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Total FAQs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFAQs}</p>
            </div>
            <FileQuestion className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/moderator/conversations">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                Konverzacije
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Pregledajte sve korisničke konverzacije i moderišite sadržaj
              </p>
              <Badge variant="info">{stats.totalConversations || 0} ukupno</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/moderator/flags">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flag className="h-5 w-5 mr-2 text-yellow-600" />
                Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Pregledajte i rešavajte problematične upite označene od strane korisnika
              </p>
              <Badge variant="warning">{stats.pendingFlags} pending</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/moderator/faq">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileQuestion className="h-5 w-5 mr-2 text-blue-600" />
                FAQ Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Kreirajte i upravljajte često postavljanim pitanjima
              </p>
              <Badge variant="info">{stats.totalFAQs} entries</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/moderator/tickets">
          <Card hover className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Prijavite tehničke probleme administratorima
              </p>
              <Badge variant="danger">{stats.openTickets} open</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

    </div>
  )
}
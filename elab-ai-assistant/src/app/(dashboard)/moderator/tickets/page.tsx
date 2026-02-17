// src/app/(dashboard)/moderator/tickets/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Plus, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  description: string
  ticketType: string
  priority: string
  status: string
  createdAt: string
  resolvedAt: string | null
  creator: {
    email: string
  }
  assignee: {
    email: string
  } | null
}

export default function ModeratorTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticketType: 'BUG',
    priority: 'MEDIUM',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/moderator/tickets')
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/moderator/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri kreiranju ticket-a')
      }

      setSuccess('Ticket uspešno kreiran!')
      setShowModal(false)
      setFormData({
        title: '',
        description: '',
        ticketType: 'BUG',
        priority: 'MEDIUM',
      })
      await fetchTickets()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('sr-RS')
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      OPEN: { variant: 'warning', icon: AlertTriangle },
      IN_PROGRESS: { variant: 'info', icon: Clock },
      RESOLVED: { variant: 'success', icon: CheckCircle },
      CLOSED: { variant: 'default', icon: CheckCircle },
    }

    const { variant, icon: Icon } = config[status] || config.OPEN

    return (
      <Badge variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">
            Prijavite tehničke probleme administratorima
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Kreiraj Ticket
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nema ticket-a u sistemu</p>
              <Button onClick={() => setShowModal(true)} className="mt-4">
                Kreiraj prvi ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ticket.title}
                      </h3>
                      {getStatusBadge(ticket.status)}
                      <Badge variant={ticket.priority === 'CRITICAL' ? 'danger' : 'info'}>
                        {ticket.priority}
                      </Badge>
                    </div>

                    <p className="text-gray-700 mb-3">{ticket.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tip</p>
                        <p className="font-medium text-gray-900">
                          {ticket.ticketType.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kreirao</p>
                        <p className="font-medium text-gray-900">{ticket.creator.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Datum</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      {ticket.assignee && (
                        <div>
                          <p className="text-gray-500">Dodeljen</p>
                          <p className="font-medium text-gray-900">
                            {ticket.assignee.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kreiraj Ticket</CardTitle>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Input
                  label="Naslov"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={isSubmitting}
                  placeholder="Kratak opis problema..."
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis problema <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={5}
                    required
                    placeholder="Detaljno opišite problem..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip problema
                  </label>
                  <select
                    value={formData.ticketType}
                    onChange={(e) =>
                      setFormData({ ...formData, ticketType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="BUG">Bug</option>
                    <option value="FEATURE_REQUEST">Zahtev za novu funkcionalnost</option>
                    <option value="CRAWLING_ERROR">Greška pri crawlovanju</option>
                    <option value="LLM_ERROR">Greška LLM-a</option>
                    <option value="OTHER">Drugo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioritet
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="LOW">Nizak</option>
                    <option value="MEDIUM">Srednji</option>
                    <option value="HIGH">Visok</option>
                    <option value="CRITICAL">Kritičan</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Otkaži
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Kreiraj Ticket
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
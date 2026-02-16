// src/app/(dashboard)/moderator/flags/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Flag, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface FlagItem {
  id: string
  flagType: string
  description: string | null
  priority: string
  status: string
  createdAt: string
  resolvedAt: string | null
  flaggedByUser: {
    email: string
  }
  resolvedByUser: {
    email: string
  } | null
  message: {
    content: string
    conversation: {
      title: string
    }
  } | null
  conversation: {
    title: string
  } | null
}

export default function ModeratorFlagsPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversationId')

  const [flags, setFlags] = useState<FlagItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(!!conversationId)
  const [formData, setFormData] = useState({
    conversationId: conversationId || '',
    messageId: '',
    flagType: 'OTHER',
    description: '',
    priority: 'MEDIUM',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      const response = await fetch('/api/moderator/flags')
      const data = await response.json()
      setFlags(data.flags || [])
    } catch (error) {
      console.error('Error fetching flags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/moderator/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri kreiranju flag-a')
      }

      setSuccess('Flag uspešno kreiran!')
      setShowCreateModal(false)
      setFormData({
        conversationId: '',
        messageId: '',
        flagType: 'OTHER',
        description: '',
        priority: 'MEDIUM',
      })
      await fetchFlags()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolveFlag = async (flagId: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      const response = await fetch(`/api/moderator/flags/${flagId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Greška pri rešavanju flag-a')
      }

      setSuccess(`Flag ${status === 'RESOLVED' ? 'rešen' : 'odbačen'}!`)
      await fetchFlags()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('sr-RS')
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      PENDING: { variant: 'warning', icon: AlertCircle },
      REVIEWED: { variant: 'info', icon: Flag },
      RESOLVED: { variant: 'success', icon: CheckCircle },
      DISMISSED: { variant: 'default', icon: XCircle },
    }

    const { variant, icon: Icon } = config[status] || config.PENDING

    return (
      <Badge variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'default',
    }
    return <Badge variant={variants[priority]}>{priority}</Badge>
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
          <h1 className="text-3xl font-bold text-gray-900">Flags</h1>
          <p className="text-gray-600 mt-1">
            Pregledajte i rešavajte problematične upite
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Flag className="h-4 w-4 mr-2" />
          Kreiraj Flag
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
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Flags List */}
      <div className="space-y-4">
        {flags.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nema flag-ova u sistemu</p>
            </CardContent>
          </Card>
        ) : (
          flags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {flag.flagType.replace(/_/g, ' ')}
                      </h3>
                      {getStatusBadge(flag.status)}
                      {getPriorityBadge(flag.priority)}
                    </div>

                    {flag.description && (
                      <p className="text-gray-700 mb-3">{flag.description}</p>
                    )}

                    {flag.message && (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm mb-3">
                        <p className="text-gray-600 mb-1">
                          <strong>Konverzacija:</strong> {flag.message.conversation.title}
                        </p>
                        <p className="text-gray-900 line-clamp-2">
                          {flag.message.content}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Prijavio</p>
                        <p className="font-medium text-gray-900">
                          {flag.flaggedByUser.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Datum</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(flag.createdAt)}
                        </p>
                      </div>
                      {flag.resolvedByUser && (
                        <>
                          <div>
                            <p className="text-gray-500">Rešio</p>
                            <p className="font-medium text-gray-900">
                              {flag.resolvedByUser.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Datum rešavanja</p>
                            <p className="font-medium text-gray-900">
                              {formatDate(flag.resolvedAt)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {flag.status === 'PENDING' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleResolveFlag(flag.id, 'RESOLVED')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Reši
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolveFlag(flag.id, 'DISMISSED')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Odbaci
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kreiraj Flag</CardTitle>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFlag} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Input
                  label="Conversation ID (opciono)"
                  value={formData.conversationId}
                  onChange={(e) =>
                    setFormData({ ...formData, conversationId: e.target.value })
                  }
                  disabled={isSubmitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip problema <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.flagType}
                    onChange={(e) =>
                      setFormData({ ...formData, flagType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="INAPPROPRIATE_CONTENT">Neprikladan sadržaj</option>
                    <option value="SPAM">Spam</option>
                    <option value="INCORRECT_ANSWER">Netačan AI odgovor</option>
                    <option value="TECHNICAL_ERROR">Tehnički problem</option>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis problema
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Opišite problem detaljno..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                  >
                    Otkaži
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Kreiraj Flag
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
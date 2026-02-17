// src/app/(dashboard)/admin/sources/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react'

interface Source {
  id: string
  url: string
  sourceType: string
  priority: string
  status: string
  crawlFrequency: string
  lastCrawledAt: string | null
  lastError: string | null
  createdAt: string
  _count?: {
    crawlJobs: number
  }
}

export default function SourcesManagementPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    sourceType: 'ELAB_MAIN',
    priority: 'MEDIUM',
    crawlFrequency: 'WEEKLY',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/admin/sources')
      const data = await response.json()
      setSources(data.sources || [])
    } catch (error) {
      console.error('Error fetching sources:', error)
      setError('Greška pri učitavanju izvora')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri dodavanju izvora')
      }

      setSuccess('Izvor uspešno dodat!')
      setShowModal(false)
      setFormData({
        url: '',
        sourceType: 'ELAB_MAIN',
        priority: 'MEDIUM',
        crawlFrequency: 'WEEKLY',
      })
      await fetchSources()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (sourceId: string, url: string) => {
    if (!confirm(`Da li ste sigurni da želite da obrišete izvor:\n${url}\n\nOvo će obrisati i sve povezane crawl job-ove.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Greška pri brisanju izvora')
      }

      setSuccess('Izvor uspešno obrisan!')
      await fetchSources()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Nikad'
    return new Date(date).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      ACTIVE: 'success',
      INACTIVE: 'warning',
      ERROR: 'danger',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
      CRITICAL: 'danger',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'default',
    }
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>
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
          <h1 className="text-3xl font-bold text-gray-900">Upravljanje izvorima</h1>
          <p className="text-gray-600 mt-1">
            Dodajte i upravljajte URL-ovima za crawling i indeksiranje
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj izvor
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

      {/* Sources List */}
      <div className="grid grid-cols-1 gap-4">
        {sources.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">Nema dodanih izvora</p>
              <Button onClick={() => setShowModal(true)} className="mt-4">
                Dodaj prvi izvor
              </Button>
            </CardContent>
          </Card>
        ) : (
          sources.map((source) => (
            <Card key={source.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {source.url}
                      </h3>
                      {getStatusBadge(source.status)}
                      {getPriorityBadge(source.priority)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tip izvora</p>
                        <p className="font-medium text-gray-900">{source.sourceType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Učestalost</p>
                        <p className="font-medium text-gray-900">{source.crawlFrequency}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Poslednji crawl</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(source.lastCrawledAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Crawl job-ovi</p>
                        <p className="font-medium text-gray-900">
                          {source._count?.crawlJobs || 0}
                        </p>
                      </div>
                    </div>

                    {source.lastError && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Poslednja greška:</strong> {source.lastError}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(source.id, source.url)}
                      title="Obriši izvor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Source Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dodaj novi izvor</CardTitle>
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Input
                  label="URL adresa"
                  type="url"
                  placeholder="https://elab.fon.bg.ac.rs"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  disabled={isSubmitting}
                  helperText="Unesite kompletan URL sa https://"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip izvora <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="ELAB_MAIN">ELAB Main (elab.fon.bg.ac.rs)</option>
                    <option value="ELAB_BC">ELAB BC (bc.elab.fon.bg.ac.rs)</option>
                    <option value="ELAB_EBT">ELAB EBT (ebt.rs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioritet <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="LOW">Nizak</option>
                    <option value="MEDIUM">Srednji</option>
                    <option value="HIGH">Visok</option>
                    <option value="CRITICAL">Kritičan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Učestalost ažuriranja <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.crawlFrequency}
                    onChange={(e) => setFormData({ ...formData, crawlFrequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="MANUAL">Ručno</option>
                    <option value="DAILY">Dnevno</option>
                    <option value="WEEKLY">Nedeljno</option>
                    <option value="MONTHLY">Mesečno</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Otkaži
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Dodaj izvor
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
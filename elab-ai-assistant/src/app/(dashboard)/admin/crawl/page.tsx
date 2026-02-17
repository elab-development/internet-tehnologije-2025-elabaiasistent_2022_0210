// src/app/(dashboard)/admin/crawl/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import DangerConfirmDialog from '@/components/ui/DangerConfirmDialog'
import { Play, CheckCircle, AlertCircle, Clock, Database, Trash2 } from 'lucide-react'

interface Source {
  id: string
  url: string
  sourceType: string
  status: string
}

interface CrawlJob {
  id: string
  status: string
  startedAt: string
  completedAt: string | null
  stats: any
  errors: any
  source: {
    url: string
    sourceType: string
  }
}

export default function CrawlJobsPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [crawlJobs, setCrawlJobs] = useState<CrawlJob[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetStats, setResetStats] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
    fetchResetStats()
  }, [])

  const fetchData = async () => {
    try {
      const [sourcesRes, jobsRes] = await Promise.all([
        fetch('/api/admin/sources'),
        fetch('/api/admin/crawl'),
      ])

      const sourcesData = await sourcesRes.json()
      const jobsData = await jobsRes.json()

      setSources(sourcesData.sources?.filter((s: Source) => s.status === 'ACTIVE') || [])
      setCrawlJobs(jobsData.crawlJobs || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Greška pri učitavanju podataka')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchResetStats = async () => {
    try {
      const response = await fetch('/api/admin/crawl/reset')
      const data = await response.json()
      setResetStats(data.stats)
    } catch (error) {
      console.error('Error fetching reset stats:', error)
    }
  }

  const handleStartCrawl = async () => {
    if (selectedSources.length === 0) {
      setError('Morate selektovati najmanje jedan izvor')
      setTimeout(() => setError(''), 3000)
      return
    }

    setIsCrawling(true)
    setError('')

    try {
      const response = await fetch('/api/admin/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds: selectedSources }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri pokretanju crawl job-a')
      }

      setSuccess('Crawl job uspešno pokrenut! Proces se izvršava u pozadini.')
      setSelectedSources([])

      // Refresh job lista nakon 2 sekunde
      setTimeout(() => {
        fetchData()
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsCrawling(false)
    }
  }

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handleResetClick = () => {
    setResetDialogOpen(true)
  }

  const handleResetConfirm = async () => {
    setIsResetting(true)
    setError('')

    try {
      const response = await fetch('/api/admin/crawl/reset', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri resetovanju podataka')
      }

      setSuccess('Svi crawlovani podaci su uspešno obrisani!')

      // Refresh data
      setTimeout(() => {
        fetchData()
        fetchResetStats()
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsResetting(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; icon: any }> = {
      COMPLETED: { variant: 'success', icon: CheckCircle },
      RUNNING: { variant: 'info', icon: Clock },
      FAILED: { variant: 'danger', icon: AlertCircle },
      PENDING: { variant: 'warning', icon: Clock },
    }

    const { variant, icon: Icon } = config[status] || { variant: 'default' as any, icon: Clock }

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Crawl Job-ovi</h1>
        <p className="text-gray-600 mt-1">
          Pokrenite indeksiranje izvora i pratite status
        </p>
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

      {/* Reset Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-600">Opasna zona</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Resetovanje svih crawlovanih podataka
              </p>
            </div>
            <Database className="h-8 w-8 text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  UPOZORENJE: Ova akcija će trajno obrisati sve podatke!
                </p>
                <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                  <li>Svi dokumenti iz ChromaDB vektorske baze</li>
                  <li>Kompletna istorija crawl job-ova</li>
                  <li>Resetovaće se datum poslednjeg crawlovanja za sve izvore</li>
                </ul>
              </div>
            </div>
          </div>

          {resetStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">ChromaDB dokumenti</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resetStats.chromaDocuments || 0}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">Crawl Job-ova</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resetStats.crawlJobs || 0}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">Ukupno izvora</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resetStats.totalSources || 0}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">Aktivni izvori</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resetStats.activeSources || 0}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="danger"
            onClick={handleResetClick}
            disabled={isResetting}
            isLoading={isResetting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset svih podataka
          </Button>
        </CardContent>
      </Card>

      {/* Start Crawl Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pokreni novo indeksiranje</CardTitle>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <p className="text-gray-600">
              Nema aktivnih izvora. Dodajte izvore na stranici{' '}
              <a href="/admin/sources" className="text-blue-600 hover:underline">
                Upravljanje izvorima
              </a>
              .
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Selektujte izvore koje želite da indeksirate:
              </p>

              <div className="space-y-2 mb-4">
                {sources.map((source) => (
                  <label
                    key={source.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{source.url}</p>
                      <p className="text-sm text-gray-500">{source.sourceType}</p>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleStartCrawl}
                disabled={selectedSources.length === 0 || isCrawling}
                isLoading={isCrawling}
              >
                <Play className="h-4 w-4 mr-2" />
                Pokreni indeksiranje ({selectedSources.length})
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Crawl Jobs History */}
      <Card>
        <CardHeader>
          <CardTitle>Istorija crawl job-ova</CardTitle>
        </CardHeader>
        <CardContent>
          {crawlJobs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Nema izvršenih crawl job-ova
            </p>
          ) : (
            <div className="space-y-3">
              {crawlJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {job.source.url}
                        </h4>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-sm text-gray-500">{job.source.sourceType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-gray-500">Započeto</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(job.startedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Završeno</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(job.completedAt)}
                      </p>
                    </div>
                    {job.stats && (
                      <>
                        <div>
                          <p className="text-gray-500">Dokumenti</p>
                          <p className="font-medium text-gray-900">
                            {job.stats.totalDocuments || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Chunk-ovi</p>
                          <p className="font-medium text-gray-900">
                            {job.stats.totalChunks || 0}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {job.errors && job.errors.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Greške:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {job.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <DangerConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
        title="Resetuj sve crawlovane podatke"
        message="Ova akcija će TRAJNO obrisati sve indeksirane dokumente i istoriju crawl job-ova. Ova akcija se NE MOŽE poništiti!"
        confirmationText="RESET"
        confirmButtonText="Obriši sve podatke"
        cancelButtonText="Otkaži"
        stats={resetStats ? [
          { label: 'ChromaDB dokumenti', value: resetStats.chromaDocuments || 0 },
          { label: 'Crawl job-ova', value: resetStats.crawlJobs || 0 },
          { label: 'Izvori (resetovani)', value: resetStats.totalSources || 0 },
          { label: 'Kolekcija', value: resetStats.collectionName || 'N/A' },
        ] : []}
      />
    </div>
  )
}
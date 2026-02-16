// src/app/(dashboard)/moderator/flags/page.tsx

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Flag, CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react'

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

// ============================================
// 🔹 KOMPONENTA SA useSearchParams LOGIKOM
// ============================================
function FlagsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const conversationId = searchParams.get('conversationId')
  const messageId = searchParams.get('messageId')

  const [flags, setFlags] = useState<FlagItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // ✅ Modal se prikazuje SAMO ako dolazi sa URL parametrima
  const [showCreateModal, setShowCreateModal] = useState(!!conversationId)
  
  const [formData, setFormData] = useState({
    conversationId: conversationId || '',
    messageId: messageId || '',
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
      const payload: any = {
        flagType: formData.flagType,
        priority: formData.priority,
      }

      if (formData.conversationId) {
        payload.conversationId = formData.conversationId
      }
      if (formData.messageId) {
        payload.messageId = formData.messageId
      }
      if (formData.description) {
        payload.description = formData.description
      }

      const response = await fetch('/api/moderator/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri kreiranju flag-a')
      }

      setSuccess('Flag uspešno kreiran!')
      setShowCreateModal(false)
      
      // ✅ Očisti URL parametre nakon kreiranja
      router.push('/moderator/flags')
      
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

  const handleCloseModal = () => {
    setShowCreateModal(false)
    // ✅ Očisti URL parametre ako korisnik odustane
    router.push('/moderator/flags')
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
        
        {/* ✅ UKLONJEN "Kreiraj Flag" dugme - flagovi se kreiraju samo iz konverzacija */}
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Kako kreirati flag?</p>
          <p>
            Flagovi se kreiraju direktno iz konverzacija. Pronađite problematičnu poruku 
            i kliknite na ikonu <Flag className="h-3 w-3 inline mx-1" /> da prijavite problem.
          </p>
        </div>
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
              <p className="text-gray-600 font-medium mb-1">Nema flag-ova u sistemu</p>
              <p className="text-sm text-gray-500">
                Kada korisnici prijave probleme, pojaviće se ovde
              </p>
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

                    {flag.conversation && !flag.message && (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm mb-3">
                        <p className="text-gray-600">
                          <strong>Konverzacija:</strong> {flag.conversation.title}
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

      {/* Create Flag Modal - Prikazuje se SAMO kada dolazi sa conversationId */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prijavi problem</CardTitle>
                <button
                  onClick={handleCloseModal}
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

                {/* Info o kontekstu */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Kontekst:</strong> {formData.conversationId ? 'Konverzacija' : 'Poruka'} ID: 
                    <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">
                      {formData.conversationId || formData.messageId}
                    </code>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip problema <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.flagType}
                    onChange={(e) =>
                      setFormData({ ...formData, flagType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Opis problema <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Opišite problem detaljno..."
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimalno 10 karaktera
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Otkaži
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    <Flag className="h-4 w-4 mr-2" />
                    Prijavi problem
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

// ============================================
// 🔹 LOADING FALLBACK
// ============================================
function FlagsLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
      </div>

      <div className="h-20 bg-gray-200 rounded animate-pulse"></div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 🔹 GLAVNA KOMPONENTA SA SUSPENSE
// ============================================
export default function ModeratorFlagsPage() {
  return (
    <Suspense fallback={<FlagsLoadingFallback />}>
      <FlagsContent />
    </Suspense>
  )
}
// src/app/(dashboard)/moderator/faq/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Plus, Edit, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  createdAt: string
  creator: {
    email: string
  }
  updater?: {
    email: string
  }
}

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Opšte',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/moderator/faq')
      const data = await response.json()
      setFaqs(data.faqs || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      setError('Greška pri učitavanju FAQ-ova')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingFAQ(null)
    setFormData({ question: '', answer: '', category: 'Opšte' })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleOpenEdit = (faq: FAQ) => {
    setEditingFAQ(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingFAQ(null)
    setFormData({ question: '', answer: '', category: 'Opšte' })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const url = editingFAQ
        ? `/api/moderator/faq/${editingFAQ.id}`
        : '/api/moderator/faq'

      const method = editingFAQ ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri čuvanju FAQ-a')
      }

      setSuccess(editingFAQ ? 'FAQ uspešno ažuriran!' : 'FAQ uspešno kreiran!')
      await fetchFAQs()
      
      setTimeout(() => {
        handleCloseModal()
        setSuccess('')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (faq: FAQ) => {
    if (!confirm(`Da li ste sigurni da želite da obrišete FAQ:\n"${faq.question}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/moderator/faq/${faq.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Greška pri brisanju FAQ-a')
      }

      setSuccess('FAQ uspešno obrisan!')
      await fetchFAQs()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = [...new Set(faqs.map(faq => faq.category))]

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
          <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-600 mt-1">
            Upravljanje često postavljanim pitanjima
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novi FAQ
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

      {/* Search & Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Pretraži FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              {categories.map(category => (
                <Badge key={category} variant="default">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">Nema FAQ-ova koji odgovaraju pretrazi</p>
            </CardContent>
          </Card>
        ) : (
          filteredFAQs.map((faq) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2">
                      <Badge variant="info" size="sm">{faq.category}</Badge>
                    </div>
                    <CardTitle>{faq.question}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleOpenEdit(faq)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDelete(faq)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>Kreirao: {faq.creator.email}</span>
                  <span>{new Date(faq.createdAt).toLocaleDateString('sr-RS')}</span>
                </div>
                {faq.updater && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ažurirao: {faq.updater.email}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingFAQ ? 'Izmeni FAQ' : 'Kreiraj novi FAQ'}
                </CardTitle>
                <button
                  onClick={handleCloseModal}
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

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                )}

                <Input
                  label="Kategorija"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Opšte"
                  required
                  disabled={isSubmitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pitanje <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    rows={2}
                    placeholder="Unesite pitanje..."
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Odgovor <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    rows={6}
                    placeholder="Unesite odgovor..."
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Otkaži
                  </Button>
                  <Button 
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    {editingFAQ ? 'Sačuvaj izmene' : 'Kreiraj'}
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
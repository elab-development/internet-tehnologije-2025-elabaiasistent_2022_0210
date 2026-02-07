// src/app/(dashboard)/moderator/faq/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  createdAt: string
  creator: {
    email: string
  }
}

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: '',
    category: 'Opšte',
  })

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
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFAQ = async () => {
    try {
      const response = await fetch('/api/moderator/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFAQ),
      })

      if (response.ok) {
        await fetchFAQs()
        setShowCreateModal(false)
        setNewFAQ({ question: '', answer: '', category: 'Opšte' })
      }
    } catch (error) {
      console.error('Error creating FAQ:', error)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-600 mt-1">
            Upravljanje često postavljanim pitanjima
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novi FAQ
        </Button>
      </div>

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
        {filteredFAQs.map((faq) => (
          <Card key={faq.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge variant="info" size="sm" className="mb-2">
                    {faq.category}
                  </Badge>
                  <CardTitle>{faq.question}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
              <p className="text-xs text-gray-500 mt-4">
                Kreirao: {faq.creator.email} • {new Date(faq.createdAt).toLocaleDateString('sr-RS')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal (simplified - you can use a proper modal library) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Kreiraj novi FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Kategorija"
                value={newFAQ.category}
                onChange={(e) => setNewFAQ({ ...newFAQ, category: e.target.value })}
                placeholder="Opšte"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pitanje
                </label>
                <textarea
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Unesite pitanje..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odgovor
                </label>
                <textarea
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Unesite odgovor..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Otkaži
                </Button>
                <Button onClick={handleCreateFAQ}>
                  Kreiraj
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
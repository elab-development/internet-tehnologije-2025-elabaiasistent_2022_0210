// src/app/(dashboard)/moderator/conversations/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Search, MessageSquare, Flag, Eye, ThumbsUp, ThumbsDown } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  user: {
    email: string
    role: string
  }
  _count: {
    messages: number
    flags: number
  }
  messages: Array<{
    id: string
    role: string
    content: string
    createdAt: string
    ratings: Array<{
      rating: string
    }>
  }>
}

export default function ModeratorConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'flagged' | 'negative'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    filterConversations()
  }, [conversations, searchTerm, filterStatus])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/moderator/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterConversations = () => {
    let filtered = conversations

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        conv =>
          conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.messages.some(msg =>
            msg.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    // Filter by status
    if (filterStatus === 'flagged') {
      filtered = filtered.filter(conv => conv._count.flags > 0)
    } else if (filterStatus === 'negative') {
      filtered = filtered.filter(conv =>
        conv.messages.some(msg =>
          msg.ratings.some(r => r.rating === 'NEGATIVE')
        )
      )
    }

    setFilteredConversations(filtered)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasNegativeRatings = (conv: Conversation) => {
    return conv.messages.some(msg =>
      msg.ratings.some(r => r.rating === 'NEGATIVE')
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
        <h1 className="text-3xl font-bold text-gray-900">Sve konverzacije</h1>
        <p className="text-gray-600 mt-1">
          Pregledajte i moderišite korisničke konverzacije
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Pretraži po naslovu, korisniku ili sadržaju..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'primary' : 'ghost'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                Sve ({conversations.length})
              </Button>
              <Button
                variant={filterStatus === 'flagged' ? 'primary' : 'ghost'}
                onClick={() => setFilterStatus('flagged')}
                size="sm"
              >
                <Flag className="h-4 w-4 mr-1" />
                Označene ({conversations.filter(c => c._count.flags > 0).length})
              </Button>
              <Button
                variant={filterStatus === 'negative' ? 'primary' : 'ghost'}
                onClick={() => setFilterStatus('negative')}
                size="sm"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Negativne ({conversations.filter(hasNegativeRatings).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'Nema konverzacija koje odgovaraju filterima'
                  : 'Nema konverzacija u sistemu'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conv) => (
            <Card key={conv.id} hover>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {conv.title}
                      </h3>
                      {conv._count.flags > 0 && (
                        <Badge variant="danger">
                          <Flag className="h-3 w-3 mr-1" />
                          {conv._count.flags}
                        </Badge>
                      )}
                      {hasNegativeRatings(conv) && (
                        <Badge variant="warning">
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Negativne ocene
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Korisnik</p>
                        <p className="font-medium text-gray-900">{conv.user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Poruke</p>
                        <p className="font-medium text-gray-900">{conv._count.messages}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kreirano</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(conv.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Poslednja aktivnost</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(conv.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {conv.messages.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="text-gray-600 line-clamp-2">
                          <strong>Poslednja poruka:</strong>{' '}
                          {conv.messages[conv.messages.length - 1].content}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button
                      size="sm"
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Pregledaj
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedConversation.title}</CardTitle>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                <span>Korisnik: {selectedConversation.user.email}</span>
                <span>•</span>
                <span>{selectedConversation._count.messages} poruka</span>
                <span>•</span>
                <span>{formatDate(selectedConversation.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedConversation.messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.role === 'USER'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={msg.role === 'USER' ? 'info' : 'default'}>
                        {msg.role === 'USER' ? 'Korisnik' : 'AI Asistent'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{msg.content}</p>
                    {msg.ratings.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2">
                        {msg.ratings.map((rating, i) => (
                          <Badge
                            key={i}
                            variant={rating.rating === 'POSITIVE' ? 'success' : 'danger'}
                            size="sm"
                          >
                            {rating.rating === 'POSITIVE' ? (
                              <ThumbsUp className="h-3 w-3" />
                            ) : (
                              <ThumbsDown className="h-3 w-3" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Link href={`/moderator/flags?conversationId=${selectedConversation.id}`}>
                  <Button variant="danger" size="sm">
                    <Flag className="h-4 w-4 mr-1" />
                    Označi kao problematičnu
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                >
                  Zatvori
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
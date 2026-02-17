// src/app/(dashboard)/dashboard/page.tsx

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { MessageSquare, TrendingUp, ThumbsUp, Clock, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage: {
    content: string
    createdAt: string
    role: string
  } | null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleDeleteClick = (convId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConversationToDelete(convId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return

    try {
      const response = await fetch(`/api/chat/conversations/${conversationToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Ukloni konverzaciju iz liste
        setConversations(prev => prev.filter(c => c.id !== conversationToDelete))
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    } finally {
      setConversationToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Dobrodošli, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-blue-100">
          Postavite pitanje i dobijte odgovor baziran na ELAB platformi
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Konverzacije</p>
              <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Ukupno poruka</p>
              <p className="text-2xl font-bold text-gray-900">
                {conversations.reduce((sum, c) => sum + c.messageCount, 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Ocenjeno</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-600">Poslednja aktivnost</p>
              <p className="text-sm font-medium text-gray-900">
                {conversations[0] ? formatDate(conversations[0].updatedAt) : 'N/A'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Nedavne konverzacije</CardTitle>
            <Link href="/chat">
              <Button size="sm">Nova konverzacija</Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Nemate još nijednu konverzaciju</p>
              <Link href="/chat">
                <Button>Započni prvu konverzaciju</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 5).map((conv) => (
                <div key={conv.id} className="relative group">
                  <Link href={`/chat/${conv.id}`}>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 pr-8">{conv.title}</h4>
                        <Badge variant="default" size="sm">
                          {conv.messageCount} poruka
                        </Badge>
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {conv.lastMessage.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(conv.updatedAt)}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteClick(conv.id, e)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded"
                    title="Obriši konverzaciju"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Obriši konverzaciju"
        message="Da li ste sigurni da želite da obrišete ovu konverzaciju? Ova akcija se ne može poništiti."
        confirmText="Obriši"
        cancelText="Otkaži"
        variant="danger"
      />
    </div>
  )
}
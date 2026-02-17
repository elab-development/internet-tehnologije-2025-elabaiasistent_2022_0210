'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Plus, MessageSquare, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  sources?: any[]
  createdAt: string
  ratings?: any[]
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string

  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      loadConversation(conversationId)
    }
  }, [conversationId, conversations])

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${convId}`)
      const data = await response.json()
      setActiveConversation(data.conversation)
    } catch (error) {
      console.error('Error loading conversation:', error)
      router.push('/chat')
    }
  }

  const createNewConversation = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nova konverzacija' }),
      })
      const data = await response.json()

      setConversations(prev => [data.conversation, ...prev])
      router.push(`/chat/${data.conversation.id}`)

      return data.conversation.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  const sendMessage = async (content: string) => {
    if (!conversationId) return

    setIsSending(true)

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      })

      const data = await response.json()

      if (!data.userMessage || !data.aiMessage) {
        console.error('API nije vratio očekivane poruke:', data)
        return
      }

      setActiveConversation(prev => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...prev.messages, data.userMessage, data.aiMessage],
        }
      })

      // Ažuriraj naslov konverzacije ako je ovo prva poruka
      if (activeConversation?.messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        await fetch(`/api/chat/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })

        // Osveži listu konverzacija da prikaže novi naslov
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleRate = async (messageId: string, rating: 'POSITIVE' | 'NEGATIVE') => {
    try {
      await fetch('/api/chat/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      })

      setActiveConversation(prev => {
        if (!prev) return null
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === messageId
              ? { ...msg, ratings: [{ rating }] }
              : msg
          ),
        }
      })
    } catch (error) {
      console.error('Error rating message:', error)
    }
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

        // Ako je obrisana aktivna konverzacija, redirektuj na chat stranicu
        if (activeConversation?.id === conversationToDelete) {
          router.push('/chat')
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    } finally {
      setConversationToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 space-y-2">
          <Link href="/dashboard">
            <Button variant="outline" fullWidth size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazad na Dashboard
            </Button>
          </Link>
          <Button onClick={createNewConversation} fullWidth size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova konverzacija
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Nemate konverzacija
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <div key={conv.id} className="relative group">
                  <Link href={`/chat/${conv.id}`}>
                    <button
                      className={`
                        w-full text-left p-3 rounded-lg transition-colors
                        ${activeConversation?.id === conv.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                        }
                      `}
                    >
                      <p className="font-medium text-sm text-gray-900 truncate pr-8">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conv.messageCount} poruka
                      </p>
                    </button>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteClick(conv.id, e)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                    title="Obriši konverzaciju"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {activeConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Započnite konverzaciju
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Postavite bilo koje pitanje o ELAB platformi i dobićete odgovor baziran na dostupnim informacijama.
                  </p>
                </div>
              ) : (
                <>
                  {activeConversation.messages.filter(Boolean).map((message) => (
                    <ChatMessage
                      key={message.id}
                      id={message.id}
                      role={message.role}
                      content={message.content}
                      sources={message.sources}
                      createdAt={message.createdAt}
                      rating={message.ratings?.[0]}
                      onRate={handleRate}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <ChatInput onSend={sendMessage} disabled={isSending} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Konverzacija nije pronađena
            </h3>
            <Link href="/chat">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova konverzacija
              </Button>
            </Link>
          </div>
        )}
      </div>

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

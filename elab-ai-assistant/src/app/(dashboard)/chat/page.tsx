'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'

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

export default function ChatPage() {
  const router = useRouter()
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

      if (data.conversations?.length > 0) {
        loadConversation(data.conversations[0].id)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`)
      const data = await response.json()
      setActiveConversation(data.conversation)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  // FIX #1: Funkcija sada vraća id novokreirane konverzacije direktno,
  // umesto da se oslanjamo na React state koji se ne ažurira odmah.
  const createNewConversation = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nova konverzacija' }),
      })
      const data = await response.json()

      setConversations(prev => [data.conversation, ...prev])
      setActiveConversation({ ...data.conversation, messages: [] })

      return data.conversation.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  const sendMessage = async (content: string) => {
    // FIX #1: Koristimo id direktno iz return vrednosti, ne iz state-a.
    // Pre fixa, activeConversation?.id je bio uvek undefined ovde zbog
    // toga što React state update nije sinhroni — closure je "zaključao"
    // staru null vrednost.
    let conversationId = activeConversation?.id

    if (!conversationId) {
      conversationId = await createNewConversation() ?? undefined
      if (!conversationId) return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      })

      const data = await response.json()

      // FIX #2: Proveravamo da li su userMessage i aiMessage stvarno prisutni
      // pre nego što ih dodamo u niz. Bez ovoga, undefined vrednosti bi ušle
      // u niz i prouzrokovale crash na message.id u renderu.
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

        // Ako je obrisana aktivna konverzacija, očisti je
        if (activeConversation?.id === conversationToDelete) {
          setActiveConversation(null)
          // Učitaj prvu preostalu konverzaciju ako postoji
          const remaining = conversations.filter(c => c.id !== conversationToDelete)
          if (remaining.length > 0) {
            loadConversation(remaining[0].id)
          }
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
        <div className="p-4 border-b border-gray-200">
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
                  <button
                    onClick={() => loadConversation(conv.id)}
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
                  {/* FIX #2: .filter(Boolean) uklanja sve undefined/null vrednosti
                      iz niza pre renderovanja, što sprečava crash na message.id */}
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
              Izaberite ili kreirajte konverzaciju
            </h3>
            <Button onClick={createNewConversation}>
              <Plus className="h-4 w-4 mr-2" />
              Nova konverzacija
            </Button>
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
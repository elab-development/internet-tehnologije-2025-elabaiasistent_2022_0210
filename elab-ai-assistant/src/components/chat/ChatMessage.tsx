// src/components/chat/ChatMessage.tsx

'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, ExternalLink, User, Bot } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface Source {
  url: string
  title: string
  relevanceScore: number
}

interface ChatMessageProps {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  sources?: Source[]
  createdAt: string
  rating?: {
    rating: 'POSITIVE' | 'NEGATIVE'
    feedbackText?: string
  }
  onRate?: (messageId: string, rating: 'POSITIVE' | 'NEGATIVE') => void
}

export default function ChatMessage({
  id,
  role,
  content,
  sources,
  createdAt,
  rating,
  onRate,
}: ChatMessageProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isUser = role === 'USER'
  const hasRated = !!rating

  const handleRate = async (ratingType: 'POSITIVE' | 'NEGATIVE') => {
    if (hasRated || !onRate) return

    setIsSubmitting(true)
    await onRate(id, ratingType)
    setIsSubmitting(false)
    
    if (ratingType === 'NEGATIVE') {
      setShowFeedback(true)
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isUser ? 'bg-blue-600' : 'bg-gray-700'}
          `}>
            {isUser ? (
              <User className="h-6 w-6 text-white" />
            ) : (
              <Bot className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <div className={`
            rounded-lg p-4
            ${isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-white border border-gray-200'
            }
          `}>
            <p className={`text-sm whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-900'}`}>
              {content}
            </p>

            {/* Sources (samo za AI odgovore) */}
            {!isUser && sources && sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Izvori informacija:
                </p>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                          {source.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{source.url}</p>
                      </div>
                      <Badge variant="info" size="sm" className="ml-2 flex-shrink-0">
                        {(source.relevanceScore * 100).toFixed(0)}%
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rating Controls (samo za AI odgovore) */}
          {!isUser && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs text-gray-500">{formatTime(createdAt)}</span>
              
              {!hasRated && onRate && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleRate('POSITIVE')}
                      disabled={isSubmitting}
                      className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Koristan odgovor"
                    >
                      <ThumbsUp className="h-4 w-4 text-gray-600 hover:text-green-600" />
                    </button>
                    <button
                      onClick={() => handleRate('NEGATIVE')}
                      disabled={isSubmitting}
                      className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Nekoristan odgovor"
                    >
                      <ThumbsDown className="h-4 w-4 text-gray-600 hover:text-red-600" />
                    </button>
                  </div>
                </>
              )}

              {hasRated && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <Badge 
                    variant={rating.rating === 'POSITIVE' ? 'success' : 'danger'} 
                    size="sm"
                  >
                    {rating.rating === 'POSITIVE' ? 'Korisno' : 'Nekorisno'}
                  </Badge>
                </>
              )}
            </div>
          )}

          {/* Feedback Form */}
          {showFeedback && !hasRated && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Šta nije bilo u redu sa ovim odgovorom?
              </p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Opišite problem..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFeedback(false)}
                >
                  Otkaži
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    // TODO: Submit feedback
                    setShowFeedback(false)
                  }}
                >
                  Pošalji
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
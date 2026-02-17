// src/components/ui/DangerConfirmDialog.tsx

'use client'

import { useEffect, useState } from 'react'
import Button from './Button'
import Input from './Input'
import { X, AlertTriangle } from 'lucide-react'

interface DangerConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmationText: string // Tekst koji korisnik mora ukucati da potvrdi
  confirmButtonText?: string
  cancelButtonText?: string
  stats?: Array<{ label: string; value: string | number }>
}

export default function DangerConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmationText,
  confirmButtonText = 'Potvrdi',
  cancelButtonText = 'Otkaži',
  stats = [],
}: DangerConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  // Reset kada se dialog zatvori
  useEffect(() => {
    if (!isOpen) {
      setInputValue('')
      setError('')
    }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  const handleConfirm = () => {
    if (inputValue !== confirmationText) {
      setError(`Morate uneti "${confirmationText}" da potvrdite`)
      return
    }

    onConfirm()
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (error) setError('')
  }

  if (!isOpen) return null

  const isConfirmDisabled = inputValue !== confirmationText

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        {/* Content */}
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-4">
            {message}
          </p>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-red-900 mb-2">
                Šta će biti obrisano:
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {stats.map((stat, index) => (
                  <div key={index} className="text-left">
                    <p className="text-red-700">{stat.label}</p>
                    <p className="font-bold text-red-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unesite <span className="font-mono font-bold text-red-600">{confirmationText}</span> da potvrdite:
            </label>
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={confirmationText}
              className={`font-mono ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  )
}

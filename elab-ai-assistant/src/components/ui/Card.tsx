// src/components/ui/Card.tsx

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const hoverClass = hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''
  const clickableClass = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border border-gray-200
        ${paddingClasses[padding]}
        ${hoverClass}
        ${clickableClass}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Sub-components
export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-b border-gray-200 pb-3 mb-3 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-t border-gray-200 pt-3 mt-3 ${className}`}>
      {children}
    </div>
  )
}
// src/components/layout/Navbar.tsx

'use client'

import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  MessageSquare, 
  LayoutDashboard, 
  Flag, 
  Users, 
  LogOut,
  Settings,
  FileQuestion
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function Navbar() {
  const { user, isAdmin, isModerator } = useAuth()
  const pathname = usePathname()

  const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { href: '/chat', label: 'Chat', icon: MessageSquare, roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { href: '/docs', label: 'API Docs', icon: FileQuestion, roles: ['USER', 'MODERATOR', 'ADMIN'] }, // NOVO
  { href: '/moderator', label: 'Moderator', icon: Flag, roles: ['MODERATOR', 'ADMIN'] },
  { href: '/admin', label: 'Admin', icon: Users, roles: ['ADMIN'] },
  ]

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role || '')
  )

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <FileQuestion className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                ELAB AI
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <Badge variant={isAdmin ? 'danger' : isModerator ? 'warning' : 'default'} size="sm">
                {user?.role}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center px-3 py-2 text-xs font-medium
                  ${isActive ? 'text-blue-600' : 'text-gray-600'}
                `}
              >
                <Icon className="h-6 w-6 mb-1" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
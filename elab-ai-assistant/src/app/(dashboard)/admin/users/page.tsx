// src/app/(dashboard)/admin/users/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Shield, Ban, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  status: string
  verified: boolean
  createdAt: string
  lastLogin: string | null
  _count: {
    conversations: number
    ratings: number
  }
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Da li ste sigurni da želite da promenite ulogu?`)) return

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      await fetchUsers()
    } catch (error) {
      console.error('Error changing role:', error)
    }
  }

  const handleBlockUser = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
    
    if (!confirm(`Da li ste sigurni da želite da ${newStatus === 'BLOCKED' ? 'blokirate' : 'odblokirate'} korisnika?`)) return

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchUsers()
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete korisnika? Ova akcija je nepovratna.')) return

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      await fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upravljanje korisnicima</h1>
        <p className="text-gray-600 mt-1">
          Pregledajte i upravljajte svim korisnicima sistema
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uloga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aktivnost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Registrovan: {new Date(user.createdAt).toLocaleDateString('sr-RS')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          user.role === 'ADMIN' ? 'danger' :
                          user.role === 'MODERATOR' ? 'warning' : 'default'
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          user.status === 'ACTIVE' ? 'success' :
                          user.status === 'BLOCKED' ? 'danger' : 'warning'
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <p>{user._count.conversations} konverzacija</p>
                        <p>{user._count.ratings} ocena</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="USER">USER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        
                        <Button
                          size="sm"
                          variant={user.status === 'BLOCKED' ? 'secondary' : 'danger'}
                          onClick={() => handleBlockUser(user.id, user.status)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
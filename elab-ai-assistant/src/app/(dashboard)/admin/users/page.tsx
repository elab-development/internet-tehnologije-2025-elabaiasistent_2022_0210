// src/app/(dashboard)/admin/users/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Card, { CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Ban, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Greška pri učitavanju korisnika')
      }
      
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return

    if (!confirm(`Da li ste sigurni da želite da promenite ulogu u ${newRole}?`)) {
      return
    }

    setProcessingUserId(userId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri promeni uloge')
      }

      setSuccess('Uloga uspešno promenjena!')
      await fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessingUserId(null)
    }
  }

  const handleBlockUser = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
    const action = newStatus === 'BLOCKED' ? 'blokirate' : 'odblokirate'

    if (!confirm(`Da li ste sigurni da želite da ${action} korisnika?`)) {
      return
    }

    setProcessingUserId(userId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          reason: newStatus === 'BLOCKED' ? 'Blokirano od strane administratora' : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri promeni statusa')
      }

      setSuccess(`Korisnik uspešno ${newStatus === 'BLOCKED' ? 'blokiran' : 'odblokiran'}!`)
      await fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessingUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Da li ste sigurni da želite da obrišete korisnika:\n${email}\n\nOva akcija je nepovratna!`)) {
      return
    }

    setProcessingUserId(userId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri brisanju korisnika')
      }

      setSuccess('Korisnik uspešno obrisan!')
      await fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessingUserId(null)
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

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uloga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktivnost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Registrovan: {new Date(user.createdAt).toLocaleDateString('sr-RS')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, user.role, e.target.value)}
                        disabled={processingUserId === user.id}
                        className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="USER">USER</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          user.status === 'ACTIVE' ? 'success' :
                          user.status === 'BLOCKED' ? 'danger' : 'warning'
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <p>{user._count.conversations} konverzacija</p>
                        <p>{user._count.ratings} ocena</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={user.status === 'BLOCKED' ? 'secondary' : 'danger'}
                          onClick={() => handleBlockUser(user.id, user.status)}
                          disabled={processingUserId === user.id}
                          title={user.status === 'BLOCKED' ? 'Odblokiraj' : 'Blokiraj'}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={processingUserId === user.id}
                          title="Obriši korisnika"
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

      {users.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Nema korisnika u sistemu</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
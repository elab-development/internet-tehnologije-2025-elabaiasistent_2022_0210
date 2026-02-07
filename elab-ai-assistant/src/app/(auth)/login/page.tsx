// src/app/(auth)/login/page.tsx

'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Došlo je do greške. Pokušajte ponovo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ELAB AI Assistant
          </h1>
          <p className="text-gray-600">
            Prijavite se na vaš nalog
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prijava</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Input
                label="Email adresa"
                type="email"
                placeholder="student@fon.bg.ac.rs"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />

              <Input
                label="Lozinka"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                Prijavi se
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Nemate nalog?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Registrujte se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test kredencijali */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium mb-1">Test nalozi:</p>
          <p className="text-xs text-yellow-700">Admin: admin@fon.bg.ac.rs / Admin123!</p>
          <p className="text-xs text-yellow-700">Moderator: moderator@fon.bg.ac.rs / Mod123!</p>
          <p className="text-xs text-yellow-700">Student: student1@fon.bg.ac.rs / Student123!</p>
        </div>
      </div>
    </div>
  )
}
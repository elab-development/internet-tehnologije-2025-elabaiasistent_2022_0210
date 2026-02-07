// src/app/(auth)/register/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.endsWith('@fon.bg.ac.rs')) {
      newErrors.email = 'Morate koristiti FON email adresu'
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Lozinka mora imati najmanje 8 karaktera'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Lozinke se ne poklapaju'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          // Zod validation errors
          const zodErrors: Record<string, string> = {}
          data.details.forEach((err: any) => {
            zodErrors[err.path[0]] = err.message
          })
          setErrors(zodErrors)
        } else {
          setErrors({ general: data.error || 'Greška pri registraciji' })
        }
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch (err) {
      setErrors({ general: 'Došlo je do greške. Pokušajte ponovo.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registracija uspešna!
            </h2>
            <p className="text-gray-600 mb-4">
              Proverite vaš email inbox za verifikacioni link.
            </p>
            <p className="text-sm text-gray-500">
              Preusmeravanje na login stranicu...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ELAB AI Assistant
          </h1>
          <p className="text-gray-600">
            Kreirajte novi nalog
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registracija</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <Input
                label="Email adresa"
                type="email"
                placeholder="student@fon.bg.ac.rs"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                helperText="Morate koristiti FON email (@fon.bg.ac.rs)"
                required
                disabled={isLoading}
              />

              <Input
                label="Lozinka"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                helperText="Minimum 8 karaktera, uključujući velika/mala slova, brojeve i specijalne karaktere"
                required
                disabled={isLoading}
              />

              <Input
                label="Potvrdite lozinku"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
                disabled={isLoading}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                Registruj se
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Već imate nalog?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Prijavite se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
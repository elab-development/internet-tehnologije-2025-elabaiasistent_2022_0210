// src/app/unauthorized/page.tsx

import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Nemate dozvolu
        </h2>
        <p className="text-gray-600 mb-8">
          Nemate potrebne privilegije za pristup ovoj stranici.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Nazad na Dashboard
        </Link>
      </div>
    </div>
  )
}
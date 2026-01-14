// src/app/verify-email-required/page.tsx

export default function VerifyEmailRequiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-lg shadow-md">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Verifikujte email
        </h1>
        <p className="text-gray-600 mb-6">
          Morate verifikovati vašu email adresu pre nego što nastavite.
          Proverite inbox za verifikacioni link.
        </p>
        <p className="text-sm text-gray-500">
          Niste dobili email?{' '}
          <button className="text-blue-600 hover:underline">
            Pošalji ponovo
          </button>
        </p>
      </div>
    </div>
  )
}
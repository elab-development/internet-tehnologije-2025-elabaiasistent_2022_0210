// src/app/docs/page.tsx

'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dinamički import Swagger UI (client-side only)
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI url="/api/docs" />
    </div>
  )
}
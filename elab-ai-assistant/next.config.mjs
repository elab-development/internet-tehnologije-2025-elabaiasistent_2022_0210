// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 🔹 Dodaj Prisma u external pakete
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  
  // 🔹 Preskoči TypeScript greške tokom build-a (opciono)
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  
  // 🔹 Preskoči ESLint tokom build-a (opciono, za brži build)
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
}

export default nextConfig
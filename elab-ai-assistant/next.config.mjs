// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' output needed for Docker, not for Vercel.
  // Set BUILD_STANDALONE=true in Docker environment to enable.
  ...(process.env.BUILD_STANDALONE === 'true' && { output: 'standalone' }),

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 🔹 Dodaj eksterne pakete koji se ne bundluju
    serverComponentsExternalPackages: [
      '@prisma/client',
      'prisma',
      'chromadb',
      '@xenova/transformers',
      'onnxruntime-node',
    ],
  },
  
  // 🔹 Webpack konfiguracija - reši ChromaDB probleme
  webpack: (config, { isServer }) => {
    // CLIENT-SIDE: Blokiraj ChromaDB i related pakete
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        // ChromaDB specifični
        'chromadb': false,
        '@chroma-core/default-embed': false,
        'onnxruntime-node': false,
        '@xenova/transformers': false,
      }

      // Dodaj aliase da spreči pokušaj učitavanja na client-side
      config.resolve.alias = {
        ...config.resolve.alias,
        'chromadb': false,
        '@chroma-core/default-embed': false,
        'onnxruntime-node': false,
      }
    }

    // SERVER-SIDE: Dodaj eksterne module
    if (isServer) {
      config.externals = [
        ...(config.externals || []), 
        'chromadb', 
        'onnxruntime-node',
        '@xenova/transformers',
      ]
    }

    // Ignoriši warnings
    config.ignoreWarnings = [
      { module: /node_modules\/chromadb/ },
      { module: /node_modules\/@xenova/ },
      { module: /node_modules\/onnxruntime-node/ },
      /Critical dependency: the request of a dependency is an expression/,
    ]

    return config
  },
}

export default nextConfig
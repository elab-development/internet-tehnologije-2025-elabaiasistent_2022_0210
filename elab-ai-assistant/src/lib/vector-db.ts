// src/lib/vector-db.ts

// 🔹 ENSURE this runs ONLY on server
if (typeof window !== 'undefined') {
  throw new Error('VectorDB can only be used on the server side')
}

import { ChromaClient, Collection, IEmbeddingFunction } from 'chromadb'
import { OllamaEmbedding } from './embeddings'

/**
 * Custom embedding function wrapper for ChromaDB
 * Since we generate embeddings externally with Ollama, this is a no-op
 */
class CustomEmbeddingFunction implements IEmbeddingFunction {
  async generate(texts: string[]): Promise<number[][]> {
    // Return empty arrays - we provide embeddings externally
    return texts.map(() => [])
  }
}

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000'
const COLLECTION_NAME = 'elab_documents'

/**
 * Tip za dokument u vektorskoj bazi
 */
export interface VectorDocument {
  id: string
  content: string
  embedding?: number[]
  metadata: {
    url: string
    title: string
    sourceType: string
    chunkIndex: number
    crawledAt: string
  }
}

/**
 * Tip za search rezultat
 */
export interface SearchResult {
  id: string
  content: string
  metadata: VectorDocument['metadata']
  distance: number
  relevanceScore: number
}

/**
 * Vector Database Service (ChromaDB wrapper)
 * 
 * FIX: Zamenjen SimpleEmbedding (TF-IDF) sa OllamaEmbedding.
 * 
 * Problem sa SimpleEmbedding:
 * - TF-IDF model mora biti treniran na svim dokumentima pre upotrebe
 * - Trening se čuvao samo u memoriji (in-memory Map)
 * - Svaki restart servera resetuje singleton → prazan rečnik → embed() vraća []
 * - ChromaDB odbija prazan embedding niz → "Interna greška servera"
 * 
 * Zašto OllamaEmbedding rešava problem:
 * - Ollama generiše embedding na osnovu natrenirane neuronske mreže
 * - Nema in-memory stanja koje se gubi pri restartu
 * - Isti model garantuje konzistentne vektore i pri indexiranju i pri pretrazi
 */
export class VectorDB {
  private client: ChromaClient
  private collection: Collection | null = null
  private embeddingService: OllamaEmbedding
  private embeddingFunction: CustomEmbeddingFunction

  constructor() {
    this.client = new ChromaClient({ path: CHROMA_URL })
    // Koristimo nomic-embed-text — pull sa: ollama pull nomic-embed-text
    this.embeddingService = new OllamaEmbedding(
      process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      'nomic-embed-text'
    )
    this.embeddingFunction = new CustomEmbeddingFunction()
  }

  /**
   * Inicijalizuje kolekciju
   */
    async initialize() {
      try {
        this.collection = await this.client.getCollection({
          name: COLLECTION_NAME,
          embeddingFunction: this.embeddingFunction,
        })
        console.log(`✅ ChromaDB collection loaded: ${COLLECTION_NAME}`)
      } catch {
        this.collection = await this.client.createCollection({
          name: COLLECTION_NAME,
          embeddingFunction: this.embeddingFunction,
          metadata: {
            description: 'ELAB AI Assistant document embeddings',
            'hnsw:space': 'cosine'  // ← ovo je ključna izmena
          },
        })
        console.log(`✅ ChromaDB collection created: ${COLLECTION_NAME}`)
      }
    }

  /**
   * Dodaje dokumente u vektorsku bazu
   */
  async addDocuments(documents: VectorDocument[]): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.')
    }

    if (documents.length === 0) return

    console.log(`📥 Adding ${documents.length} documents to ChromaDB...`)

    const ids = documents.map(doc => doc.id)
    const contents = documents.map(doc => doc.content)
    const metadatas = documents.map(doc => ({
      url: doc.metadata.url,
      title: doc.metadata.title,
      sourceType: doc.metadata.sourceType,
      chunkIndex: doc.metadata.chunkIndex.toString(),
      crawledAt: doc.metadata.crawledAt,
    }))

    // Generiši embeddings koristeći Ollama (batch)
    console.log('🔄 Generating embeddings via Ollama...')
    const embeddings = await this.embeddingService.embedBatch(contents)

    await this.collection.add({
      ids,
      embeddings,
      documents: contents,
      metadatas,
    })

    console.log(`✅ ${documents.length} documents added to ChromaDB`)
  }

  /**
   * Pretražuje dokumente (semantic search)
   */
  async search(
    query: string,
    options: {
      limit?: number
      sourceType?: string
      minRelevance?: number
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error('Collection not initialized')
    }

    const { limit = 5, sourceType, minRelevance = 0.3 } = options

    console.log(`🔍 Searching for: "${query}"`)

    // Generiši embedding za query — sada uvek radi, nema in-memory zavisnosti
    const queryEmbedding = await this.embeddingService.embed(query)

    const where = sourceType ? { sourceType } : undefined

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where,
    })

    // 🔴 PRIVREMENI DEBUG 
console.log('RAW IDs:', results.ids)
console.log('RAW distances:', results.distances)
console.log('RAW documents preview:', results.documents?.[0]?.[0]?.slice(0, 100))

    const searchResults: SearchResult[] = []

    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const distance = results.distances?.[0]?.[i] || 1
        const relevanceScore = 1 / (1 + distance)


        if (relevanceScore >= minRelevance) {
          searchResults.push({
            id: results.ids[0][i],
            content: results.documents?.[0]?.[i] as string || '',
            metadata: {
              url: results.metadatas?.[0]?.[i]?.url as string || '',
              title: results.metadatas?.[0]?.[i]?.title as string || '',
              sourceType: results.metadatas?.[0]?.[i]?.sourceType as string || '',
              chunkIndex: parseInt(results.metadatas?.[0]?.[i]?.chunkIndex as string || '0'),
              crawledAt: results.metadatas?.[0]?.[i]?.crawledAt as string || '',
            },
            distance,
            relevanceScore,
          })
        }
      }
    }

    console.log(`✅ Found ${searchResults.length} relevant results`)
    return searchResults
  }

  /**
   * Briše sve dokumente iz kolekcije
   */
  async clear(): Promise<void> {
    if (!this.collection) return

    await this.client.deleteCollection({ name: COLLECTION_NAME })
    await this.initialize()
    console.log('✅ Collection cleared')
  }

  /**
   * Vraća broj dokumenata u kolekciji
   */
  async count(): Promise<number> {
    if (!this.collection) return 0
    return await this.collection.count()
  }

  /**
   * Vraća statistiku kolekcije
   */
  async getStats() {
    const count = await this.count()
    return {
      collectionName: COLLECTION_NAME,
      totalDocuments: count,
      chromaUrl: CHROMA_URL,
    }
  }
}

/**
 * Singleton instanca VectorDB
 */
let vectorDBInstance: VectorDB | null = null

export async function getVectorDB(): Promise<VectorDB> {
  if (!vectorDBInstance) {
    vectorDBInstance = new VectorDB()
    await vectorDBInstance.initialize()
  }
  return vectorDBInstance
}
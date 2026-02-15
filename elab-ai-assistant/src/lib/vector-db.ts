// src/lib/vector-db.ts

import { ChromaClient, Collection } from 'chromadb'
import { SimpleEmbedding } from './embeddings'

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
 */
export class VectorDB {
  private client: ChromaClient
  private collection: Collection | null = null
  private embeddingService: SimpleEmbedding

  constructor() {
    this.client = new ChromaClient({ path: CHROMA_URL })
    this.embeddingService = new SimpleEmbedding()
  }

  /**
   * Inicijalizuje kolekciju
   */
  async initialize() {
    try {
      // Pokušaj da učitaš postojeću kolekciju
      this.collection = await this.client.getCollection({
        name: COLLECTION_NAME,
      })
      console.log(`✅ ChromaDB collection loaded: ${COLLECTION_NAME}`)
    } catch {
      // Ako ne postoji, kreiraj novu
      this.collection = await this.client.createCollection({
        name: COLLECTION_NAME,
        metadata: { description: 'ELAB AI Assistant document embeddings' },
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

    // Pripremi podatke za ChromaDB
    const ids = documents.map(doc => doc.id)
    const contents = documents.map(doc => doc.content)
    const metadatas = documents.map(doc => ({
      url: doc.metadata.url,
      title: doc.metadata.title,
      sourceType: doc.metadata.sourceType,
      chunkIndex: doc.metadata.chunkIndex.toString(),
      crawledAt: doc.metadata.crawledAt,
    }))

    // Generiši embeddings
    console.log('🔄 Generating embeddings...')
    
    // Treniraj embedding model na svim dokumentima (za TF-IDF)
    this.embeddingService.train(contents)
    
    const embeddings = contents.map(content => 
      this.embeddingService.embed(content)
    )

    // Dodaj u ChromaDB
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

    // Generiši embedding za query
    const queryEmbedding = this.embeddingService.embed(query)

    // Pripremi filter
    const where = sourceType ? { sourceType } : undefined

    // Pretraži ChromaDB
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where,
    })

    // Formatiraj rezultate
    const searchResults: SearchResult[] = []

    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const distance = results.distances?.[0]?.[i] || 1
        const relevanceScore = 1 - distance // Konvertuj distance u similarity

        // Filtriraj po minimalnoj relevantnosti
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

    const result = await this.collection.count()
    return result
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
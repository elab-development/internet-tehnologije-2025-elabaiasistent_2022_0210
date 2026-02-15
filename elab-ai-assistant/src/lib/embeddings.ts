// src/lib/embeddings.ts

/**
 * Embedding Service
 * 
 * Za sada koristimo jednostavan TF-IDF pristup.
 * U produkciji bi koristili:
 * - OpenAI Embeddings API
 * - HuggingFace Transformers (sentence-transformers)
 * - Ollama embeddings (lokalno)
 */

/**
 * Jednostavan TF-IDF embedding (mock za development)
 * U produkciji zaменити са правим embedding modelom
 */
export class SimpleEmbedding {
  private vocabulary: Map<string, number> = new Map()
  private idf: Map<string, number> = new Map()
  private documents: string[] = []

  /**
   * Tokenizuje tekst
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2) // Ignoriši kratke reči
  }

  /**
   * Izračunava TF (Term Frequency)
   */
  private calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>()
    const totalTokens = tokens.length

    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1)
    }

    // Normalizuj
    for (const [token, count] of tf.entries()) {
      tf.set(token, count / totalTokens)
    }

    return tf
  }

  /**
   * Trenira model na korpusu dokumenata
   */
  public train(documents: string[]) {
    this.documents = documents
    const documentFrequency = new Map<string, number>()

    // Izračunaj document frequency
    for (const doc of documents) {
      const tokens = new Set(this.tokenize(doc))
      for (const token of tokens) {
        documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1)
      }
    }

    // Izračunaj IDF
    const totalDocs = documents.length
    for (const [token, df] of documentFrequency.entries()) {
      this.idf.set(token, Math.log(totalDocs / df))
    }

    // Kreiraj vocabulary
    let index = 0
    for (const token of documentFrequency.keys()) {
      this.vocabulary.set(token, index++)
    }

    console.log(`✅ Embedding model trained on ${totalDocs} documents`)
    console.log(`📊 Vocabulary size: ${this.vocabulary.size}`)
  }

  /**
   * Generiše embedding vektor za tekst
   */
  public embed(text: string): number[] {
    const tokens = this.tokenize(text)
    const tf = this.calculateTF(tokens)
    
    // Kreiraj vektor (TF-IDF)
    const vector = new Array(this.vocabulary.size).fill(0)

    for (const [token, tfValue] of tf.entries()) {
      const index = this.vocabulary.get(token)
      const idfValue = this.idf.get(token) || 0

      if (index !== undefined) {
        vector[index] = tfValue * idfValue
      }
    }

    // Normalizuj vektor (L2 normalizacija)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude
      }
    }

    return vector
  }

  /**
   * Izračunava cosine similarity između dva vektora
   */
  public cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0

    let dotProduct = 0
    let mag1 = 0
    let mag2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      mag1 += vec1[i] * vec1[i]
      mag2 += vec2[i] * vec2[i]
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }
}

/**
 * Wrapper za Ollama embeddings (za produkciju)
 * Zahteva pokrenut Ollama servis sa embedding modelom
 */
export class OllamaEmbedding {
  private baseUrl: string
  private model: string

  constructor(baseUrl = 'http://localhost:11434', model = 'nomic-embed-text') {
    this.baseUrl = baseUrl
    this.model = model
  }

  /**
   * Generiše embedding koristeći Ollama API
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error('❌ Ollama embedding error:', error)
      throw error
    }
  }

  /**
   * Batch embedding za više tekstova
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = []

    for (const text of texts) {
      const embedding = await this.embed(text)
      embeddings.push(embedding)
    }

    return embeddings
  }
}

/**
 * Factory funkcija za kreiranje embedding service-a
 */
export function createEmbeddingService(): SimpleEmbedding | OllamaEmbedding {
  // Za sada koristimo SimpleEmbedding
  // U Commit 6 ćemo dodati Ollama integraciju
  return new SimpleEmbedding()
}
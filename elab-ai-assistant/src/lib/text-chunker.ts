// src/lib/text-chunker.ts

/**
 * Tip za text chunk
 */
export interface TextChunk {
  content: string
  index: number
  metadata: {
    startChar: number
    endChar: number
    wordCount: number
  }
}

/**
 * Konfiguracija za chunking
 */
export interface ChunkerConfig {
  chunkSize?: number // Broj karaktera po chunk-u (default: 512)
  chunkOverlap?: number // Preklapanje između chunk-ova (default: 50)
  minChunkSize?: number // Minimalna veličina chunk-a (default: 100)
}

const DEFAULT_CONFIG: ChunkerConfig = {
  chunkSize: 512,
  chunkOverlap: 50,
  minChunkSize: 100,
}

/**
 * Text Chunker klasa
 */
export class TextChunker {
  private config: ChunkerConfig

  constructor(config: Partial<ChunkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Deli tekst na rečenice (jednostavna verzija)
   */
  private splitIntoSentences(text: string): string[] {
    // Podeli po tačkama, upitnicima, uzvicima
    const sentences = text
      .split(/([.!?]+\s+)/)
      .filter(s => s.trim().length > 0)

    const result: string[] = []
    let current = ''

    for (let i = 0; i < sentences.length; i++) {
      current += sentences[i]
      
      // Ako je završetak rečenice
      if (/[.!?]+\s*$/.test(current)) {
        result.push(current.trim())
        current = ''
      }
    }

    if (current.trim()) {
      result.push(current.trim())
    }

    return result
  }

  /**
   * Kreira chunk-ove iz teksta
   */
  public createChunks(text: string): TextChunk[] {
    const chunkSize = this.config.chunkSize || 512
    const chunkOverlap = this.config.chunkOverlap || 50
    const minChunkSize = this.config.minChunkSize || 100

    const chunks: TextChunk[] = []
    const sentences = this.splitIntoSentences(text)

    let currentChunk = ''
    let currentStartChar = 0
    let chunkIndex = 0

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]

      // Ako dodavanje rečenice premaši chunk size
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        // Sačuvaj trenutni chunk
        if (currentChunk.length >= minChunkSize) {
          chunks.push({
            content: currentChunk.trim(),
            index: chunkIndex++,
            metadata: {
              startChar: currentStartChar,
              endChar: currentStartChar + currentChunk.length,
              wordCount: currentChunk.split(/\s+/).length,
            },
          })
        }

        // Kreiraj overlap za sledeći chunk
        const words = currentChunk.split(/\s+/)
        const overlapWords = words.slice(-Math.floor(chunkOverlap / 5)) // ~5 chars po reči
        currentChunk = overlapWords.join(' ') + ' '
        currentStartChar += currentChunk.length - overlapWords.join(' ').length
      }

      currentChunk += sentence + ' '
    }

    // Dodaj poslednji chunk
    if (currentChunk.trim().length >= minChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        metadata: {
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
          wordCount: currentChunk.split(/\s+/).length,
        },
      })
    }

    return chunks
  }

  /**
   * Kreira chunk-ove sa fiksnom veličinom (token-based)
   */
  public createFixedChunks(text: string): TextChunk[] {
    const chunkSize = this.config.chunkSize || 512
    const chunkOverlap = this.config.chunkOverlap || 50

    const chunks: TextChunk[] = []
    let index = 0

    for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
      const chunk = text.slice(i, i + chunkSize)
      
      if (chunk.length >= (this.config.minChunkSize || 100)) {
        chunks.push({
          content: chunk,
          index: index++,
          metadata: {
            startChar: i,
            endChar: i + chunk.length,
            wordCount: chunk.split(/\s+/).length,
          },
        })
      }
    }

    return chunks
  }

  /**
   * Vraća statistiku chunking-a
   */
  public getStats(chunks: TextChunk[]) {
    return {
      totalChunks: chunks.length,
      averageChunkSize:
        chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length,
      averageWordCount:
        chunks.reduce((sum, chunk) => sum + chunk.metadata.wordCount, 0) / chunks.length,
      totalCharacters: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0),
    }
  }
}
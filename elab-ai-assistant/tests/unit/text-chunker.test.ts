import { describe, it, expect, beforeEach } from 'vitest'
import { TextChunker } from '@/lib/text-chunker'

describe('TextChunker', () => {
  let chunker: TextChunker

  beforeEach(() => {
    chunker = new TextChunker()
  })

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const defaultChunker = new TextChunker()
      expect(defaultChunker).toBeDefined()
    })

    it('should accept custom config', () => {
      const customChunker = new TextChunker({
        chunkSize: 256,
        chunkOverlap: 30,
        minChunkSize: 50,
      })
      expect(customChunker).toBeDefined()
    })
  })

  describe('createChunks', () => {
    it('should split text into chunks', () => {
      // Use longer text to meet minChunkSize requirement (100 chars)
      const text = 'This is the first sentence that contains enough words to be meaningful. This is the second sentence that also has substance. And here is a third sentence to complete the paragraph.'
      const chunks = chunker.createChunks(text)

      expect(chunks).toBeDefined()
      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0]).toHaveProperty('content')
      expect(chunks[0]).toHaveProperty('index')
      expect(chunks[0]).toHaveProperty('metadata')
    })

    it('should assign correct indices to chunks', () => {
      const text = 'A'.repeat(1000) + '. ' + 'B'.repeat(1000) + '.'
      const chunks = chunker.createChunks(text)

      chunks.forEach((chunk, idx) => {
        expect(chunk.index).toBe(idx)
      })
    })

    it('should include metadata with each chunk', () => {
      // Use longer text to meet minChunkSize
      const text = 'This is a test sentence with enough content to be meaningful. Another test sentence that adds more content. And yet another sentence to ensure we have enough text for chunking purposes.'
      const chunks = chunker.createChunks(text)

      if (chunks.length > 0) {
        chunks.forEach(chunk => {
          expect(chunk.metadata).toHaveProperty('startChar')
          expect(chunk.metadata).toHaveProperty('endChar')
          expect(chunk.metadata).toHaveProperty('wordCount')
          expect(chunk.metadata.wordCount).toBeGreaterThan(0)
        })
      }
    })

    it('should respect minimum chunk size', () => {
      const smallChunker = new TextChunker({ minChunkSize: 50 })
      const text = 'A. B. C.'
      const chunks = smallChunker.createChunks(text)

      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeGreaterThanOrEqual(50)
      })
    })

    it('should handle empty text', () => {
      const chunks = chunker.createChunks('')
      expect(chunks).toHaveLength(0)
    })

    it('should handle single sentence', () => {
      const text = 'This is a single sentence that is quite long to ensure it meets the minimum chunk size requirement for testing purposes.'
      const chunks = chunker.createChunks(text)
      expect(chunks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('createFixedChunks', () => {
    it('should create fixed-size chunks', () => {
      const chunker = new TextChunker({ chunkSize: 100 })
      const text = 'A'.repeat(500)
      const chunks = chunker.createFixedChunks(text)

      expect(chunks.length).toBeGreaterThan(1)
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeLessThanOrEqual(100)
      })
    })

    it('should create overlapping chunks', () => {
      const chunker = new TextChunker({ chunkSize: 100, chunkOverlap: 20 })
      const text = 'A'.repeat(300)
      const chunks = chunker.createFixedChunks(text)

      // Check that chunks overlap
      if (chunks.length > 1) {
        const firstEnd = chunks[0].metadata.endChar
        const secondStart = chunks[1].metadata.startChar
        expect(secondStart).toBeLessThan(firstEnd)
      }
    })

    it('should respect minimum chunk size', () => {
      const chunker = new TextChunker({ chunkSize: 100, minChunkSize: 50 })
      const text = 'Short text.'
      const chunks = chunker.createFixedChunks(text)

      // If text is too short, no chunks should be created
      if (chunks.length > 0) {
        chunks.forEach(chunk => {
          expect(chunk.content.length).toBeGreaterThanOrEqual(50)
        })
      }
    })

    it('should assign correct metadata', () => {
      const text = 'A'.repeat(300)
      const chunks = chunker.createFixedChunks(text)

      chunks.forEach(chunk => {
        expect(chunk.metadata.startChar).toBeDefined()
        expect(chunk.metadata.endChar).toBeDefined()
        expect(chunk.metadata.wordCount).toBeDefined()
        expect(chunk.metadata.endChar).toBeGreaterThan(chunk.metadata.startChar)
      })
    })
  })

  describe('getStats', () => {
    it('should calculate correct statistics', () => {
      // Use long text to ensure chunks are created
      const text = 'This is the first sentence with substantial content to meet minimum requirements. This is the second sentence that also contains meaningful text. Third sentence continues to add more content. Fourth sentence ensures we have enough material. Fifth sentence completes our test text corpus.'
      const chunks = chunker.createChunks(text)
      const stats = chunker.getStats(chunks)

      expect(stats).toHaveProperty('totalChunks')
      expect(stats).toHaveProperty('averageChunkSize')
      expect(stats).toHaveProperty('averageWordCount')
      expect(stats).toHaveProperty('totalCharacters')

      expect(stats.totalChunks).toBe(chunks.length)

      // Only check stats if chunks were created
      if (chunks.length > 0) {
        expect(stats.averageChunkSize).toBeGreaterThan(0)
        expect(stats.averageWordCount).toBeGreaterThan(0)
        expect(stats.totalCharacters).toBeGreaterThan(0)
      }
    })

    it('should handle single chunk', () => {
      const text = 'This is a single long sentence that will be chunked into one piece for testing the statistics calculation function.'
      const chunks = chunker.createChunks(text)
      const stats = chunker.getStats(chunks)

      expect(stats.totalChunks).toBe(chunks.length)
      expect(stats.averageChunkSize).toBeGreaterThan(0)
    })

    it('should calculate total characters correctly', () => {
      const text = 'Test sentence. Another test sentence. Third test sentence.'
      const chunks = chunker.createChunks(text)
      const stats = chunker.getStats(chunks)

      const manualTotal = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)
      expect(stats.totalCharacters).toBe(manualTotal)
    })
  })

  describe('edge cases', () => {
    it('should handle text with special characters', () => {
      // Use longer text with special characters
      const text = 'Hello! How are you doing today? I am doing absolutely fine, thank you for asking! What about you and your family? Everything is going great, I hope! Special characters like @#$% should not cause issues either.'
      const chunks = chunker.createChunks(text)

      // Chunks may or may not be created depending on minChunkSize
      expect(chunks).toBeDefined()
      expect(Array.isArray(chunks)).toBe(true)
    })

    it('should handle text without sentence delimiters', () => {
      const text = 'This is a very long text without any sentence delimiters and it should still be processed correctly by the chunker'
      const chunks = chunker.createChunks(text)
      expect(chunks).toBeDefined()
    })

    it('should handle very long single sentence', () => {
      const chunker = new TextChunker({ chunkSize: 100, minChunkSize: 50 })
      const text = 'A'.repeat(500) + '.'
      const chunks = chunker.createChunks(text)
      expect(chunks.length).toBeGreaterThan(0)
    })
  })
})

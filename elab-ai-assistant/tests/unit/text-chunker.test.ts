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
      const text = 'First sentence. Second sentence. Third sentence.'
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
      const text = 'This is a test sentence. Another test sentence.'
      const chunks = chunker.createChunks(text)

      chunks.forEach(chunk => {
        expect(chunk.metadata).toHaveProperty('startChar')
        expect(chunk.metadata).toHaveProperty('endChar')
        expect(chunk.metadata).toHaveProperty('wordCount')
        expect(chunk.metadata.wordCount).toBeGreaterThan(0)
      })
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
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.'
      const chunks = chunker.createChunks(text)
      const stats = chunker.getStats(chunks)

      expect(stats).toHaveProperty('totalChunks')
      expect(stats).toHaveProperty('averageChunkSize')
      expect(stats).toHaveProperty('averageWordCount')
      expect(stats).toHaveProperty('totalCharacters')

      expect(stats.totalChunks).toBe(chunks.length)
      expect(stats.averageChunkSize).toBeGreaterThan(0)
      expect(stats.averageWordCount).toBeGreaterThan(0)
      expect(stats.totalCharacters).toBeGreaterThan(0)
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
      const text = 'Hello! How are you? I am fine. What about you?'
      const chunks = chunker.createChunks(text)
      expect(chunks.length).toBeGreaterThan(0)
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

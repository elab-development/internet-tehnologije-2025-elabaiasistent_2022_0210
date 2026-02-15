// scripts/test-crawler.ts

import { WebCrawler } from '../src/lib/crawler'
import { TextChunker } from '../src/lib/text-chunker'

async function testCrawler() {
  console.log('🧪 Testing Web Crawler...\n')

  const crawler = new WebCrawler({
    maxDepth: 1,
    maxPages: 5,
    timeout: 10000,
  })

  const chunker = new TextChunker({
    chunkSize: 512,
    chunkOverlap: 50,
  })

  // Test URL (možeš zameniti sa pravim ELAB URL-om)
  const testUrl = 'https://elab.fon.bg.ac.rs'

  try {
    const documents = await crawler.crawl(testUrl)

    console.log('\n📊 Crawl Statistics:')
    console.log(crawler.getStats())

    console.log('\n📄 Sample Document:')
    if (documents.length > 0) {
      const doc = documents[0]
      console.log('Title:', doc.title)
      console.log('URL:', doc.url)
      console.log('Content length:', doc.content.length)
      console.log('Content preview:', doc.content.slice(0, 200) + '...')

      console.log('\n🔪 Creating chunks...')
      const chunks = chunker.createChunks(doc.content)
      
      console.log('\n📊 Chunk Statistics:')
      console.log(chunker.getStats(chunks))

      console.log('\n📦 Sample Chunk:')
      if (chunks.length > 0) {
        console.log('Chunk #0:', chunks[0].content.slice(0, 200) + '...')
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCrawler()
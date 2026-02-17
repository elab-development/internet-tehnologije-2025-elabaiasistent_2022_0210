// scripts/index-documents.ts
//
// Pokreni sa: npx tsx scripts/index-documents.ts
//
// Šta radi:
// 1. Crawluje ELAB sajtove
// 2. Seče tekst na chunkove
// 3. Generiše Ollama embeddings za svaki chunk
// 4. Ubacuje sve u ChromaDB

import { WebCrawler } from '../src/lib/crawler'
import { TextChunker } from '../src/lib/text-chunker'
import { getVectorDB, VectorDocument } from '../src/lib/vector-db'
import { randomUUID } from 'crypto'

const START_URLS = [
  'https://elab.fon.bg.ac.rs',
  'https://bc.elab.fon.bg.ac.rs',
  'https://ebt.rs',
]

const CRAWLER_CONFIG = {
  maxDepth: 2,
  maxPages: 100,
  timeout: 15000,
}

const CHUNKER_CONFIG = {
  chunkSize: 512,
  chunkOverlap: 50,
}

async function main() {
  console.log('🚀 ELAB AI Indexing Pipeline\n')

  // ─── Korak 1: Crawlovanje ───────────────────────────────────────────────────
  console.log('═══ KORAK 1: Crawlovanje ═══')
  const crawler = new WebCrawler(CRAWLER_CONFIG)
  const documents = await crawler.crawlMultiple(START_URLS)

  console.log('\n📊 Crawler statistika:')
  console.log(crawler.getStats())

  if (documents.length === 0) {
    console.error('❌ Crawler nije pronašao nijedan dokument. Proveri mrežu i URL-ove.')
    process.exit(1)
  }

  // ─── Korak 2: Chunking ─────────────────────────────────────────────────────
  console.log('\n═══ KORAK 2: Chunking teksta ═══')
  const chunker = new TextChunker(CHUNKER_CONFIG)
  const vectorDocuments: VectorDocument[] = []

  for (const doc of documents) {
    const chunks = chunker.createChunks(doc.content)

    for (const chunk of chunks) {
      vectorDocuments.push({
        id: randomUUID(),
        content: chunk.content,
        metadata: {
          url: doc.url,
          title: doc.title,
          sourceType: doc.metadata.sourceType,
          chunkIndex: chunk.index ?? 0,
          crawledAt: doc.metadata.crawledAt.toISOString(),
        },
      })
    }
  }

  console.log(`✅ Kreirano ${vectorDocuments.length} chunkova od ${documents.length} stranica`)

  if (vectorDocuments.length === 0) {
    console.error('❌ Nema chunkova za indexiranje.')
    process.exit(1)
  }

  // ─── Korak 3: Inicijalizacija ChromaDB ─────────────────────────────────────
  console.log('\n═══ KORAK 3: Čišćenje stare kolekcije ═══')
  const db = await getVectorDB()

  // Briši stare podatke kako bi izbegli mešanje starih TF-IDF
  // i novih Ollama embeddinga (nekompatibilne dimenzije)
  await db.clear()
  console.log('✅ Stara kolekcija obrisana')

  // ─── Korak 4: Embeddings + Indexiranje ─────────────────────────────────────
  // Ollama embedding je spor za veliki broj chunkova pa radimo u batchevima
  // kako bismo videli progress i izbegli timeout
  console.log('\n═══ KORAK 4: Generisanje embeddings i indexiranje ═══')
  console.log('⚠️  Ovo može potrajati — Ollama generiše embedding za svaki chunk\n')

  const BATCH_SIZE = 10
  let indexed = 0

  for (let i = 0; i < vectorDocuments.length; i += BATCH_SIZE) {
    const batch = vectorDocuments.slice(i, i + BATCH_SIZE)
    
    try {
      await db.addDocuments(batch)
      indexed += batch.length
      console.log(`📥 Indexirano: ${indexed}/${vectorDocuments.length} chunkova`)
    } catch (error: any) {
      console.error(`❌ Greška pri indexiranju batch-a ${i}–${i + BATCH_SIZE}:`, error.message)
      // Nastavi sa sledećim batch-em umesto da staneš
    }
  }

  // ─── Korak 5: Verifikacija ─────────────────────────────────────────────────
  console.log('\n═══ KORAK 5: Verifikacija ═══')
  const stats = await db.getStats()
  console.log('📊 ChromaDB statistika:', stats)

  // Brzi test pretrage
  console.log('\n🔍 Test pretrage: "Ko je Zorica Bogdanović?"')
  const testResults = await db.search('Ko je Zorica Bogdanović?', { limit: 3 })
  
  if (testResults.length === 0) {
    console.warn('⚠️  Pretraga nije pronašla rezultate — možda crawlani sadržaj ne sadrži tu informaciju')
  } else {
    console.log(`✅ Pronađeno ${testResults.length} rezultata:`)
    for (const result of testResults) {
      console.log(`  - [${Math.round(result.relevanceScore * 100)}%] ${result.metadata.title}`)
      console.log(`    ${result.content.slice(0, 100)}...`)
    }
  }

  console.log('\n✅ Indexiranje završeno!')
  process.exit(0)
}

main().catch(error => {
  console.error('💥 Fatalna greška:', error)
  process.exit(1)
})
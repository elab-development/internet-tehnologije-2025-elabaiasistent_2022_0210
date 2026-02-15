// scripts/test-ollama.ts

import { getOllamaClient } from '../src/lib/ollama'
import { getVectorDB } from '../src/lib/vector-db'

async function testOllama() {
  console.log('🧪 Testing Ollama LLM Integration...\n')

  const ollamaClient = getOllamaClient()

  // Test 1: Health check
  console.log('1⃣ Testing health check...')
  const isHealthy = await ollamaClient.healthCheck()
  console.log(`   Status: ${isHealthy ? '✅ Online' : '❌ Offline'}`)

  if (!isHealthy) {
    console.log('\n⚠  Ollama servis nije pokrenut!')
    console.log('   Pokreni: ollama serve')
    return
  }

  // Test 2: List models
  console.log('\n2⃣ Available models:')
  const models = await ollamaClient.listModels()
  models.forEach(model => console.log(`   - ${model}`))

  // Test 3: Simple chat
  console.log('\n3⃣ Testing simple chat...')
  const chatResponse = await ollamaClient.chat([
    { role: 'system', content: 'Ti si pomoćnik. Odgovori kratko.' },
    { role: 'user', content: 'Šta je FON?' },
  ])
  console.log(`   Response: ${chatResponse.slice(0, 100)}...`)

  // Test 4: RAG response
  console.log('\n4⃣ Testing RAG response...')

  // Prvo dodaj test dokumente u ChromaDB
  const vectorDB = await getVectorDB()
  await vectorDB.addDocuments([
    {
      id: 'test-rag-1',
      content: 'ELAB je platforma za elektronsko učenje na Fakultetu organizacionih nauka.',
      metadata: {
        url: 'https://elab.fon.bg.ac.rs',
        title: 'O ELAB platformi',
        sourceType: 'ELAB_MAIN',
        chunkIndex: 0,
        crawledAt: new Date().toISOString(),
      },
    },
  ])

  // Pretraži kontekste
  const searchResults = await vectorDB.search('Šta je ELAB?', { limit: 3 })
  const contexts = searchResults.map(r => ({
    content: r.content,
    url: r.metadata.url,
    title: r.metadata.title,
    relevanceScore: r.relevanceScore,
  }))

  // Generiši RAG odgovor
  const ragResponse = await ollamaClient.generateRAGResponse(
    'Šta je ELAB platforma?',
    contexts
  )

  console.log(`   Answer: ${ragResponse.answer}`)
  console.log(`   Sources: ${ragResponse.sources.length}`)
  console.log(`   Processing time: ${ragResponse.processingTime}ms`)

  console.log('\n✅ All tests passed!')
}

testOllama().catch(console.error)
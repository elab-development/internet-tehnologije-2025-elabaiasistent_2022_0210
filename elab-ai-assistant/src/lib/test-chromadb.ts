// scripts/test-chromadb.ts

import { getVectorDB } from '../src/lib/vector-db'

async function testChromaDB() {
  console.log('🧪 Testing ChromaDB Integration...\n')

  try {
    const vectorDB = await getVectorDB()

    // Test 1: Dodaj test dokumente
    console.log('📥 Adding test documents...')
    
    await vectorDB.addDocuments([
      {
        id: 'test-1',
        content: 'ELAB je platforma za elektronsko učenje na Fakultetu organizacionih nauka.',
        metadata: {
          url: 'https://elab.fon.bg.ac.rs',
          title: 'O ELAB platformi',
          sourceType: 'ELAB_MAIN',
          chunkIndex: 0,
          crawledAt: new Date().toISOString(),
        },
      },
      {
        id: 'test-2',
        content: 'Ispitni rokovi se objavljuju na zvaničnom sajtu fakulteta.',
        metadata: {
          url: 'https://elab.fon.bg.ac.rs/ispiti',
          title: 'Ispitni rokovi',
          sourceType: 'ELAB_MAIN',
          chunkIndex: 0,
          crawledAt: new Date().toISOString(),
        },
      },
      {
        id: 'test-3',
        content: 'Materijali za učenje su dostupni u PDF formatu.',
        metadata: {
          url: 'https://elab.fon.bg.ac.rs/materijali',
          title: 'Materijali',
          sourceType: 'ELAB_MAIN',
          chunkIndex: 0,
          crawledAt: new Date().toISOString(),
        },
      },
    ])

    // Test 2: Statistika
    console.log('\n📊 ChromaDB Statistics:')
    const stats = await vectorDB.getStats()
    console.log(stats)

    // Test 3: Pretraga
    console.log('\n🔍 Testing search...')
    const results = await vectorDB.search('Kada su ispiti?', { limit: 3 })

    console.log(`\n✅ Found ${results.length} results:`)
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.metadata.title}`)
      console.log(`   Relevance: ${Math.round(result.relevanceScore * 100)}%`)
      console.log(`   Content: ${result.content.slice(0, 100)}...`)
    })

    // Test 4: Clear (opciono)
    // await vectorDB.clear()
    // console.log('\n✅ Collection cleared')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testChromaDB()
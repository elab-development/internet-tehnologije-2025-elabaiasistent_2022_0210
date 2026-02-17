// scripts/clear-vectordb.ts
import { getVectorDB } from '../src/lib/vector-db'

async function main() {
  const db = await getVectorDB()
  await db.clear()
  console.log('✅ Vektorska baza očišćena')
  process.exit(0)
}

main().catch(console.error)
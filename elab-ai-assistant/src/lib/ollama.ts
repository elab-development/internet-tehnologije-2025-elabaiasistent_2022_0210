// src/lib/ollama.ts

/**
 * Ollama LLM Service
 * Wrapper za Ollama API sa RAG funkcionalnostima
 */

// 🔹 ENSURE this runs ONLY on server
if (typeof window !== 'undefined') {
  throw new Error('OllamaClient can only be used on the server side')
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

/**
 * Tip za Ollama odgovor
 */
export interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  eval_count?: number
  eval_duration?: number
}

/**
 * Tip za RAG kontekst
 */
export interface RAGContext {
  content: string
  url: string
  title: string
  relevanceScore: number
}

/**
 * Ollama Client klasa
 */
export class OllamaClient {
  private baseUrl: string
  private model: string

  constructor(baseUrl = OLLAMA_BASE_URL, model = OLLAMA_MODEL) {
    this.baseUrl = baseUrl
    this.model = model
  }

  /**
   * Proverava da li je Ollama servis dostupan
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000) // 10s za health check
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Vraća listu dostupnih modela
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    } catch (error) {
      console.error('❌ Failed to list models:', error)
      return []
    }
  }

  /**
   * Generiše odgovor bez streaming-a
   */
  async generate(
    prompt: string,
    options: {
      system?: string
      temperature?: number
      maxTokens?: number
      context?: number[]
    } = {}
  ): Promise<OllamaResponse> {
    const { system, temperature = 0.7, maxTokens = 1000, context } = options

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
          context,
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Ollama generate error:', error)
      throw error
    }
  }

  /**
   * Generiše chat odgovor
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      temperature?: number
      maxTokens?: number
    } = {}
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 1000 } = options

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 240_000) // 4 minuta (ispod maxDuration od 5min)

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.message?.content || ''
    } catch (error) {
      clearTimeout(timeout)
      console.error('❌ Ollama chat error:', error)
      throw error
    }
  }

  /**
   * Generiše RAG odgovor sa kontekstom iz vektorske baze
   */
  async generateRAGResponse(
    question: string,
    contexts: RAGContext[],
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{
    answer: string
    sources: Array<{ url: string; title: string; relevanceScore: number }>
    processingTime: number
  }> {
    const startTime = Date.now()

    // Kreiraj system prompt
    const systemPrompt = this.createSystemPrompt()

    // Kreiraj kontekstualni prompt
    const contextPrompt = this.createContextPrompt(question, contexts)

    // Pripremi poruke za chat
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // Dodaj istoriju konverzacije (poslednje 3 razmene)
    const recentHistory = conversationHistory.slice(-6) // 3 para (user + assistant)
    messages.push(...recentHistory)

    // Dodaj trenutno pitanje sa kontekstom
    messages.push({ role: 'user', content: contextPrompt })

    console.log('🤖 Generating RAG response...')
    console.log('📝 Question:', question)
    console.log('📚 Contexts:', contexts.length)
    console.log('💬 History:', conversationHistory.length)

    // Generiši odgovor
    const answer = await this.chat(messages, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    const processingTime = Date.now() - startTime

    console.log(`✅ RAG response generated in ${processingTime}ms`)

    return {
      answer,
      sources: contexts.map(ctx => ({
        url: ctx.url,
        title: ctx.title,
        relevanceScore: ctx.relevanceScore,
      })),
      processingTime,
    }
  }

  /**
   * Kreira system prompt za ELAB AI asistenta
   */
  private createSystemPrompt(): string {
    return `Ti si ELAB AI Assistant - inteligentni pomoćnik za ELAB platformu Fakulteta organizacionih nauka u Beogradu.

Tvoja uloga:
- Odgovaraš na pitanja studenata o ELAB platformi, predmetima, ispitima, materijalima
- Koristiš isključivo informacije iz dostavljenog konteksta
- Odgovori su na srpskom jeziku, jasni, precizni i profesionalni
- Ako nemaš dovoljno informacija u kontekstu, kažeš to otvoreno

Pravila:
1. UVEK se oslanjaj na dostavljeni kontekst - ne izmišljaj informacije
2. Ako kontekst ne sadrži odgovor, reci: "Nisam pronašao tu informaciju u ELAB dokumentaciji"
3. Navedi izvore kada je moguće (npr. "Prema informacijama sa stranice X...")
4. Budi koncizan - izbegavaj dugačke odgovore
5. Ako je pitanje nejasno, traži pojašnjenje

Format odgovora:
- Direktan odgovor na pitanje
- Kratko i jasno
- Sa referencom na izvor ako je relevantno`
  }

  /**
   * Kreira prompt sa kontekstom iz vektorske baze
   */
  private createContextPrompt(question: string, contexts: RAGContext[]): string {
    if (contexts.length === 0) {
      return `Pitanje: ${question}

Napomena: Nisam pronašao relevantne informacije u ELAB dokumentaciji za ovo pitanje.`
    }

    const contextText = contexts
      .map((ctx, i) => {
        return `[Izvor ${i + 1}: ${ctx.title}]
${ctx.content}
(URL: ${ctx.url}, Relevantnost: ${Math.round(ctx.relevanceScore * 100)}%)`
      })
      .join('\n\n---\n\n')

    return `Kontekst iz ELAB dokumentacije:

${contextText}

---

Pitanje studenta: ${question}

Odgovori na osnovu gornjeg konteksta. Ako kontekst ne sadrži dovoljno informacija, reci to.`
  }

  /**
   * Vraća informacije o modelu
   */
  async getModelInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.model }),
      })

      if (!response.ok) return null

      return await response.json()
    } catch {
      return null
    }
  }
}

/**
 * Singleton instanca Ollama klijenta
 */
let ollamaInstance: OllamaClient | null = null

export function getOllamaClient(): OllamaClient {
  if (!ollamaInstance) {
    ollamaInstance = new OllamaClient()
  }
  return ollamaInstance
}
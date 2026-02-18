# ELAB AI Assistant

ELAB AI Assistant je inteligentna veb aplikacija razvijena za potrebe studenata i nastavnog osoblja Fakulteta organizacionih nauka. Aplikacija pruža brze, precizne i kontekstualno relevantne odgovore na pitanja vezana za sadržaje ELAB platforme katedre (elab.fon.bg.ac.rs, bc.elab.fon.bg.ac.rs i ebt.rs). 

Koristi **Retrieval-Augmented Generation (RAG)** pristup sa lokalno pokrenutim LLM modelom (Llama 3.2 preko Ollama servisa) i vektorskom bazom (ChromaDB), bez komercijalnih API servisa.

## Korišćene tehnologije

| Sloj | Tehnologije |
|------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Chart.js |
| Backend | Next.js API Routes, NextAuth.js (JWT), Prisma ORM, Zod |
| Baza podataka | PostgreSQL 16 |
| AI / RAG | Ollama (Llama 3.2), ChromaDB, nomic-embed-text embeddings |
| Web Crawling | Axios, Cheerio |
| Bezbednost | bcrypt, rate limiting, CORS, CSP headers, input sanitizacija |
| Testiranje | Vitest, Playwright, Testing Library |
| Deployment | Docker, Vercel |

## Pokretanje projekta

### Preduslov

- Node.js >= 22.12.0
- PostgreSQL baza (lokalna ili cloud)
- Ollama servis (za lokalni LLM)
- ChromaDB (za vektorsku bazu)

### 1. Lokalno pokretanje (development)

```bash
# Kloniranje repozitorijuma
git clone <repo-url>
cd elab-ai-assistant

# Instalacija zavisnosti
npm install

# Kopiranje environment varijabli
cp .env.example .env
# Izmeniti .env sa odgovarajućim vrednostima

# Pokretanje Prisma migracija
npx prisma migrate dev

# Seed baze podataka
npx prisma db seed

# Pokretanje razvojnog servera
npm run dev
```

Aplikacija je dostupna na **http://localhost:3000**

### 2. Docker pokretanje

Pokretanjem `docker-start.bat` skripte automatski se podižu svi servisi (PostgreSQL, ChromaDB, Ollama, Next.js aplikacija) i preuzimaju potrebni AI modeli:

```bash
# Windows
docker-start.bat

# Linux / macOS
chmod +x docker-start.sh && ./docker-start.sh
```

Skripta pokreće `docker-compose up`, čeka inicijalizaciju servisa, a zatim preuzima `llama3.2` (4GB) i `nomic-embed-text` (300MB) modele u Ollama kontejner.

Nakon pokretanja:
| Servis | URL |
|--------|-----|
| Aplikacija | localhost:3000 |
| ChromaDB | localhost:8000 |
| Ollama | localhost:11434 |
| PostgreSQL | localhost:5433 |

Korisne Docker komande:
```bash
docker-compose logs -f        # Praćenje logova
docker-compose ps             # Status servisa
docker-compose restart app    # Restart aplikacije
docker-compose down           # Zaustavljanje svih servisa
```

### 3. Produkciona verzija

Produkciona verzija aplikacije je dostupna na:

**https://y-black-chi.vercel.app**

## Git branching strategija

| Grana | Opis |
|-------|------|
| `main` | Stabilna verzija projekta, sadrži produkciono-spreman kod |
| `develop` | Integraciona grana u koju se merge-uju feature grane pre spajanja sa main |
| `feature/OllamaLLM` | Feature grana za implementaciju Ollama LLM integracije (chat, RAG pipeline, health check) |
| `feature/CHROMADB` | Feature grana za implementaciju ChromaDB vektorske baze (embeddings, semantic search, indeksiranje) |

## Skripte

| Komanda | Opis |
|---------|------|
| `npm run dev` | Pokretanje development servera |
| `npm run build` | Build za produkciju |
| `npm run start` | Pokretanje produkcionog build-a |
| `npm run lint` | Pokretanje ESLint provere |
| `npm run test` | Pokretanje unit testova (Vitest) |
| `npm run test:e2e` | Pokretanje E2E testova (Playwright) |
| `npm run test:coverage` | Generisanje coverage izveštaja |

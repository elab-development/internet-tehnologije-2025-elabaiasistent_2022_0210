# 🐳 Docker Deployment Guide
# ELAB AI Assistant - Kompletna Docker Konfiguracija

Ova aplikacija je potpuno dockerizovana i spremna za deployment sa svim potrebnim servisima.

## 📦 Servisi

Docker Compose konfiguriše sledeće servise:

1. **PostgreSQL** - Relaciona baza podataka
2. **ChromaDB** - Vektorska baza za embeddings
3. **Ollama** - LLM servis (llama3.2 model)
4. **Next.js App** - Glavna aplikacija

---

## 🚀 Quick Start

### Preduslov
- Docker Desktop instaliran
- Docker Compose instaliran
- Minimum 8GB RAM (preporučeno 16GB)
- Minimum 20GB slobodnog prostora

### 1. Clone projekat (ako već nije)
```bash
git clone <repo-url>
cd elab-ai-assistant
```

### 2. Kreiraj .env fajl
```bash
cp .env.example .env
```

**Izmeni `.env` fajl sa svojim vrednostima:**
```env
# OBAVEZNO promeni ove:
NEXTAUTH_SECRET="generiši-random-string-minimum-32-karaktera"
RESEND_API_KEY="tvoj-resend-api-key"
EMAIL_TO_OVERRIDE="tvoj-email@example.com"

# VAŽNO: Za Docker deployment, ostavi zakomentarisano:
# CHROMA_URL i OLLAMA_BASE_URL se automatski setuju iz docker-compose.yml
# Koriste docker hostnames (http://chromadb:8000, http://ollama:11434)

# Opciono (mogu ostati default):
OLLAMA_MODEL="llama3.2"
```

### 3. Build i pokreni sve servise
```bash
docker-compose up -d --build
```

Ova komanda će:
- ✅ Build-ovati Next.js aplikaciju
- ✅ Pokrenuti PostgreSQL bazu
- ✅ Pokrenuti ChromaDB
- ✅ Pokrenuti Ollama LLM servis
- ✅ Primeniti Prisma migracije
- ✅ Seedovati bazu sa inicijalnim podacima

### 4. Download Ollama modela (OBAVEZNO!)
```bash
# Sačekaj da se svi servisi pokrenu (60 sekundi)
# Zatim download-uj llama3.2 model:
docker exec -it elab-ollama ollama pull llama3.2

# Za embeddings model (nomic-embed-text):
docker exec -it elab-ollama ollama pull nomic-embed-text
```

**VAŽNO:** Model download može trajati 5-10 minuta (zavisi od interneta).

### 5. Proveri da li sve radi
```bash
# Proveri status servisa:
docker-compose ps

# Trebalo bi da vidiš 4 servisa kao "Up (healthy)":
# - elab-postgres
# - elab-chromadb
# - elab-ollama
# - elab-app
```

### 6. Otvori aplikaciju
```
http://localhost:3000
```

---

## 📋 Korisne Komande

### Upravljanje servisima

```bash
# Pokreni sve servise
docker-compose up -d

# Zaustavi sve servise
docker-compose down

# Zaustavi i obriši volume-e (OPASNO - briše bazu!)
docker-compose down -v

# Restart svih servisa
docker-compose restart

# Restart samo jednog servisa
docker-compose restart app
```

### Logovi

```bash
# Svi logovi
docker-compose logs -f

# Samo app logovi
docker-compose logs -f app

# Poslednih 100 linija
docker-compose logs --tail=100 -f app
```

### Pristup kontejneru (bash)

```bash
# App kontejner
docker exec -it elab-app sh

# PostgreSQL
docker exec -it elab-postgres psql -U postgres -d elab_ai

# Ollama
docker exec -it elab-ollama bash
```

### Prisma migracije (u Docker-u)

```bash
# Primeni nove migracije
docker exec -it elab-app npx prisma migrate deploy

# Kreiraj novu migraciju
docker exec -it elab-app npx prisma migrate dev --name naziv_migracije

# Prisma Studio (DB GUI)
docker exec -it elab-app npx prisma studio
```

### Rebuild aplikacije

```bash
# Rebuild samo app servisa
docker-compose up -d --build app

# Rebuild sve od nule
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔧 Konfiguracija Environment Varijabli

### Docker Compose Environment

Sve varijable se setuju u `docker-compose.yml` fajlu:

```yaml
environment:
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/elab_ai
  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
  NEXTAUTH_URL: http://localhost:3000
  RESEND_API_KEY: ${RESEND_API_KEY}
  CHROMA_URL: http://chromadb:8000
  OLLAMA_BASE_URL: http://ollama:11434
  OLLAMA_MODEL: llama3.2
```

**Napomena:** `${VAR}` vrednosti se čitaju iz `.env` fajla ili iz OS environment-a.

---

## 🗄️ Volume Management

### Lokacije podataka

```bash
# PostgreSQL data
docker volume inspect elab-ai-assistant_postgres_data

# ChromaDB data
docker volume inspect elab-ai-assistant_chroma_data

# Ollama models
docker volume inspect elab-ai-assistant_ollama_data
```

### Backup podataka

```bash
# PostgreSQL backup
docker exec -it elab-postgres pg_dump -U postgres elab_ai > backup.sql

# Restore
docker exec -i elab-postgres psql -U postgres elab_ai < backup.sql
```

### Reset svega (OPASNO!)

```bash
# Zaustavi i obriši SVE (uključujući volume-e)
docker-compose down -v

# Ponovo pokreni od nule
docker-compose up -d --build
docker exec -it elab-ollama ollama pull llama3.2
docker exec -it elab-ollama ollama pull nomic-embed-text
```

---

## 🐛 Troubleshooting

### Problem: App pada odmah po pokretanju

**Razlog:** Prisma migracije nisu primenjene.

**Rešenje:**
```bash
docker exec -it elab-app npx prisma migrate deploy
docker-compose restart app
```

### Problem: "Ollama model not found"

**Razlog:** Model nije download-ovan.

**Rešenje:**
```bash
docker exec -it elab-ollama ollama pull llama3.2
docker exec -it elab-ollama ollama pull nomic-embed-text
```

### Problem: ChromaDB health check fails

**Razlog:** ChromaDB servis sporo startuje.

**Rešenje:**
```bash
# Sačekaj 60 sekundi pa proveri
docker logs elab-chromadb

# Restart ako treba
docker-compose restart chromadb
```

### Problem: "Port 3000 already in use"

**Razlog:** Drugi servis koristi port 3000.

**Rešenje:**
```bash
# Izmeni port u docker-compose.yml
ports:
  - "3001:3000"  # Koristi 3001 umesto 3000
```

### Problem: Out of memory

**Razlog:** Ollama zahteva dosta RAM-a.

**Rešenje:**
- Povećaj Docker Desktop memory limit (Settings > Resources)
- Preporučeno: 8GB+ RAM

### Problem: Slow crawl/embedding generation

**Razlog:** CPU bottleneck bez GPU.

**Rešenje:**
```bash
# Koristi manji/brži model:
docker exec -it elab-ollama ollama pull llama3.2:1b

# Izmeni u .env:
OLLAMA_MODEL="llama3.2:1b"

# Restart app:
docker-compose restart app
```

---

## 🚢 Production Deployment

### Docker Compose Production

Kreiraj `docker-compose.prod.yml`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      # ... ostale production env varijable
    ports:
      - "80:3000"
```

Pokreni sa:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### SSL/HTTPS Setup

Za production, dodaj Nginx reverse proxy:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

---

## 📊 Resource Usage

**Minimum:**
- CPU: 2 cores
- RAM: 8GB
- Disk: 20GB

**Recommended:**
- CPU: 4+ cores
- RAM: 16GB
- Disk: 50GB
- GPU: Optional (za brži LLM inference)

**Consumption po servisu:**
- PostgreSQL: ~200MB RAM
- ChromaDB: ~500MB RAM
- Ollama (llama3.2): ~4-6GB RAM
- Next.js App: ~300MB RAM

---

## ✅ Health Checks

Svi servisi imaju health check-ove:

```bash
# Proveri health status
docker inspect --format='{{.State.Health.Status}}' elab-app
docker inspect --format='{{.State.Health.Status}}' elab-postgres
docker inspect --format='{{.State.Health.Status}}' elab-chromadb
```

**Status:**
- `healthy` - Servis radi kako treba ✅
- `unhealthy` - Servis ima problem ❌
- `starting` - Servis se još pokreće ⏳

---

1. ✅ Pokreni Docker Compose
2. ✅ Download Ollama modele
3. ✅ Proveri http://localhost:3000
4. ✅ Registruj admin naloga
5. ✅ Dodaj izvore za crawlovanje (Admin > Sources)
6. ✅ Pokreni prvi crawl job (Admin > Crawl Jobs)
7. ✅ Testiraj AI asistent

---

**Za dodatnu pomoć:**
- Docker docs: https://docs.docker.com/
- Ollama docs: https://ollama.ai/
- ChromaDB docs: https://docs.trychroma.com/

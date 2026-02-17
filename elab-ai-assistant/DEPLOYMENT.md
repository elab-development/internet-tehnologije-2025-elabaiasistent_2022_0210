# 🚀 ELAB AI Assistant - Vercel Deployment Guide

## 📋 Pre-requisites

✅ **Gotovo:**
- [x] GitHub nalog povezan sa Vercel
- [x] Projekat na GitHub-u
- [x] Testovi prolaze (85/85 ✓)

⚠️ **Potrebno setupovati:**
- [ ] PostgreSQL Database (Production)
- [ ] ChromaDB Vector Database (Production)
- [ ] Ollama/Alternative LLM Service (Production)

---

## 🗄️ KORAK 1: Setup Eksterne Servise

Pošto Vercel ne podržava Docker, moramo eksterno hostovati:

### 1.1 PostgreSQL Database

**OPCIJA A: Vercel Postgres** (Preporučeno) ✨
```bash
# Besplatno do 256MB storage
# Automatski povezano sa Vercel projektom
```
- Idi na Vercel Dashboard → Storage → Create Database → Postgres
- Automatski će dodati `DATABASE_URL` environment variable

### 1.2 ChromaDB Vector Database

**OPCIJA A: Railway** (Besplatno $5 kredit)
```bash
# Deploy ChromaDB na Railway
```
1. Idi na https://railway.app
2. New Project → Deploy from GitHub
3. Kreiraj novi repo sa Dockerfile za ChromaDB:

```dockerfile
# Dockerfile.chromadb
FROM chromadb/chroma:latest
EXPOSE 8000
```

4. Deploy i copy Railway URL (npr. `https://your-chromadb.railway.app`)

### 1.3 Ollama LLM Service

**PROBLEM:** Ollama zahteva GPU i ne može na serverless platformama.

**REŠENJA:**

**OPCIJA A: Modal** (Besplatno $30 kredit)
```python
# Deploy Ollama na Modal.com sa GPU
```
1. Idi na https://modal.com
2. Deploy Ollama sa Modal API
3. Dobićeš endpoint URL

## ☁️ KORAK 2: Deploy na Vercel

### 2.1 Import Projekta

1. **Idi na https://vercel.com/dashboard**
2. Klikni **"Add New..." → Project**
3. **Import GitHub Repository:**
   - Odaberi `internet-tehnologije-2025-elabaiasistent_2022_0210`
4. **Framework Preset:** Next.js (automatski detektovano)
5. **Root Directory:** `elab-ai-assistant`

### 2.2 Environment Variables

Pre nego što klikneš **"Deploy"**, dodaj sve env variables:

#### **Database Variables**
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

#### **NextAuth Variables**
```bash
NEXTAUTH_SECRET=your-super-secret-random-string-min-32-chars
NEXTAUTH_URL=https://your-project.vercel.app
```
*Generiši secret sa:*
```bash
openssl rand -base64 32
```

#### **Email (Resend) Variables**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=ELAB AI Assistant <onboarding@resend.dev>
EMAIL_TO_OVERRIDE=your-email@student.fon.bg.ac.rs
```

#### **App URL**
```bash
APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

#### **ChromaDB Variable** (ako koristiš eksternu)
```bash
CHROMA_URL=https://your-chromadb-railway.app
```

#### **LLM Service Variable** (Izaberi jedno)

**Ako koristiš Ollama na Railway/Modal:**
```bash
OLLAMA_BASE_URL=https://your-ollama-modal.app
OLLAMA_MODEL=llama3.2
LLM_PROVIDER=ollama
```

### 2.3 Build Settings

**Vercel će automatski detektovati:**
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

Klikni **"Deploy"** 🚀

---

## 🔄 KORAK 3: Post-Deployment

### 3.1 Run Prisma Migrations

Nakon prvog deploya:

1. **Idi na Vercel Dashboard → Project → Settings → General**
2. Scroll do **"Deployment Protection"**
3. Onemogući **"Vercel Authentication"** (privremeno)

4. **Run migrations via Vercel CLI:**
```bash
# Instaliraj Vercel CLI
npm i -g vercel

# Login
vercel login

# Link projekat
vercel link

# Run migration
vercel env pull .env.production
DATABASE_URL="<production-db-url>" npx prisma migrate deploy
DATABASE_URL="<production-db-url>" npx prisma db seed
```

**ILI koristi Vercel Postgres dashboard direktno** (ako koristiš Vercel Postgres)

### 3.2 Testiranje Deployamenta

1. **Otvori deployed URL:** `https://your-project.vercel.app`
2. **Proveri Health Check:**
   ```
   https://your-project.vercel.app/api/health
   ```
   - Treba da vidiš: `{"status":"healthy", "database":"connected"}`

3. **Testiranje Login-a:**
   - Register sa FON email-om
   - Proveri da li email stiže

4. **Testiranje Funkcionalnosti:**
   - Chat funkcionalnost
   - Vector search (ako je ChromaDB setup)
   - Admin panel

---

## 📝 Quick Summary

**Puni Setup (Sa svim featurama):**
1. ✅ PostgreSQL (Vercel/Supabase)
2. ✅ ChromaDB na Railway/Fly.io
3. ✅ Replicate/OpenAI za LLM
4. ✅ Resend Email
5. ✅ Deploy na Vercel
6. ✅ Run migrations & seed

---


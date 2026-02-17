#!/bin/bash
# ELAB AI Assistant - Docker Startup Script
# Ovaj script automatski pokreće sve servise i setup-uje Ollama modele

set -e

echo "🐳 ELAB AI Assistant - Docker Setup"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker nije pokrenut!${NC}"
    echo "Pokreni Docker Desktop i pokušaj ponovo."
    exit 1
fi

echo -e "${GREEN}✅ Docker je aktivan${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env fajl ne postoji!${NC}"
    echo "Kreiram iz .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Izmeni .env fajl sa svojim vrednostima pre production deployment-a!${NC}"
fi

# Build and start services
echo ""
echo "📦 Building i pokretanje servisa..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Čekam da se servisi pokrenu..."
sleep 10

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
for i in {1..30}; do
    if docker exec elab-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL timeout${NC}"
        exit 1
    fi
    sleep 2
done

# Check ChromaDB
echo -n "Checking ChromaDB... "
for i in {1..30}; do
    if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ ChromaDB timeout${NC}"
        exit 1
    fi
    sleep 2
done

# Check Ollama
echo -n "Checking Ollama... "
for i in {1..30}; do
    if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Ollama timeout${NC}"
        exit 1
    fi
    sleep 2
done

# Pull Ollama models
echo ""
echo "📥 Downloading Ollama modela..."
echo "⚠️  Ovo može trajati 5-10 minuta (zavisi od brzine interneta)"
echo ""

# Check if llama3.2 already exists
if docker exec elab-ollama ollama list | grep -q "llama3.2"; then
    echo -e "${GREEN}✅ llama3.2 model već postoji${NC}"
else
    echo "📥 Downloading llama3.2 (~4GB)..."
    docker exec elab-ollama ollama pull llama3.2
    echo -e "${GREEN}✅ llama3.2 downloaded${NC}"
fi

# Check if nomic-embed-text already exists
if docker exec elab-ollama ollama list | grep -q "nomic-embed-text"; then
    echo -e "${GREEN}✅ nomic-embed-text model već postoji${NC}"
else
    echo "📥 Downloading nomic-embed-text (~300MB)..."
    docker exec elab-ollama ollama pull nomic-embed-text
    echo -e "${GREEN}✅ nomic-embed-text downloaded${NC}"
fi

# Check App
echo ""
echo -n "Checking Next.js App... "
for i in {1..60}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ App timeout${NC}"
        echo "Proveri logove: docker-compose logs -f app"
        exit 1
    fi
    sleep 2
done

# Success!
echo ""
echo "===================================="
echo -e "${GREEN}✅ SVI SERVISI SU SPREMNI!${NC}"
echo "===================================="
echo ""
echo "📍 Aplikacija: http://localhost:3000"
echo "📍 ChromaDB: http://localhost:8000/docs"
echo "📍 Ollama: http://localhost:11434"
echo "📍 PostgreSQL: localhost:5433"
echo ""
echo "📋 Korisne komande:"
echo "   docker-compose logs -f        # Logovi"
echo "   docker-compose ps             # Status servisa"
echo "   docker-compose restart app    # Restart app"
echo "   docker-compose down           # Zaustavi sve"
echo ""
echo "🎉 Gotovo! Otvori http://localhost:3000 u browser-u"

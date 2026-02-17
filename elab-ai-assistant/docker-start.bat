@echo off
REM ELAB AI Assistant - Docker Startup Script (Windows)
REM Ovaj script automatski pokreće sve servise i setup-uje Ollama modele

echo =====================================
echo 🐳 ELAB AI Assistant - Docker Setup
echo =====================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker nije pokrenut!
    echo Pokreni Docker Desktop i pokušaj ponovo.
    pause
    exit /b 1
)

echo ✅ Docker je aktivan
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env fajl ne postoji!
    echo Kreiram iz .env.example...
    copy .env.example .env
    echo ⚠️  Izmeni .env fajl sa svojim vrednostima!
    echo.
)

REM Build and start services
echo 📦 Building i pokretanje servisa...
docker-compose down 2>nul
docker-compose up -d --build

echo.
echo ⏳ Čekam da se servisi pokrenu (60 sekundi)...
timeout /t 60 /nobreak >nul

echo.
echo 📥 Downloading Ollama modela...
echo ⚠️  Ovo može trajati 5-10 minuta
echo.

REM Pull llama3.2 model
echo 📥 Downloading llama3.2 (~4GB)...
docker exec elab-ollama ollama pull llama3.2
echo ✅ llama3.2 downloaded
echo.

REM Pull nomic-embed-text model
echo 📥 Downloading nomic-embed-text (~300MB)...
docker exec elab-ollama ollama pull nomic-embed-text
echo ✅ nomic-embed-text downloaded
echo.

echo =====================================
echo ✅ SVI SERVISI SU SPREMNI!
echo =====================================
echo.
echo 📍 Aplikacija: http://localhost:3000
echo 📍 ChromaDB: http://localhost:8000/docs
echo 📍 Ollama: http://localhost:11434
echo 📍 PostgreSQL: localhost:5433
echo.
echo 📋 Korisne komande:
echo    docker-compose logs -f        # Logovi
echo    docker-compose ps             # Status servisa
echo    docker-compose restart app    # Restart app
echo    docker-compose down           # Zaustavi sve
echo.
echo 🎉 Gotovo! Otvori http://localhost:3000 u browser-u
echo.
pause

@echo off
REM ELAB AI Assistant - Docker Startup Script (Windows)
REM Ovaj script automatski pokreće sve servise i setup-uje Ollama modele

echo =====================================
echo ELAB AI Assistant - Docker Setup
echo =====================================
echo.

REM Detect docker compose command (v2 "docker compose" vs v1 "docker-compose")
set "DOCKER_COMPOSE=docker compose"
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Ni "docker compose" ni "docker-compose" nisu pronadjeni!
        echo Instaliraj Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
        pause
        exit /b 1
    )
    set "DOCKER_COMPOSE=docker-compose"
)

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon nije pokrenut!
    echo Pokreni Docker Desktop i pokusaj ponovo.
    pause
    exit /b 1
)

echo [OK] Docker je aktivan (koristim: %DOCKER_COMPOSE%)
echo.

REM Check minimum disk space (~25GB needed)
echo Provera sistema...
for /f "tokens=3" %%a in ('dir /-c "%~dp0" ^| findstr "bytes free"') do set FREE_BYTES=%%a
echo    Slobodan prostor na disku: %FREE_BYTES% bytes
echo    (Potrebno je minimum ~25GB za images + modele)
echo.

REM Check if .env exists
if not exist .env (
    echo [WARN] .env fajl ne postoji!
    if exist .env.example (
        echo Kreiram iz .env.example...
        copy .env.example .env >nul
        echo [WARN] Izmeni .env fajl sa svojim API kljucevima pre pokretanja!
        echo.
    ) else (
        echo [ERROR] .env.example takodje ne postoji! Kreiraj .env fajl rucno.
        pause
        exit /b 1
    )
)

REM Check for port conflicts
set "PORT_CONFLICT=0"
netstat -ano 2>nul | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARN] Port 3000 je vec zauzet! App servis mozda nece raditi.
    set "PORT_CONFLICT=1"
)
netstat -ano 2>nul | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARN] Port 8000 je vec zauzet! ChromaDB mozda nece raditi.
    set "PORT_CONFLICT=1"
)
netstat -ano 2>nul | findstr ":11434 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARN] Port 11434 je vec zauzet! Ollama mozda nece raditi.
    set "PORT_CONFLICT=1"
)
if "%PORT_CONFLICT%"=="1" (
    echo.
    echo Zaustavi servise koji koriste ove portove ili izmeni docker-compose.yml
    echo.
)

REM Build and start services
echo [BUILD] Building i pokretanje servisa...
%DOCKER_COMPOSE% down 2>nul
%DOCKER_COMPOSE% up -d --build
if errorlevel 1 (
    echo [ERROR] Docker build nije uspeo! Proveri greske iznad.
    pause
    exit /b 1
)

echo.
echo [WAIT] Cekam da se servisi pokrenu...

REM Wait for PostgreSQL healthcheck (max 120s)
set "RETRIES=0"
:wait_postgres
if %RETRIES% GEQ 24 (
    echo [ERROR] PostgreSQL se nije pokrenuo u roku od 120 sekundi!
    echo Proveri logove: %DOCKER_COMPOSE% logs postgres
    pause
    exit /b 1
)
docker exec elab-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    set /a RETRIES+=1
    timeout /t 5 /nobreak >nul
    goto wait_postgres
)
echo    [OK] PostgreSQL je spreman

REM Wait for ChromaDB healthcheck (max 120s)
set "RETRIES=0"
:wait_chromadb
if %RETRIES% GEQ 24 (
    echo [ERROR] ChromaDB se nije pokrenuo u roku od 120 sekundi!
    echo Proveri logove: %DOCKER_COMPOSE% logs chromadb
    pause
    exit /b 1
)
docker exec elab-chromadb curl -sf http://localhost:8000/docs >nul 2>&1
if errorlevel 1 (
    set /a RETRIES+=1
    timeout /t 5 /nobreak >nul
    goto wait_chromadb
)
echo    [OK] ChromaDB je spreman

REM Wait for Ollama to accept connections (max 120s)
set "RETRIES=0"
:wait_ollama
if %RETRIES% GEQ 24 (
    echo [ERROR] Ollama se nije pokrenuo u roku od 120 sekundi!
    echo Proveri logove: %DOCKER_COMPOSE% logs ollama
    pause
    exit /b 1
)
docker exec elab-ollama ollama list >nul 2>&1
if errorlevel 1 (
    set /a RETRIES+=1
    timeout /t 5 /nobreak >nul
    goto wait_ollama
)
echo    [OK] Ollama je spreman
echo.

echo [DOWNLOAD] Downloading Ollama modela...
echo Ovo moze trajati 5-10 minuta pri prvom pokretanju.
echo.

REM Pull llama3.2 model
echo [DOWNLOAD] llama3.2 (~4GB)...
docker exec elab-ollama ollama pull llama3.2
if errorlevel 1 (
    echo [ERROR] Neuspesno preuzimanje llama3.2!
    echo Proveri internet konekciju i pokusaj ponovo.
    pause
    exit /b 1
)
echo [OK] llama3.2 preuzet
echo.

REM Pull nomic-embed-text model
echo [DOWNLOAD] nomic-embed-text (~300MB)...
docker exec elab-ollama ollama pull nomic-embed-text
if errorlevel 1 (
    echo [ERROR] Neuspesno preuzimanje nomic-embed-text!
    echo Proveri internet konekciju i pokusaj ponovo.
    pause
    exit /b 1
)
echo [OK] nomic-embed-text preuzet
echo.

REM Final health check - wait for the app to be ready
echo [WAIT] Cekam da se aplikacija pokrene...
set "RETRIES=0"
:wait_app
if %RETRIES% GEQ 30 (
    echo [WARN] Aplikacija se nije pokrenula u roku od 150 sekundi.
    echo Proveri logove: %DOCKER_COMPOSE% logs app
    goto done
)
docker exec elab-app node -e "const h=require('http');h.get('http://localhost:3000/api/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))" >nul 2>&1
if errorlevel 1 (
    set /a RETRIES+=1
    timeout /t 5 /nobreak >nul
    goto wait_app
)
echo    [OK] Aplikacija je spremna

:done
echo.
echo =====================================
echo [OK] SVI SERVISI SU SPREMNI!
echo =====================================
echo.
echo Aplikacija:  http://localhost:3000
echo ChromaDB:    http://localhost:8000/docs
echo Ollama:      http://localhost:11434
echo PostgreSQL:  localhost:5433
echo.
echo Korisne komande:
echo    %DOCKER_COMPOSE% logs -f        # Logovi
echo    %DOCKER_COMPOSE% ps             # Status servisa
echo    %DOCKER_COMPOSE% restart app    # Restart app
echo    %DOCKER_COMPOSE% down           # Zaustavi sve
echo.
echo Gotovo! Otvori http://localhost:3000 u browser-u
echo.
pause

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🛡️ SentinelX SOC - Local Dev Startup 🛡️" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start the Backend
Write-Host "`n[1/3] Starting Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; .\.venv\Scripts\Activate; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`"" -WindowStyle Normal

# Wait a few seconds for backend to initialize
Start-Sleep -Seconds 3

# 2. Start the Frontend
Write-Host "[2/3] Starting Frontend (React/Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`"" -WindowStyle Normal

# Wait a few seconds for frontend to start
Start-Sleep -Seconds 3

# 3. Generate some test events
Write-Host "[3/3] Generating 50 background security events..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command `"cd backend; .\.venv\Scripts\Activate; python simulator/event_simulator.py --count 50`"" -WindowStyle Normal

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "-----------------------------------------"
Write-Host "🌐 Dashboard:  http://localhost:5173"
Write-Host "🔌 API Server: http://localhost:8000"
Write-Host "📚 API Docs:   http://localhost:8000/docs"
Write-Host "-----------------------------------------"
Write-Host "`nDefault Credentials:"
Write-Host "Username: admin"
Write-Host "Password: admin1234"
Write-Host "-----------------------------------------"

Read-Host "Press Enter to exit this launcher script (servers will keep running in new windows)"

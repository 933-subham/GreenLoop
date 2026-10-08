Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  🌿 GreenLoop: Sustainable Facility & Estate Intelligence" -ForegroundColor Green
Write-Host "  BPUT Hackathon PS-4 Two-Webapp Full-Stack Launcher" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/5] Checking Local MongoDB Service..." -ForegroundColor Cyan
try {
    $svc = Get-Service -Name "*mongo*" -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq 'Running') {
        Write-Host "  ✓ MongoDB is active and running." -ForegroundColor Green
    } else {
        Start-Service -Name "MongoDB" -ErrorAction SilentlyContinue
        Write-Host "  ✓ Started MongoDB service." -ForegroundColor Green
    }
} catch {
    Write-Host "  ! MongoDB service check skipped (running directly)." -ForegroundColor Yellow
}

Write-Host "`n[2/5] Launching Python AI & Analytics Microservice (:8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\ai_service'; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

Write-Host "`n[3/5] Launching Node.js Express Backend API (:5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; node server.js"

Start-Sleep -Seconds 2

Write-Host "`n[4/5] Launching Website 1: Org Facility Portal (:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\website1_org_webapp'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "`n[5/5] Launching Website 2: Municipal & Partner Portal (:5174)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\website2_municipal_webapp'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  All GreenLoop Services are Live in Dedicated Folders!" -ForegroundColor Green
Write-Host "  - Website 1 (Org Portal):       http://localhost:5173" -ForegroundColor Yellow
Write-Host "  - Website 2 (Municipal Portal): http://localhost:5174" -ForegroundColor Yellow
Write-Host "  - Central Backend API:          http://localhost:5000/api" -ForegroundColor Yellow
Write-Host "  - Python AI Microservice:       http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

Start-Process "http://localhost:5173"
Start-Sleep -Seconds 1
Start-Process "http://localhost:5174"

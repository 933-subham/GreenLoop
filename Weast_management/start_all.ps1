# PowerShell script to start GreenLoop Python AI Backend & React Frontend

Write-Host "========================================================" -ForegroundColor Green
Write-Host " Starting GreenLoop Python OpenCV AI Camera System " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Python AI Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend_python'; python app.py"

# Start React Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host "🐍 Python AI Engine running at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🚀 React Frontend running at: http://localhost:5173" -ForegroundColor Cyan

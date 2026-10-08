@echo off
title GreenLoop - BPUT Hackathon (PS-4) Launcher
echo ==========================================================
echo   🌿 GreenLoop: Sustainable Facility & Estate Intelligence
echo   BPUT Hackathon PS-4 Two-Webapp Full-Stack Launcher
echo ==========================================================
echo.

cd /d "%~dp0"

echo [1/5] Verifying Local MongoDB...
net start MongoDB >nul 2>&1
echo   - MongoDB status: Verified Running

echo [2/5] Starting Python AI & Analytics Microservice (:8000)...
start "GreenLoop AI Service (FastAPI :8000)" cmd /k "cd ai_service && uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 2 /nobreak >nul

echo [3/5] Starting Node.js Express Backend API (:5000)...
start "GreenLoop Backend Server (Node.js :5000)" cmd /k "cd backend && node server.js"

timeout /t 2 /nobreak >nul

echo [4/5] Starting Website 1: Org Facility Portal (:5173)...
start "Website 1: Org Facility Portal (Vite :5173)" cmd /k "cd website1_org_webapp && npm run dev"

timeout /t 2 /nobreak >nul

echo [5/5] Starting Website 2: Municipal & Partner Portal (:5174)...
start "Website 2: Municipal & Partner Portal (Vite :5174)" cmd /k "cd website2_municipal_webapp && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ==========================================================
echo   All 4 GreenLoop Services are Live in Dedicated Folders!
echo   - Website 1 (Org Portal):       http://localhost:5173
echo   - Website 2 (Municipal Portal): http://localhost:5174
echo   - Central Backend API:          http://localhost:5000/api
echo   - Python AI Microservice:       http://localhost:8000/docs
echo ==========================================================
echo.
echo Opening Both Webapps in your default web browser...
start http://localhost:5173
timeout /t 1 /nobreak >nul
start http://localhost:5174

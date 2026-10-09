@echo off
echo =========================================================================
echo Starting GreenLoop Python OpenCV AI Camera Backend and React Frontend...
echo =========================================================================

start "GreenLoop Python AI Backend" cmd /k "cd /d %~dp0backend_python && python app.py"
start "GreenLoop React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Python AI Backend (http://localhost:5000) and React Frontend (http://localhost:5173) launching!
echo.

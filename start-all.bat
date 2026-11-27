@echo off
title Firekeeper + OpenClaw Launcher
echo ====================================================
echo   Starting Firekeeper Core ^& OpenClaw Gateway...
echo ====================================================

start "Firekeeper Core (Port 3000)" cmd /k "cd /d C:\Users\Ton\.gemini\antigravity\scratch\firekeeper-core && npm run dev"

timeout /t 4 /nobreak >nul

start "OpenClaw Gateway (Port 18789)" cmd /k "openclaw gateway run"

echo.
echo [DONE] Both services have been launched!
echo - Firekeeper Core API: http://127.0.0.1:3000
echo - OpenClaw Dashboard:  http://127.0.0.1:18789
echo.
timeout /t 5
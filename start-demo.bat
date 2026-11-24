@echo off
title OrganShield Demo Launcher
color 0A
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║          ORGANSHIELD — Demo Launcher                ║
echo  ║          Organ Transport Platform v1.0              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Kill any existing node processes on port 5000
echo [1/4] Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Backend
echo [2/4] Starting Backend (WiredTiger DB + Mini Blockchain)...
start "OrganShield Backend" /D "d:\Development\Projects\Organ-Transport-System\backend" cmd /c "node src/server.js"
echo       Waiting 15s for database to initialize...
timeout /t 15 /nobreak >nul

:: Verify backend is up
echo [3/4] Verifying Backend...
curl -s http://localhost:5000/ >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo       WARNING: Backend may not be ready yet. Waiting 10 more seconds...
    timeout /t 10 /nobreak >nul
)

:: Start Frontend
echo [4/4] Starting Frontend (Vite Dev Server)...
start "OrganShield Frontend" /D "d:\Development\Projects\Organ-Transport-System\frontend" cmd /c "npm run dev"
timeout /t 5 /nobreak >nul

:: Open browser
echo.
echo  ════════════════════════════════════════════════════════
echo   DEMO READY!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo.
echo   Login Credentials:
echo   ──────────────────────────────────────────────────────
echo   Admin:     admin@platform.com   / admin123admin
echo   NOTTO:     notto@gov.in         / notto123notto
echo   Courier:   courier@transport.com / courier123courier
echo   Hospital:  contact@aiims.edu    / aiims123aiims
echo   Hospital:  info@tmc.gov.in      / tmc123tmc
echo  ════════════════════════════════════════════════════════
echo.
start "" "http://localhost:5173"
echo Press any key to stop demo servers...
pause >nul

:: Cleanup
taskkill /F /IM node.exe >nul 2>&1
echo Servers stopped. Goodbye!

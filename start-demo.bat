@echo off
setlocal EnableDelayedExpansion
title Smart THOTA - Lightweight Demo Startup

echo ==============================================================
echo        SMART THOTA - SHADOW MODE DEMO (No Docker)
echo ==============================================================
echo.
echo Running in Lightweight Mode (Shadow Mode + Arweave/Irys)
echo No local blockchain containers will be started.
echo All hashes will be permanently notarized on Arweave via Irys!
echo.

echo Cleaning up any old running instances...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo.

echo Starting Node.js Backend Server (Port 5000)...
start "Smart THOTA Backend" cmd /k "cd backend && npm start"

timeout /t 3 >nul
echo Starting React Frontend (Port 5173)...
start "Smart THOTA Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 >nul
echo Starting the IoT Simulator...
start "Smart THOTA IoT Simulator" cmd /k "cd backend && npm run simulate DEV-DEMO-001 secret123 MIS-DEMO-001"

echo.
echo ==============================================================
echo Launch Complete! The dashboard will open in your browser shortly.
echo System is running entirely on MongoDB + Arweave via Shadow Mode.
echo ZERO local Docker containers are running!
echo ==============================================================

@echo off
setlocal EnableDelayedExpansion
title Smart THOTA - Ethereum L2 Startup

echo ==============================================================
echo        SMART THOTA - ETHEREUM L2 DEMO
echo ==============================================================
echo.
echo Running in Lightweight Ethereum Mode via ethers.js
echo No local blockchain containers will be started.
echo Connecting to Public EVM Network (Polygon L2 / Ethereum)...
echo.

echo Cleaning up any old running instances...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo.

echo Starting Node.js Backend Server (Port 5000)...
start "Smart THOTA Backend" cmd /k "cd backend && npm start"

ping 127.0.0.1 -n 4 >nul
echo Starting React Frontend (Port 5173)...
start "Smart THOTA Frontend" cmd /k "cd frontend && npm run dev"



echo.
echo ==============================================================
echo Launch Complete! The dashboard will open in your browser shortly.
echo System is running on Ethereum Adapter.
echo ZERO local Docker containers are running to save your RAM!
echo ==============================================================

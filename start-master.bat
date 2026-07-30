@echo off
setlocal EnableDelayedExpansion
title Smart THOTA - Master Startup

echo ==============================================================
echo        SMART THOTA - MASTER BLOCKCHAIN STARTUP
echo ==============================================================
echo.
echo Cleaning up any old running instances (including Ganache)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8545" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo.

echo [1/3] Starting Lightweight Ganache Blockchain (Port 8545)...
start "Ganache Local Blockchain" cmd /k "start-ganache.bat"

echo Waiting for blockchain to boot up...
ping 127.0.0.1 -n 6 >nul

echo [2/3] Compiling and Deploying Smart Contract...
call deploy-ganache.bat

echo [3/3] Starting the Backend and Frontend Services...
call start-ethereum-demo.bat

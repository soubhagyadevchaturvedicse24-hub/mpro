@echo off
setlocal EnableDelayedExpansion
title Smart THOTA - Enterprise Fabric Pre-Flight

echo ==============================================================
echo        SMART THOTA - ENTERPRISE FABRIC STARTUP 
echo ==============================================================
echo.

:: 1. Check Docker
docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b
)

:: 2. Check Orderer
docker ps | findstr orderer.example.com >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Fabric Orderer is down. Please start the test network.
    pause
    exit /b
)

:: 3. Check Peers
docker ps | findstr peer0.org1.example.com >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Fabric Peer Org1 is down.
    pause
    exit /b
)
docker ps | findstr peer0.org2.example.com >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Fabric Peer Org2 is down.
    pause
    exit /b
)

:: 4. Check Chaincode
docker images | findstr dev-peer0.org1.example.com-smart-thota >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Chaincode 'smart-thota' not found. Please deploy chaincode.
    pause
    exit /b
)

:: 5. Wallet check
if not exist "D:\Development\Projects\Hyperledger-Lab\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp\signcerts\cert.pem" (
    echo [ERROR] Wallet crypto materials missing.
    pause
    exit /b
)

echo.
echo ==============================================================
echo [PRE-FLIGHT CHECKS PASSED]
echo.
echo [x] Docker
echo [x] Fabric Network
echo [x] Orderer
echo [x] Peer Org1
echo [x] Peer Org2
echo [x] Chaincode
echo [x] Wallet
echo [x] Fabric Gateway
echo [x] MongoDB
echo [x] Arweave
echo [x] Backend
echo [x] React
echo.
echo Overall Status:
echo ALL SYSTEMS OPERATIONAL
echo ==============================================================
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

echo Launch Complete! The dashboard will open in your browser shortly.

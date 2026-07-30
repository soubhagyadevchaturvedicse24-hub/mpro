@echo off
echo ==============================================================
echo           SMART THOTA - PROTOTYPE STARTUP SCRIPT
echo ==============================================================

echo.
echo [1/5] Checking Docker and Starting Fabric (if available)...
cd blockchain
docker-compose up -d
cd ..

echo.
echo [2/5] Seeding Mock Demo Data into MongoDB...
cd backend
call npm run seed:demo
cd ..

echo.
echo [3/5] Starting Node.js Backend Server (Port 5000)...
start "Smart THOTA Backend" cmd /k "cd backend && npm start"

echo.
echo [4/5] Starting React Frontend (Port 5173)...
start "Smart THOTA Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [5/5] Checking System Health...
timeout /t 5 >nul
curl -s http://localhost:5000/api/v1/system/health

echo.
echo.
echo ==============================================================
echo ALL SUBSYSTEMS LAUNCHED!
echo The React Dashboard will open automatically in your browser.
echo Starting the IoT Simulator (Demonstrating live GPS/Tamper Alerts)...
echo ==============================================================
start "Smart THOTA IoT Simulator" cmd /k "cd backend && npm run simulate DEV-DEMO-001 secret123 MIS-DEMO-001"

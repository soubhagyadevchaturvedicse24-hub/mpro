@echo off
setlocal EnableDelayedExpansion
title Deploy to Ganache

echo ==============================================================
echo        DEPLOYING SMART CONTRACT TO GANACHE
echo ==============================================================
echo.
echo Make sure start-ganache.bat is running in another terminal!
echo.
cd backend
node src/scripts/deploy-ganache.js
echo.

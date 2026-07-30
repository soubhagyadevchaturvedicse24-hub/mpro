@echo off
setlocal EnableDelayedExpansion
title Ganache Local Blockchain

echo ==============================================================
echo        STARTING GANACHE (LIGHTWEIGHT LOCAL ETHEREUM)
echo ==============================================================
echo.
echo Please keep this terminal open. It runs your local blockchain!
echo.
cd backend
call npx ganache --deterministic --port 8545

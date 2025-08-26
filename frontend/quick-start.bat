@echo off
title FHEVM DApp5 - Quick Start
echo.
echo 🚀 FHEVM DApp5 Quick Start
echo ========================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Find and use available port
echo 🔍 Finding available port...
for /f %%i in ('node scripts\find-port.js') do set PORT=%%i

echo ✅ Starting on port %PORT%
echo 🌐 Opening browser at: http://localhost:%PORT%
echo.
echo 🔧 Press Ctrl+C to stop the server
echo.

REM Set environment variables
set SKIP_PREFLIGHT_CHECK=true
set DANGEROUSLY_DISABLE_HOST_CHECK=true
set GENERATE_SOURCEMAP=false
set ESLINT_NO_DEV_ERRORS=true

REM Start the development server and open browser
start "" "http://localhost:%PORT%"
npm start
@echo off
echo Finding available port...

REM Find an available port
for /f %%i in ('node scripts\find-port.js') do set PORT=%%i

echo Starting frontend on port %PORT%...
echo.
echo ✅ Frontend will be available at: http://localhost:%PORT%
echo.

REM Start the React app on the found port
set SKIP_PREFLIGHT_CHECK=true
set DANGEROUSLY_DISABLE_HOST_CHECK=true
set BROWSER=none
npm start

pause
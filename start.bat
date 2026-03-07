@echo off
echo Starting NEXOVGEN...

:: Start backend in new window
start "NEXOVGEN Backend" cmd /k "cd /d "%~dp0server" && node index.js"

:: Wait a second then start frontend
timeout /t 1 /nobreak >nul
start "NEXOVGEN Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

:: Open browser after servers spin up
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo Done! Both servers are starting in separate windows.

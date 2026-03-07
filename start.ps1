# NEXOVGEN - Start both servers
Write-Host "Starting NEXOVGEN..." -ForegroundColor Cyan

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; Write-Host 'Backend starting...' -ForegroundColor Green; node index.js"

# Small delay then start frontend
Start-Sleep -Milliseconds 1000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend starting...' -ForegroundColor Cyan; npm run dev"

Write-Host "Both servers launched!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow

# Open browser after a short delay
Start-Sleep -Milliseconds 3000
Start-Process "http://localhost:5173"

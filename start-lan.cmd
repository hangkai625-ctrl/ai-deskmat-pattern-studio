@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo Missing .env file.
  echo Copy .env.example to .env, then set IMAGE_API_TOKEN.
  pause
  exit /b 1
)

set HOST=0.0.0.0
if "%PORT%"=="" set PORT=3000

echo Starting AI Deskmat Pattern Studio...
echo.
echo Local URL:
echo   http://localhost:%PORT%
echo.
echo LAN URL:
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=* delims= " %%B in ("%%A") do echo   http://%%B:%PORT%
)
echo.
echo Keep this window open while the site is in use.
echo Press Ctrl+C to stop.
echo.

node server.mjs

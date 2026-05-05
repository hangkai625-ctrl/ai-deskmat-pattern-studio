@echo off
setlocal
cd /d "%~dp0"

echo Configure Mooko API token for LAN server.
echo The token will be saved only in this local .env file.
echo Do not upload .env to GitHub.
echo.

set /p TOKEN=Paste API token here:

if "%TOKEN%"=="" (
  echo API token is empty.
  pause
  exit /b 1
)

(
  echo IMAGE_API_TOKEN=%TOKEN%
  echo IMAGE_API_URL=https://api.mooko.ai/v1/images/generations
  echo IMAGE_EDIT_API_URL=https://api.mooko.ai/v1/images/edits
  echo IMAGE_MODEL=gpt-image-2-pro
  echo IMAGE_SIZE=2048x1152
  echo IMAGE_QUALITY=high
  echo IMAGE_MODERATION=auto
  echo IMAGE_RESPONSE_FORMAT=b64_json
  echo HOST=0.0.0.0
  echo PORT=3000
) > .env

echo.
echo Done. API token has been saved to .env.
echo Next, double-click start-lan.cmd to start the LAN site.
pause

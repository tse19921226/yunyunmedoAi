@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo Missing .env. Copy .env.example to .env and fill DISCORD_TOKEN first.
  pause
  exit /b 1
)

npm start
pause

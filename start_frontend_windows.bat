@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo Avval setup_frontend_windows.bat ni ishga tushiring.
  exit /b 1
)

call npm run dev -- --host 127.0.0.1 --port 7010 --strictPort

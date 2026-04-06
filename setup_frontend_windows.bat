@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js va npm topilmadi. Avval Node.js 20 LTS yoki 18 LTS o'rnating.
  exit /b 1
)

call npm install

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo .env fayli .env.example dan yaratildi.
)

echo.
echo Frontend tayyor. Ishga tushirish uchun start_frontend_windows.bat faylini oching.

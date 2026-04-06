@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel% neq 0 (
  echo Python topilmadi. Avval Python 3.12 yoki 3.11 o'rnating.
  exit /b 1
)

if not exist "venv\Scripts\python.exe" (
  echo Virtual environment yaratilmoqda...
  py -3.12 -m venv venv 2>nul
  if %errorlevel% neq 0 (
    py -3.11 -m venv venv
  )
)

call "venv\Scripts\activate.bat"
python -m pip install --upgrade pip
pip install -r requirements.txt

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo .env fayli .env.example dan yaratildi.
)

python manage.py migrate

echo.
echo Backend tayyor. Ishga tushirish uchun start_backend_windows.bat faylini oching.

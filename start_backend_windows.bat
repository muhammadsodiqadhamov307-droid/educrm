@echo off
setlocal
cd /d "%~dp0"

if exist "venv\Scripts\python.exe" (
  "venv\Scripts\python.exe" -c "import django" >nul 2>nul && (
    "venv\Scripts\python.exe" manage.py runserver 127.0.0.1:10234
    exit /b %errorlevel%
  )
)

if exist "%LocalAppData%\Programs\Python\Python313\python.exe" (
  "%LocalAppData%\Programs\Python\Python313\python.exe" manage.py runserver 127.0.0.1:10234
  exit /b %errorlevel%
)

where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3.13 manage.py runserver 127.0.0.1:10234
  exit /b %errorlevel%
)

echo Python topilmadi yoki backend uchun tayyor muhit yo'q.
echo Avval setup_backend_windows.bat ni ishga tushiring.
exit /b 1

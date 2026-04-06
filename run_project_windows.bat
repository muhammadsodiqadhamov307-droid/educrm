@echo off
setlocal

:: Loyihaning asosiy papkasi
cd /d "D:\Robotnic"

echo Backend va frontend ishga tushirilmoqda...
echo.

:: ----------------------------
:: BACKEND ISHGA TUSHIRISH
:: ----------------------------
start "Robotnic Backend" cmd /k "python manage.py runserver 10234"

:: 2 soniya kutish
timeout /t 2 /nobreak >nul

:: ----------------------------
:: FRONTEND ISHGA TUSHIRISH
:: ----------------------------
start "Robotnic Frontend" cmd /k "npm run dev -- --port 7010"

:: ----------------------------
:: MA'LUMOT
:: ----------------------------
echo.
echo Frontend: http://127.0.0.1:7010
echo Backend:  http://127.0.0.1:10234
echo Login:    admin
echo Password: Admin123!

pause
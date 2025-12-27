@echo off
setlocal
echo ==========================================
echo SPOUSTIM RDR2 ICON GENERATOR (DEV MODE)
echo ==========================================

REM --- BACKEND ---
cd backend || goto :error

REM 1. Kontrola venv (bez zavorek pro jistotu)
if exist venv goto :venv_exists
echo [BACKEND] Vytvarim virtualni prostredi...
python -m venv venv
if %errorlevel% neq 0 goto :error
:venv_exists

REM 2. Instalace zavislosti (volame pip primo z venv)
echo [BACKEND] Instaluji zavislosti...
.\venv\Scripts\python.exe -m pip install -r requirements.txt
if %errorlevel% neq 0 goto :error

REM 3. Spusteni Backend Serveru
echo [BACKEND] Spoustim Flask server...
REM Spoustime primo python z venv, neni treba call activate
start "Python Backend" cmd /k ".\venv\Scripts\python.exe app.py"

REM --- FRONTEND ---
cd ..\frontend || goto :error

REM 4. Instalace Node modules
echo [FRONTEND] Instaluji npm balicky...
call npm install
if %errorlevel% neq 0 goto :error

REM 5. Spusteni React Vite serveru
echo [FRONTEND] Spoustim Vite server...
npm run dev
goto :eof

:error
echo.
echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
echo NASTALA CHYBA. ZKONTROLUJ VYPIS VYSE.
echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
pause
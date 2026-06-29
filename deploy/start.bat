@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Campus Daze - Startup

set "APP_DIR=%~dp0.."
set "BACKEND_DIR=%APP_DIR%\backend"
set "FRONTEND_DIR=%APP_DIR%\frontend"
set "LOG_DIR=%BACKEND_DIR%\logs"
set "VENV_DIR=%BACKEND_DIR%\venv"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "RESET=[0m"

echo.
echo ======================================
echo   Campus Daze - Startup Script
echo ======================================
echo.

echo [%BLUE%1/5%RESET%] Creating log directory...
if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
    echo   [%GREEN%OK%RESET%] Log directory created
) else (
    echo   [%YELLOW%SKIP%RESET%] Log directory already exists
)

echo.
echo [%BLUE%2/5%RESET%] Checking dependencies...
call :check_python
if errorlevel 1 exit /b 1

call :check_npm
if errorlevel 1 exit /b 1

echo.
echo [%BLUE%3/5%RESET%] Initializing database...
cd /d "%BACKEND_DIR%"
if exist "%VENV_DIR%\Scripts\python.exe" (
    "%VENV_DIR%\Scripts\python.exe" -c "from api.utils.database import init_sqlite_tables; init_sqlite_tables()"
) else (
    python -c "from api.utils.database import init_sqlite_tables; init_sqlite_tables()"
)
if errorlevel 1 (
    echo   [%RED%FAIL%RESET%] Database initialization failed
    exit /b 1
)
echo   [%GREEN%OK%RESET%] Database initialized

echo.
echo [%BLUE%4/5%RESET%] Starting backend service on port %BACKEND_PORT%...
call :check_port %BACKEND_PORT%
if errorlevel 1 (
    echo   [%YELLOW%WARN%RESET%] Port %BACKEND_PORT% is occupied, trying to release...
    call :release_port %BACKEND_PORT%
)

if exist "%VENV_DIR%\Scripts\uvicorn.exe" (
    start "Campus Daze Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && ""%VENV_DIR%\Scripts\uvicorn.exe"" api.main:app --host 0.0.0.0 --port %BACKEND_PORT% --log-level info"
) else (
    start "Campus Daze Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && python -m uvicorn api.main:app --host 0.0.0.0 --port %BACKEND_PORT% --log-level info"
)

call :wait_for_service http://localhost:%BACKEND_PORT% 10
if errorlevel 1 (
    echo   [%RED%FAIL%RESET%] Backend service failed to start
    exit /b 1
)
echo   [%GREEN%OK%RESET%] Backend service started

echo.
echo [%BLUE%5/5%RESET%] Starting frontend service...
cd /d "%FRONTEND_DIR%"
start "Campus Daze Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"

echo.
echo ======================================
echo   [%GREEN%ALL SERVICES STARTED%RESET%]
echo ======================================
echo.
echo Backend API:     http://localhost:%BACKEND_PORT%
echo Frontend:        http://localhost:%FRONTEND_PORT%
echo API Documentation: http://localhost:%BACKEND_PORT%/docs
echo.
echo Press any key to exit this window...
pause >nul
exit /b 0

:check_python
python --version >nul 2>&1
if errorlevel 1 (
    echo   [%RED%FAIL%RESET%] Python is not installed or not in PATH
    exit /b 1
)
for /f "tokens=2" %%a in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%a"
echo   [%GREEN%OK%RESET%] Python %PYTHON_VERSION% found
exit /b 0

:check_npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo   [%RED%FAIL%RESET%] Node.js/npm is not installed or not in PATH
    exit /b 1
)
for /f %%a in ('npm --version 2^>^&1') do set "NPM_VERSION=%%a"
echo   [%GREEN%OK%RESET%] npm %NPM_VERSION% found
exit /b 0

:check_port
netstat -ano | findstr ":%1 " >nul
if errorlevel 1 exit /b 0
exit /b 1

:release_port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%1 "') do (
    if not "%%a"=="0" (
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo   [%GREEN%OK%RESET%] Port %1 released
exit /b 0

:wait_for_service
set "URL=%1"
set "MAX_TRIES=%2"
set "TRY=0"

:wait_loop
set /a TRY+=1
curl -s -o nul -w "%%{http_code}" "%URL%" >nul 2>&1
if errorlevel 0 (
    curl -s -o nul -w "%%{http_code}" "%URL%" | findstr "200" >nul
    if not errorlevel 1 exit /b 0
)

if %TRY% geq %MAX_TRIES% (
    exit /b 1
)

echo   Waiting for service... (%TRY%/%MAX_TRIES%)
timeout /t 2 /nobreak >nul
goto wait_loop
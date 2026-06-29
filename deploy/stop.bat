@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Campus Daze - Shutdown

set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "RESET=[0m"

echo.
echo ======================================
echo   Campus Daze - Shutdown Script
echo ======================================
echo.

echo [%BLUE%1/3%RESET%] Stopping backend service (port %BACKEND_PORT%)...
call :stop_process_by_port %BACKEND_PORT%
if errorlevel 0 (
    echo   [%GREEN%OK%RESET%] Backend service stopped
) else (
    echo   [%YELLOW%SKIP%RESET%] Backend service not running
)

echo.
echo [%BLUE%2/3%RESET%] Stopping frontend service (port %FRONTEND_PORT%)...
call :stop_process_by_port %FRONTEND_PORT%
if errorlevel 0 (
    echo   [%GREEN%OK%RESET%] Frontend service stopped
) else (
    echo   [%YELLOW%SKIP%RESET%] Frontend service not running
)

echo.
echo [%BLUE%3/3%RESET%] Cleaning up orphaned processes...
call :stop_npm_process
call :stop_python_process

echo.
echo ======================================
echo   [%GREEN%ALL SERVICES STOPPED%RESET%]
echo ======================================
echo.
echo Press any key to exit...
pause >nul
exit /b 0

:stop_process_by_port
set "PORT=%1"
set "FOUND=0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% "') do (
    if not "%%a"=="0" (
        taskkill /f /pid %%a >nul 2>&1
        if not errorlevel 1 set "FOUND=1"
    )
)

if !FOUND! equ 1 exit /b 0
exit /b 1

:stop_npm_process
set "FOUND=0"
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "npm"') do (
    taskkill /f /pid %%a >nul 2>&1
    if not errorlevel 1 set "FOUND=1"
)
if !FOUND! equ 1 echo   [%GREEN%OK%RESET%] npm processes cleaned up
exit /b 0

:stop_python_process
set "FOUND=0"
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "python"') do (
    for /f "tokens=*" %%b in ('tasklist /fi "PID eq %%a" /fo list ^| findstr /i "uvicorn"') do (
        taskkill /f /pid %%a >nul 2>&1
        if not errorlevel 1 set "FOUND=1"
    )
)
if !FOUND! equ 1 echo   [%GREEN%OK%RESET%] Python/uvicorn processes cleaned up
exit /b 0
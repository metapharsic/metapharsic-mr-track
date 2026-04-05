@echo off
title Metapharsic - Starting Application...
color 0A

echo.
echo  ============================================================
echo       METAPHARSIC Target ^& Expense Manager
echo  ============================================================
echo.
echo  [*] Checking dependencies...
cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo  [*] node_modules not found. Installing dependencies...
    call npm install
    if errorlevel 1 (
        color 0C
        echo  [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo  [*] Dependencies OK.
echo.
echo  [*] Starting Metapharsic Server on port 3000...
echo  [*] The application will open in your browser shortly.
echo.
echo  ============================================================
echo   To STOP the application, close this window or press Ctrl+C
echo  ============================================================
echo.

:: Wait 3 seconds then open browser
start "" /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

:: Start the server
node node_modules/tsx/dist/cli.mjs server.ts

echo.
echo  [*] Server has stopped.
pause

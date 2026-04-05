@echo off
title Metapharsic - Stopping Application...
color 0E

echo.
echo  ============================================================
echo       METAPHARSIC Target ^& Expense Manager
echo  ============================================================
echo.
echo  [*] Stopping Metapharsic application...
echo.

:: Kill any Node.js process running on port 3000
set PORT=3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%PORT%" ^| find "LISTENING"') do (
    set PID=%%a
)

if defined PID (
    echo  [*] Found server running with PID: %PID%
    echo  [*] Terminating process...
    taskkill /PID %PID% /F >nul 2>&1
    if errorlevel 1 (
        color 0C
        echo  [WARNING] Could not terminate PID %PID%. Trying alternate method...
        taskkill /IM node.exe /F >nul 2>&1
    )
    echo  [OK] Server on port %PORT% has been stopped.
) else (
    :: Fallback: kill all node processes
    tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
    if not errorlevel 1 (
        echo  [*] Found running Node.js processes. Terminating all...
        taskkill /IM node.exe /F >nul 2>&1
        echo  [OK] All Node.js processes terminated.
    ) else (
        echo  [INFO] No running Metapharsic server found on port %PORT%.
    )
)

echo.
echo  [*] Also closing any open browser tabs? (Skipped - manual step)
echo.
color 0A
echo  ============================================================
echo   Metapharsic Application has been shut down successfully.
echo  ============================================================
echo.
timeout /t 3 /nobreak >nul
exit

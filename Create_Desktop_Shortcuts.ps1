# Metapharsic Desktop Shortcut Creator
# Run this script ONCE to create desktop icons for Start and Stop

$ProjectPath = "c:\Metapharsic_Life_Science\MR_Final_V1\metapharsic-target-&-expense-manager"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$WScriptShell = New-Object -comObject WScript.Shell

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host "       Creating Metapharsic Desktop Shortcuts..." -ForegroundColor Cyan
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------
# 1. START Shortcut
# -----------------------------------------------
$StartShortcut = $WScriptShell.CreateShortcut("$DesktopPath\Start Metapharsic.lnk")
$StartShortcut.TargetPath       = "$ProjectPath\Start_Metapharsic.bat"
$StartShortcut.WorkingDirectory = $ProjectPath
$StartShortcut.WindowStyle      = 1   # Normal window
$StartShortcut.Description      = "Start Metapharsic Target & Expense Manager"
$StartShortcut.IconLocation     = "C:\Windows\System32\shell32.dll,137"  # Green play-style icon
$StartShortcut.Save()

Write-Host "  [OK] Created: Start Metapharsic.lnk on Desktop" -ForegroundColor Green

# -----------------------------------------------
# 2. STOP / SHUTDOWN Shortcut
# -----------------------------------------------
$StopShortcut = $WScriptShell.CreateShortcut("$DesktopPath\Stop Metapharsic.lnk")
$StopShortcut.TargetPath        = "$ProjectPath\Stop_Metapharsic.bat"
$StopShortcut.WorkingDirectory  = $ProjectPath
$StopShortcut.WindowStyle       = 1
$StopShortcut.Description       = "Stop / Shutdown Metapharsic Application"
$StopShortcut.IconLocation      = "C:\Windows\System32\shell32.dll,131"  # Red stop-style icon
$StopShortcut.Save()

Write-Host "  [OK] Created: Stop Metapharsic.lnk on Desktop" -ForegroundColor Green

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host "   Desktop shortcuts created successfully!" -ForegroundColor Green
Write-Host "   - Double-click 'Start Metapharsic' to launch the app" -ForegroundColor Yellow
Write-Host "   - Double-click 'Stop Metapharsic'  to shut it down" -ForegroundColor Yellow
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 3

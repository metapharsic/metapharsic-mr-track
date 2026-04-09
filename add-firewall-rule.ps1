# Add Firewall Rule for PostgreSQL
# RUN THIS AS ADMINISTRATOR

Write-Host "Adding Windows Firewall rule for PostgreSQL..." -ForegroundColor Cyan

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName "PostgreSQL TCP 5432" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Firewall rule already exists. Updating..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "PostgreSQL TCP 5432"
}

# Create the firewall rule
try {
    New-NetFirewallRule -DisplayName "PostgreSQL TCP 5432" `
                        -Direction Inbound `
                        -LocalPort 5432 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any `
                        -Enabled True `
                        -Description "Allow external connections to PostgreSQL database for Render deployment" | Out-Null
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Firewall rule added." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "PostgreSQL port 5432 is now accessible from the internet." -ForegroundColor Cyan
    Write-Host "Your hosted Render app can now connect to your local database." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Update Render environment variables with DATABASE_URL" -ForegroundColor White
    Write-Host "2. Push code to GitHub" -ForegroundColor White
    Write-Host "3. Render will auto-deploy with database connection" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to create firewall rule." -ForegroundColor Red
    Write-Host "Make sure you're running this script as Administrator." -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to exit"

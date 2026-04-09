# PostgreSQL Quick Setup Script for Metapharsic CRM
# Run this in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Setup - Metapharsic CRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check PostgreSQL Installation
Write-Host "[1/6] Checking PostgreSQL installation..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if (-not $pgService) {
    Write-Host "❌ PostgreSQL is not installed!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "✅ PostgreSQL found: $($pgService.DisplayName)" -ForegroundColor Green
Write-Host "   Status: $($pgService.Status)" -ForegroundColor Green
Write-Host ""

# Step 2: Get PostgreSQL Version and Path
Write-Host "[2/6] Detecting PostgreSQL version and path..." -ForegroundColor Yellow
$pgPath = (Get-ItemProperty "HKLM:\SOFTWARE\PostgreSQL\Installations\*" -ErrorAction SilentlyContinue).BaseDirectory

if (-not $pgPath) {
    # Try default path
    $version = "16"  # Adjust if needed
    $pgPath = "C:\Program Files\PostgreSQL\$version\"
}

Write-Host "✅ PostgreSQL path: $pgPath" -ForegroundColor Green
Write-Host ""

# Step 3: Create Database and User
Write-Host "[3/6] Database Setup" -ForegroundColor Yellow
Write-Host "This will create:" -ForegroundColor White
Write-Host "  - Database: metaphysic_crm" -ForegroundColor White
Write-Host "  - User: metaphysic_user" -ForegroundColor White
Write-Host ""

$password = Read-Host "Enter a strong password for database user (min 8 chars)" -AsSecureString
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

if ($plainPassword.Length -lt 8) {
    Write-Host "❌ Password too short! Must be at least 8 characters." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Opening PostgreSQL command line..." -ForegroundColor Yellow
Write-Host "Please run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "psql -U postgres" -ForegroundColor Green
Write-Host ""
Write-Host "Then execute:" -ForegroundColor Cyan
Write-Host "CREATE DATABASE metaphysic_crm;" -ForegroundColor White
Write-Host "CREATE USER metaphysic_user WITH PASSWORD '$plainPassword';" -ForegroundColor White
Write-Host "GRANT ALL PRIVILEGES ON DATABASE metaphysic_crm TO metaphysic_user;" -ForegroundColor White
Write-Host "\c metaphysic_crm" -ForegroundColor White
Write-Host "GRANT ALL ON SCHEMA public TO metaphysic_user;" -ForegroundColor White
Write-Host "\q" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Have you created the database? (y/n)"
if ($continue -ne "y") {
    Write-Host "Please create the database first, then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Step 4: Configure External Access
Write-Host ""
Write-Host "[4/6] Configuring external access..." -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to edit two configuration files:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Edit postgresql.conf:" -ForegroundColor Yellow
Write-Host "   Location: $($pgPath)data\postgresql.conf" -ForegroundColor White
Write-Host "   Change: listen_addresses = '*'" -ForegroundColor Green
Write-Host ""

# Open postgresql.conf
$editPgConf = Read-Host "Open postgresql.conf now? (y/n)"
if ($editPgConf -eq "y") {
    notepad "$($pgPath)data\postgresql.conf"
    Write-Host "Find 'listen_addresses' and change to: listen_addresses = '*'" -ForegroundColor Cyan
    Read-Host "Press Enter when done"
}

Write-Host ""
Write-Host "2. Edit pg_hba.conf:" -ForegroundColor Yellow
Write-Host "   Location: $($pgPath)data\pg_hba.conf" -ForegroundColor White
Write-Host "   Add at the END:" -ForegroundColor White
Write-Host "   host    all    all    0.0.0.0/0    scram-sha-256" -ForegroundColor Green
Write-Host ""

$editHbaConf = Read-Host "Open pg_hba.conf now? (y/n)"
if ($editHbaConf -eq "y") {
    notepad "$($pgPath)data\pg_hba.conf"
    Write-Host "Add this line at the END:" -ForegroundColor Cyan
    Write-Host "host    all    all    0.0.0.0/0    scram-sha-256" -ForegroundColor Green
    Read-Host "Press Enter when done"
}

# Step 5: Restart PostgreSQL
Write-Host ""
Write-Host "[5/6] Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service $pgService.Name
Start-Sleep -Seconds 3

if ($pgService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL restarted successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Please manually restart PostgreSQL service" -ForegroundColor Yellow
    Write-Host "   Press Win+R, type: services.msc" -ForegroundColor White
    Write-Host "   Find PostgreSQL, right-click > Restart" -ForegroundColor White
}

Write-Host ""

# Step 6: Configure Firewall
Write-Host "[6/6] Configuring Windows Firewall..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -DisplayName "PostgreSQL" -ErrorAction SilentlyContinue

if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow | Out-Null
    Write-Host "✅ Firewall rule created for port 5432" -ForegroundColor Green
} else {
    Write-Host "✅ Firewall rule already exists" -ForegroundColor Green
}

# Get Public IP
Write-Host ""
Write-Host "Getting your public IP address..." -ForegroundColor Yellow
try {
    $publicIP = (Invoke-WebRequest -Uri "http://ifconfig.me/ip" -UseBasicParsing).Content.Trim()
    Write-Host "✅ Your public IP: $publicIP" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not get public IP automatically" -ForegroundColor Yellow
    Write-Host "   Visit: https://whatismyipaddress.com/" -ForegroundColor White
    $publicIP = "YOUR_PUBLIC_IP"
}

# Generate Connection String
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Database Connection String:" -ForegroundColor Yellow
Write-Host "postgresql://metaphysic_user:$plainPassword@$publicIP`:5432/metaphysic_crm" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the connection string above" -ForegroundColor White
Write-Host "2. Create/edit .env file in project root" -ForegroundColor White
Write-Host "3. Add: DATABASE_URL=postgresql://metaphysic_user:$plainPassword@$publicIP`:5432/metaphysic_crm" -ForegroundColor White
Write-Host "4. Run: npm run db:migrate" -ForegroundColor White
Write-Host "5. Run: npm run dev" -ForegroundColor White
Write-Host ""

$createEnv = Read-Host "Create .env file now? (y/n)"
if ($createEnv -eq "y") {
    $envContent = "# PostgreSQL Database Connection`nDATABASE_URL=postgresql://metaphysic_user:$plainPassword@$publicIP`:5432/metaphysic_crm`n`n# Node Environment`nNODE_ENV=development`n`n# Gemini API Key`nGEMINI_API_KEY=YOUR_GEMINI_API_KEY"
    
    $envPath = "c:\Metapharsic_Life_Science\MR_Final_V1\MR_FInal_V2\.env"
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✅ .env file created at: $envPath" -ForegroundColor Green
    Write-Host "⚠️  Remember to update GEMINI_API_KEY with your actual key" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For detailed instructions, see: POSTGRESQL_SETUP.md" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"

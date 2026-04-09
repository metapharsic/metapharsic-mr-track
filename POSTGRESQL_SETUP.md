# PostgreSQL Setup Guide for Metapharsic CRM

## Overview
This guide will help you set up PostgreSQL on your local machine and configure it to accept connections from your Render-hosted application.

---

## Step 1: Verify PostgreSQL Installation

Check if PostgreSQL is installed:
```powershell
# Check PostgreSQL service
Get-Service -Name postgresql*

# Check version
psql --version
```

If not installed, download from: https://www.postgresql.org/download/windows/

---

## Step 2: Create Database and User

### Open PostgreSQL Command Line
```powershell
# Open psql as postgres user
psql -U postgres
```

### Run These SQL Commands
```sql
-- Create the database
CREATE DATABASE metaphysic_crm;

-- Create user with strong password (CHANGE THIS!)
CREATE USER metaphysic_user WITH PASSWORD 'YourStrongPassword123!';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE metaphysic_crm TO metaphysic_user;

-- Connect to the database
\c metaphysic_crm

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO metaphysic_user;

-- Exit psql
\q
```

**⚠️ IMPORTANT**: Replace `'YourStrongPassword123!'` with a strong password (20+ characters recommended)

---

## Step 3: Configure External Access

### 3.1 Find PostgreSQL Config Files
```powershell
# Default location (adjust version number)
$pgDataPath = "C:\Program Files\PostgreSQL\16\data"

# Verify files exist
Test-Path "$pgDataPath\postgresql.conf"
Test-Path "$pgDataPath\pg_hba.conf"
```

### 3.2 Edit postgresql.conf
```powershell
# Open in Notepad (as Administrator)
notepad "$pgDataPath\postgresql.conf"
```

Find and change this line:
```conf
# FROM:
#listen_addresses = 'localhost'

# TO:
listen_addresses = '*'
```

### 3.3 Edit pg_hba.conf
```powershell
# Open in Notepad (as Administrator)
notepad "$pgDataPath\pg_hba.conf"
```

Add this line at the **END** of the file:
```conf
# Allow connections from any IP (secured with password)
host    all             all             0.0.0.0/0            scram-sha-256
```

### 3.4 Restart PostgreSQL Service
```powershell
# Restart the service
Restart-Service postgresql-x64-16

# Or use Services app
# Press Win+R, type: services.msc
# Find "postgresql-x64-16", right-click > Restart
```

---

## Step 4: Get Your Public IP Address

```powershell
# Method 1: Using curl
curl ifconfig.me

# Method 2: Using browser
# Visit: https://whatismyipaddress.com/

# Method 3: PowerShell
(Invoke-WebRequest -Uri "http://ifconfig.me/ip").Content
```

**Note your public IP**: `YOUR_PUBLIC_IP_HERE`

---

## Step 5: Configure Windows Firewall

```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

---

## Step 6: Test Local Connection

```powershell
# Test connection from your machine
psql -h localhost -p 5432 -U metaphysic_user -d metaphysic_crm

# Enter password when prompted
# If successful, you'll see: metaphysic_crm=>
```

---

## Step 7: Get Connection String

### For Local Development:
```
postgresql://metaphysic_user:YourStrongPassword123!@localhost:5432/metaphysic_crm
```

### For Render (Production):
```
postgresql://metaphysic_user:YourStrongPassword123!@YOUR_PUBLIC_IP:5432/metaphysic_crm
```

Replace:
- `YourStrongPassword123!` with your actual password
- `YOUR_PUBLIC_IP` with your public IP from Step 4

---

## Step 8: Configure Application

### Update .env file
Create or edit `.env` in the project root:
```env
DATABASE_URL=postgresql://metaphysic_user:YourStrongPassword123!@YOUR_PUBLIC_IP:5432/metaphysic_crm
NODE_ENV=production
```

**⚠️ SECURITY**: Never commit `.env` to Git!

---

## Step 9: Initialize Database

```powershell
# Navigate to project
cd c:\Metapharsic_Life_Science\MR_Final_V1\MR_FInal_V2

# Run migration script
npx tsx src/database/migrate-data.ts
```

Expected output:
```
🚀 Starting data migration to PostgreSQL...

📋 Step 1: Initializing database schema...
✅ Connected to PostgreSQL database
✅ Database schema initialized
✅ Schema initialized successfully

📋 Step 2: Reading current data...

📋 Migrating MRs...
✅ Migrated 6 MRs

📋 Migrating Users...
✅ Migrated 7 users

✅ Data migration completed successfully!

📊 Next Steps:
1. Upload your Excel data via Data Management page
2. Data will be automatically saved to PostgreSQL
3. Use AI Assignment to assign entities to MRs
4. All data will persist across server restarts!

👋 Database connection closed
```

---

## Step 10: Test Application

```powershell
# Start the application
npm run dev

# Visit: http://localhost:3000
# Upload some data and verify it persists after restart
```

---

## Troubleshooting

### Connection Refused Error
```powershell
# Check if PostgreSQL is running
Get-Service postgresql-x64-16

# Check if port 5432 is listening
netstat -an | findstr 5432
```

### Authentication Failed
- Verify username and password
- Check pg_hba.conf has the correct entry
- Restart PostgreSQL after config changes

### Firewall Blocking
```powershell
# Check firewall rules
Get-NetFirewallRule -DisplayName "PostgreSQL"

# Remove and recreate if needed
Remove-NetFirewallRule -DisplayName "PostgreSQL"
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

### IP Changed (Dynamic IP)
If your ISP changes your IP:
1. Use Dynamic DNS service (No-IP, DuckDNS)
2. Update connection string in Render environment variables
3. Restart Render deployment

---

## Security Best Practices

### 1. Use Strong Password
```sql
-- Minimum 20 characters, mix of upper/lower/numbers/symbols
ALTER USER metaphysic_user WITH PASSWORD 'VeryStrongP@ssw0rd2024!';
```

### 2. Enable SSL (Optional but Recommended)
Generate SSL certificates and configure in postgresql.conf:
```conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

### 3. Regular Backups
Create backup script (`backup.bat`):
```batch
@echo off
set PGPASSWORD=YourStrongPassword123!
set BACKUP_DIR=C:\PostgreSQL_Backups
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

pg_dump -h localhost -U metaphysic_user metaphysic_crm > "%BACKUP_DIR%\backup_%DATE%.sql"
echo Backup completed: %DATE%
```

Schedule with Windows Task Scheduler for daily backups.

### 4. Monitor Connections
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check who's connected
SELECT pid, usename, client_addr, application_name, state
FROM pg_stat_activity;
```

---

## Production Deployment on Render

### 1. Add Environment Variables
In Render Dashboard → Your Service → Environment:
```
DATABASE_URL=postgresql://metaphysic_user:YourStrongPassword123!@YOUR_PUBLIC_IP:5432/metaphysic_crm
NODE_ENV=production
```

### 2. Update package.json scripts
```json
{
  "scripts": {
    "dev": "node ./node_modules/tsx/dist/cli.mjs server.ts",
    "build": "vite build",
    "start": "NODE_ENV=production node ./node_modules/tsx/dist/cli.mjs server.ts",
    "db:migrate": "npx tsx src/database/migrate-data.ts"
  }
}
```

### 3. Push and Deploy
```bash
git add .
git commit -m "Add PostgreSQL database integration"
git push origin main
```

Render will auto-deploy with database connection.

---

## Next Steps After Setup

✅ Database configured and accessible
✅ Schema created with all tables
✅ Sample data migrated
✅ Application connected to PostgreSQL
✅ Data persists across restarts
✅ Ready for Excel uploads and AI assignment

---

## Support

If you encounter issues:
1. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\16\data\log\`
2. Verify connection string format
3. Test with psql command first
4. Check firewall rules
5. Ensure PostgreSQL service is running

---

**🎉 Congratulations! Your PostgreSQL database is now set up and ready!**

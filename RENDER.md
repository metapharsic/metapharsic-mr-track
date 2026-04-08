# Render.com Deployment Guide - Metapharsic CRM

Your application is already deployed on Render! This guide covers everything you need to manage your live deployment.

---

## 📋 Table of Contents

1. [Current Deployment Status](#current-deployment-status)
2. [Configuration Overview](#configuration-overview)
3. [Environment Variables on Render](#environment-variables-on-render)
4. [Updating Your Application](#updating-your-application)
5. [Custom Domain Setup](#custom-domain-setup)
6. [Monitoring & Logs](#monitoring--logs)
7. [Database Setup (PostgreSQL)](#database-setup-postgresql)
8. [Backups](#backups)
9. [SSL & HTTPS](#ssl--https)
10. [Scaling Up](#scaling-up)
11. [Troubleshooting](#troubleshooting)
12. [Useful Commands](#useful-commands)

---

## Current Deployment Status

### ✅ What's Already Deployed

Based on your `render.yaml`:

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Name** | `metapharsic-life-science` |
| **Runtime** | Node.js |
| **Plan** | Free |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `NODE_ENV=production node ./node_modules/tsx/dist/cli.mjs server.ts` |
| **Auto-Deploy** | Likely enabled on Git push |

**Live URL**: `https://metapharsic-life-science.onrender.com` (or similar)

### 🎯 Current Configuration

Your `render.yaml` specifies:

```yaml
services:
  - type: web
    name: metapharsic-life-science
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: NODE_ENV=production node ./node_modules/tsx/dist/cli.msp server.ts
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: VITE_GOOGLE_CLIENT_ID
        sync: false
```

**Notes**:
- `plan: free` → Render's free tier (sleeps after 15min inactivity)
- `sync: false` → You need to manually set these in Render dashboard
- Start command uses `tsx` to run TypeScript directly (correct)

---

## Configuration Overview

### Free Tier Limitations

- ❌ Sleeps after 15 minutes of inactivity
- ❌ Wakes on request (first request slow ~30s)
- ✅ 750 hours/month free (enough for 1 instance 24/7)
- ✅ No credit card required

### Paid Tier Benefits (To Upgrade)

| Feature | Free | Starter ($7/mo) | Pro ($25/mo) |
|---------|------|-----------------|--------------|
| **Always On** | ❌ | ✅ | ✅ |
| **Auto-Scale** | ❌ | ❌ | ✅ |
| **Private Services** | ❌ | ✅ | ✅ |
| **Custom Domain** | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |
| **RAM** | 512MB | 1GB | 4GB |
| **CPU** | 1 vCPU | 1 vCPU | 2+ vCPU |

---

## Environment Variables on Render

### Set Variables in Render Dashboard

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your service: `metapharsic-life-science`
3. Click **"Environment"** tab
4. Add these variables:

**Required**:
```bash
NODE_ENV=production
APP_URL=https://your-app.onrender.com
```

**Optional** (for enhanced features):
```bash
# Google OAuth (if you want real Google login)
# Get from Google Cloud Console: OAuth 2.0 Client ID
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

# Gemini AI (if you want real AI instead of fallback)
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_API_KEY=$GEMINI_API_KEY
```

**Demo Mode (No API Keys)**:
Leave `GEMINI_API_KEY` and `GOOGLE_CLIENT_ID` blank/unset. The app will:
- ✅ Use local authentication
- ✅ Use AI fallback algorithms
- ✅ Work completely standalone

**Important**: After setting environment variables:

1. Click **"Save Changes"**
2. Render will **auto-redeploy** your app
3. Wait 2-5 minutes for deployment to complete

---

## Updating Your Application

### Automatic Updates (Recommended)

If you connected GitHub:

1. Push to your repository:
```bash
git add .
git commit -m "Update feature or fix"
git push origin main
```

2. Render automatically:
   - Detects new commit
   - Pulls code
   - Runs `npm install && npm run build`
   - redeploys service

3. Check status in Render dashboard → **"Deploys"** tab

### Manual Trigger

If auto-deploy is off, or you want to force rebuild:

1. Render Dashboard → Your Service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for completion (check logs)

### Rollback

If deployment fails or introduces bugs:

1. Render Dashboard → **"Deploys"** tab
2. Find previous successful deployment
3. Click **"Promote to production"**
4. Your app rolls back to that version

---

## Custom Domain Setup

### Add Custom Domain

1. Render Dashboard → Your Service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domains"**
4. Click **"Add Custom Domain"**
5. Enter your domain: `crm.yourcompany.com`
6. Click **"Add"**

Render will provide DNS records:

```
Type: CNAME
Name: crm
Value: metapharsic-life-science.onrender.com
```

### Configure DNS

At your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

1. Add CNAME record:
   - **Host**: `crm` (or your subdomain)
   - **Value/Points to**: `metapharsic-life-science.onrender.com`
   - **TTL**: 3600 (1 hour) or automatic

2. Wait 5-30 minutes for propagation

3. Verify in Render dashboard:
   - Status: **" Connected"**
   - **"SSL certificate"** status: **Active**

### SSL/HTTPS

Render **automatically provides**:
- ✅ Free SSL certificate via Let's Encrypt
- ✅ Auto-renewal
- ✅ HTTP → HTTPS redirect
- ✅ No manual configuration needed

---

## Monitoring & Logs

### View Real-Time Logs

1. Render Dashboard → Your Service
2. Click **"Logs"** tab
3. See live logs: build output, server startup, requests

**Log Types**:
- **Build Logs**: npm install, build output
- **Request Logs**: API calls, errors, status codes
- **Runtime Logs**: Server console.log output

### Common Log Commands

**In Render Dashboard Logs tab**, search for:

```
# Server startup
Server running on http://0.0.0.0:10000

# API requests
GET /api/mrs 200 12ms

# Errors
Error: ...
```

### Set Up Log Drains (Advanced)

To send logs to external service (Datadog, Papertrail):

1. Service → **"Log Drains"**
2. Add drain (Webhook, Papertrail, LogDNA, etc.)
3. Select log types to forward

---

## Database Setup (PostgreSQL)

### Create PostgreSQL Database

Your app currently uses **in-memory data** (resets on restart). For production:

1. Render Dashboard → **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `metapharsic-db`
   - **Database**: `metapharsic`
   - **User**: (auto-generated)
   - **Region**: Same as your web service
   - **Plan**: Free (256MB) or paid as needed
3. Click **"Create Database"**

### Connect App to Database

1. Wait for database to be ready (~1-2 minutes)
2. Go to your **Web Service** → **"Environment"**
3. Add environment variable:

```bash
DATABASE_URL=postgresql://username:password@metapharsic-db.onrender.com:5432/metapharsic
```

4. Render provides this connection string in database details page → **"Connection String"**

5. Save and redeploy

### Run Database Migrations

Your app needs database schema. Create migration script:

**scripts/migrate.ts**:
```typescript
import { Client } from 'pg';

const db = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await db.connect();
  
  // Create tables (see DEPLOYMENT.md for full schema)
  await db.query(`
    CREATE TABLE IF NOT EXISTS mrs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      territory TEXT,
      base_salary INTEGER,
      -- ... more columns
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Add other tables: doctors, pharmacies, hospitals, sales, visits, etc.
  
  await db.end();
  console.log('✅ Migration complete');
}

migrate().catch(console.error);
```

**Run migration on Render**:

1. Add "Run Command" in Render service:
   ```bash
   npx tsx scripts/migrate.ts
   ```
2. Execute once
3. Remove after successful run

---

## Backups

### Automatic Backups (Render PostgreSQL)

Render provides:
- ✅ Daily automated backups (last 7 days)
- ✅ Point-in-time recovery (if enabled)
- ✅ Manual backups (on-demand)

**Configure**:
1. PostgreSQL Database → **"Backups"**
2. Toggle **"Automated Backups"** ON
3. Retention: 7 days (free) or 30 days (paid)

### Restore Backup

1. Database → **"Backups"**
2. Find backup date
3. Click **"Restore"**
4. Confirm (⚠️ overwrites current DB)

---

## SSL & HTTPS

### Render's SSL (Automatic)

- ✅ Let's Encrypt certificate
- ✅ Auto-renewal every 90 days
- ✅ HTTP → HTTPS 301 redirect
- ✅ Wildcard certificate for custom domains

**Verify**:
1. Visit `https://your-app.onrender.com`
2. Click padlock icon in browser
3. Certificate should be valid

**Force HTTPS** (already enabled):
Render automatically redirects HTTP → HTTPS.

---

## Scaling Up

### Upgrade Plan

1. Render Dashboard → Your Service
2. Click **"Settings"**
3. **"Plans"** section → **"Change Plan"**
4. Select: Free → Starter ($7/mo) or Pro ($25/mo)
5. Confirm

### Add More Instances (Horizontal Scaling)

1. Service → **"Scaling"** tab
2. **"Instances"** → Increase count (paid plans only)
3. Set **"Min"** and **"Max"** for auto-scaling

### Add Redis for Caching/Sessions

1. Render → **"New"** → **"Redis"**
2. Name: `metapharsic-redis`
3. Plan: Free (256MB) or paid
4. Add env var:
   ```bash
   REDIS_URL=redis://username:password@metapharsic-redis.onrender.com:6379
   ```

---

## Monitoring & Alerts

### Render's Built-in Monitoring

**Available Metrics**:
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

**View**: Service → **"Metrics"** tab

### Set Up Alerts

1. Service → **"Alerts"**
2. Add alert:
   - **Condition**: CPU > 80% for 5min
   - **Notifier**: Email, Slack, Discord, Webhook
3. Save

**Recommended Alerts**:
- CPU > 80% (performance degradation)
- Memory > 90% (OOM risk)
- Instance count = 0 (service down)
- Deploy failed

---

## Troubleshooting

### Issue: "Application Error" on Live URL

**Cause**: Build or startup failed

**Fix**:
1. Check Render Logs → **"Build"** tab
2. Look for errors: `npm install` failures, TypeScript errors
3. Fix locally → push to trigger new deploy

---

### Issue: 502 Bad Gateway

**Cause**: App crashed or not listening on correct port

**Fix**:
Render sets `PORT` environment variable. Ensure `server.ts` uses:

```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Your current start command is correct: uses `PORT` from env.

---

### Issue: Environment Variables Not Working

**Cause**: Variables not set in Render dashboard

**Fix**:
1. Service → **"Environment"**
2. Verify all variables listed
3. **"Save Changes"**
4. Manual redeploy

**Note**: `sync: false` in `render.yaml` means Render doesn't auto-sync from your local `.env`. You must manually set them in dashboard.

---

### Issue: Database Connection Fails

**Cause**: `DATABASE_URL` not set or incorrect

**Fix**:
1. Create PostgreSQL instance on Render
2. Copy connection string from database → **"Connection String"**
3. Add to Web Service → **"Environment"**:
   ```bash
   DATABASE_URL=postgresql://...
   ```
4. Redeploy

---

### Issue: App Won't Start (tsx errors)

**Cause**: Missing `tsx` in dependencies or wrong version

**Fix**: Ensure `tsx` in `package.json` devDependencies:

```json
"devDependencies": {
  "tsx": "^4.21.0"
}
```

Render runs `npm ci --only=production` by default. To include devDependencies:

**Option 1**: In Render service → **"Build Command"**:
```bash
npm install && npm run build
```
(Already in your config - ✅ good)

**Option 2**: Change to:
```bash
npm ci && npm run build
```

---

### Issue: Free Tier Sleeps Too Often

**Symptom**: First request after inactivity takes 20-30s

**Cause**: Free tier sleeps after 15min

**Solutions**:
1. **Upgrade** to Starter ($7/mo) → Always On
2. **Keep-alive ping** (not recommended, against ToS)
3. Accept as free tier limitation

---

## Useful Commands

### Local Commands

```bash
# Start development server
npm run dev

# Type check
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build artifacts
npm run clean
```

### Deploy-Related Scripts (Optional)

Add to `package.json`:

```json
"scripts": {
  "deploy": "git push origin main",
  "rollback": "git revert HEAD && git push origin main"
}
```

---

## Post-Deployment Checklist

After your first deployment:

- [ ] **Verify Live URL** loads successfully
- [ ] **Login** with demo credentials works
- [ ] **Test core features**:
  - [ ] View MR Dashboard
  - [ ] Start a visit in Field Tracker
  - [ ] Check Directory
  - [ ] Create a sale/expense
- [ ] **Set environment variables** for OAuth/Gemini (if needed)
- [ ] **Configure custom domain** (optional)
- [ ] **Set up alerts** for downtime
- [ ] **Enable database backups** (if using PostgreSQL)
- [ ] **Monitor logs** for errors first 24 hours
- [ ] **Share URL** with team

---

## Render-Specific Tips

### Build Optimization

Render builds from scratch each time. To speed up:

```yaml
# render.yaml
buildCommand: |
  npm ci --only=production --prefer-offline && npm run build
```

### Health Checks

Render automatically checks `/` endpoint. Ensure root route returns `200 OK`.

Add health endpoint if needed:

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Static Files

Vite builds to `dist/`. Express serves automatically:

```typescript
import express from 'express';
const app = express();

// Serve static files
app.use(express.static('dist'));

// All routes return index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

Your current `server.ts` already handles this.

---

## Cost Management

### Free Tier
- 750 hours/month (31 days continuous)
- 512MB RAM
- 0.1-0.2 vCPU
- Sleeps after 15min

### Paid Tiers (as of 2025)
- **Starter**: $7/mo → 1GB RAM, always on
- **Pro**: $25/mo → 4GB RAM, auto-scale

**Monitor Usage**:
Render Dashboard → **Billing** → View usage graphs

**Set Budget Alert**:
1. Render → **Billing**
2. **"Billing Alerts"** → Set threshold ($5, $10, etc.)
3. Get email when spending exceeds threshold

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com

### Common Render Issues

**Build fails with "Cannot find module"**:
→ Ensure all dependencies in `package.json` (not devDependencies if using production-only install)

**Static files 404**:
→ Check `app.use(express.static('dist'))` in `server.ts`

**Websocket/real-time not working**:
→ Use `ws` library + configure websocket support in Render (need dedicated websocket service)

---

## What's Next?

1. **Custom domain**: Add your company domain
2. **PostgreSQL**: Migrate from in-memory to persistent DB
3. **Monitoring**: Set up error tracking (Sentry)
4. **CDN**: Add CloudFlare for caching & DDoS protection
5. **CI/CD**: Add GitHub Actions for tests before deploy
6. **Upgrade**: Move to paid tier for always-on

---

## Quick Reference

| Action | Where |
|--------|-------|
| Redeploy | Dashboard → Manual Deploy |
| View Logs | Dashboard → Logs |
| Set Env Vars | Dashboard → Environment |
| Add Custom Domain | Dashboard → Settings → Custom Domains |
| View Metrics | Dashboard → Metrics |
| Rollback | Dashboard → Deploys → Promote old |
| Add Database | Dashboard → New → PostgreSQL |
| Get Support | https://render.com/help |

---

**Your app is live! 🎉**  
URL: `https://metapharsic-life-science.onrender.com`

---

**End of RENDER.md**

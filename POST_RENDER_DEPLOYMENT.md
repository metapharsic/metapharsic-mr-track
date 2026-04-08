# ✅ Post-Render Deployment Checklist

Your Metapharsic CRM is now live on Render! This checklist will help you finalize your deployment.

---

## 📅 Completed ✓

- [x] Code pushed to GitHub
- [x] Render service created
- [x] Application builds successfully
- [x] App is accessible at `https://metapharsic-life-science.onrender.com`
- [x] `render.yaml` configuration in place

---

## 🔧 Immediate Configuration

### 1. Set Environment Variables

**Go to**: Render Dashboard → Your Service → **Environment** tab

**Add these variables**:

```bash
# Required for production features
APP_URL=https://your-app.onrender.com

# Optional - Enable these for production use:

# Google OAuth (if you want real Google login)
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

# Gemini AI (if you want real AI instead of fallback)
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_API_KEY=$GEMINI_API_KEY

# Database (if using PostgreSQL on Render)
# DATABASE_URL=postgresql://username:password@host:5432/dbname
```

**Leave blank** for demo mode:
- `GEMINI_API_KEY` → uses local AI fallback
- `GOOGLE_CLIENT_ID` → uses demo login

After adding variables → **Save Changes** → Render will auto-redeploy (2-5 min)

---

### 2. Add Custom Domain (Optional)

**Do you want a custom domain?** e.g., `crm.yourcompany.com`

**Steps**:
1. Render Dashboard → **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter domain (e.g., `crm.yourcompany.com`)
4. Add CNAME in your DNS:
   ```
   Type: CNAME
   Name: crm
   Value: metapharsic-life-science.onrender.com
   ```
5. Wait 5-30 min for propagation
6. SSL auto-configured ✅

---

### 3. Create PostgreSQL Database (For Production Data)

**Current**: App uses in-memory data (resets on restart)

**For persistent storage**:

1. Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - Name: `metapharsic-db`
   - Database: `metapharsic`
   - Plan: Free (256MB) or paid
   - Region: Same as your web service
3. Click **"Create Database"**
4. Wait 1-2 min for provisioning
5. Copy **Connection String** from database page
6. Add to Web Service → **Environment**:
   ```bash
   DATABASE_URL=postgresql://username:password@metapharsic-db.onrender.com:5432/metapharsic
   ```
7. Redeploy app

---

### 4. Run Database Migration

Once `DATABASE_URL` is set, migrate data from in-memory to PostgreSQL:

**Create migration script** (`scripts/migrate.ts`):

```typescript
import { Client } from 'pg';

const db = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await db.connect();

  // Create all tables (see DEPLOYMENT.md for full schema)
  await db.query(`
    CREATE TABLE IF NOT EXISTS mrs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      territory TEXT,
      base_salary INTEGER,
      daily_allowance INTEGER,
      joining_date DATE,
      phone VARCHAR(20),
      email VARCHAR(255) UNIQUE,
      status VARCHAR(20),
      performance_score INTEGER,
      total_sales INTEGER DEFAULT 0,
      targets_achieved INTEGER DEFAULT 0,
      targets_missed INTEGER DEFAULT 0,
      avatar_url TEXT,
      user_id INTEGER,
      role VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Add more tables: doctors, pharmacies, hospitals, products, etc.
  // See full schema in DEPLOYMENT.md

  await db.end();
  console.log('Migration complete');
}

migrate().catch(console.error);
```

**Run migration**:
1. Render Dashboard → Your Service → **"Shell"** tab
2. Run:
   ```bash
   npx tsx scripts/migrate.ts
   ```
3. Check output for `Migration complete`
4. Once verified, remove the script (or keep for future migrations)

---

## 🧪 Post-Deployment Testing

Once deployment completes, verify these features:

### ✅ Basic Functionality

- [ ] **Homepage** loads at `https://your-app.onrender.com`
- [ ] **Login** works with demo credentials
- [ ] **Dashboard** displays data (even if in-memory)
- [ ] **Navigation** works (sidebar links)
- [ ] **No console errors** (check browser DevTools)

### ✅ Core Features (Test as Admin)

1. [ ] **Directory** → Browse doctors/pharmacies/hospitals
2. [ ] **Sales** → Create a test sale
3. [ ] **Expenses** → Create expense, see it in list
4. [ ] **MR Dashboard** → View schedules (as admin select MR)
5. [ ] **Field Tracker** → Complete a test visit (GPS optional)
6. [ ] **Global Search** → Press `Ctrl+K`, search "Dr."

### ✅ Core Features (Test as MR)

1. [ ] **Login** as MR (`rajesh.kumar@metapharsic.com` / any)
2. [ ] **MR Dashboard** → Shows own data only
3. [ ] **Check-in** → GPS captures (allow permission)
4. [ ] **Start Visit** → Complete field tracker workflow
5. [ ] **Daily Schedule** → View recommendations

### ✅ AI Features (If Configured)

If you set `GEMINI_API_KEY`:
- [ ] Voice recording shows AI analysis (lead detection)
- [ ] Doctor profile shows visit frequency analysis
- [ ] Sales forecasting displays with confidence intervals
- [ ] Expense insights button works

If **not** configured (blank):
- [ ] AI features still show results (local fallback)
- [ ] Console shows `Gemini API not configured - returning mock forecast`

---

## 📊 Monitoring Setup

### Enable Alerts (Recommended)

Render → Your Service → **Alerts** tab → Add alerts:

| Metric | Threshold | Notifier |
|--------|-----------|----------|
| CPU > 80% | 5 minutes | Email |
| Memory > 90% | 5 minutes | Email |
| Instance Count = 0 | Immediate | Email |
| Deploy Failed | Immediate | Email |

### Check Logs Regularly

Render → **Logs** tab:
- **Build Logs**: npm install, build output
- **Request Logs**: API errors, 404s, slow responses
- **Runtime Logs**: Server-side console.log

Look for:
- ❌ `Error: ENOENT` - missing files
- ❌ `UnhandledPromiseRejection` - uncaught errors
- ❌ `EADDRINUSE` - port conflict (unlikely on Render)

---

## 💾 Backup Strategy

### If Using Render PostgreSQL

Render provides automatic daily backups (7 days retention). To enable:

1. PostgreSQL Database → **"Backups"**
2. Toggle **"Automated Backups"** to ON
3. Retention: 7 days (free) or 30 (paid)
4. Manual backup: Click **"Create Backup"**

### Backup In-Memory Config (Not Recommended)

⚠️ In-memory data **will be lost** on:
- Service restart
- Deployment
- Render instance rotation

**Solution**: Migrate to PostgreSQL ASAP (see step 3 above)

---

## 🆗 Upgrade Considerations

### Free Tier Limitations

| Issue | Solution |
|-------|----------|
| Sleeps after 15min | Upgrade to Starter ($7/mo) |
| 512MB RAM limit | Upgrade to Pro ($25/mo, 4GB) |
| No auto-scaling | Pro tier supports auto-scale |
| Single instance only | Paid tiers allow multiple |

**To upgrade**:
Render Dashboard → Your Service → **Settings** → **"Plans"** → Select paid plan

---

## 🔐 Security Hardening

### Change Default Credentials

Update demo users before going live:

```bash
# Start dev server
npm run dev

# Open browser console on login page
localStorage.setItem('metapharsic_users', '[]');
// Then manually create admin via UI or PostgreSQL
```

Or create SQL migration to set admin password hash.

### Disable Demo Mode (Production)

In `AuthContext.tsx`, change:

```typescript
// Current: accepts any password for existing users
if (foundUser) {
  setUser(foundUser); // no password check
  return { success: true };
}
```

To (use bcrypt):
```typescript
import bcrypt from 'bcrypt';
const valid = await bcrypt.compare(password, foundUser.password_hash);
```

---

## 📱 Mobile Testing

Test on real devices:

1. Open `https://your-app.onrender.com` on phone
2. Check:
   - [ ] Layout responsive (no horizontal scroll)
   - [ ] Touch targets ≥ 44px
   - [ ] GPS works (use phone, not desktop)
   - [ ] Camera/upload works
   - [ ] Voice recording works (permissions)

---

## 🐛 Known Issues & Solutions

### Issue: First Request Takes 30 Seconds

**Cause**: Free tier wakes from sleep

**Solution**: Upgrade to paid tier for "Always On", or accept delay

### Issue: GPS Not Capturing

**Cause**: Browser requires HTTPS for geolocation

**Solution**:
- Render provides HTTPS ✅
- User must grant location permission
- Desktop: Less accurate than phone GPS

### Issue: Voice Recording Silent

**Cause**: Browser microphone permission denied

**Solution**:
- User must allow microphone on page load
- Chrome: Secure context required (HTTPS) ✅
- Firefox: May need to enable in settings

---

## 📞 Getting Help

**Documentation**: Start with [QUICKSTART.md](QUICKSTART.md)

**Render-Specific**: See [RENDER.md](RENDER.md)

**Common Issues**:
1. Check Render Logs (Dashboard → Logs)
2. Verify environment variables
3. Test API endpoints directly:
   ```bash
   curl https://your-app.onrender.com/api/mrs
   ```
4. Search existing [GitHub Issues](https://github.com/yourorg/metapharsic-crm/issues)

**Contact**:
- Email: metapharsic-team@metapharsic.com
- Render Support: https://render.com/help

---

## 🎉 Success Criteria

By the end of this checklist, you should have:

- ✅ **Live application** at your Render URL
- ✅ **Environment variables** configured (at least `APP_URL`)
- ✅ **Verified functionality** - core features working
- ✅ **Testing complete** - admin & MR workflows
- ✅ **Monitoring active** - alerts set up
- ✅ **Documentation updated** (if customizing)

---

## 📚 Next Steps

1. **Read Full Documentation**:
   - [FEATURES.md](FEATURES.md) - Understand all features
   - [API.md](API.md) - Know all endpoints
   - [AGENTS.md](AGENTS.md) - Learn architecture

2. **Customize for Your Needs**:
   - Update dummy data in `server.ts`
   - Add company branding (logo, colors)
   - Configure real OAuth/Gemini if desired
   - Migrate to PostgreSQL

3. **Invite Users**:
   - Share URL with team
   - Provide demo credentials (or create real accounts)
   - Conduct training session

4. **Plan Production Upgrade**:
   - Upgrade Render plan ($7/mo Starter recommended)
   - Set up PostgreSQL (data persistence)
   - Implement proper authentication (bcrypt)
   - Add audit logging
   - Set up regular backups

---

## 🏆 Deployment Status

✅ **Live**: Application is accessible at your Render URL  
✅ **Building**: Auto-deploy on git push configured  
✅ **Docs**: All guides created and updated  
⏳ **Testing**: Manual verification recommended  
⏳ **Database**: PostgreSQL migration pending (if needed)  
⏳ **Production**: Security hardening recommended  

---

**You're up and running! 🚀**

**Live URL**: `https://metapharsic-life-science.onrender.com`

Questions? See [RENDER.md](RENDER.md) for detailed management guide.

---

**End of POST_RENDER_DEPLOYMENT.md**

# Quick Reference - Testing & Running the Application

## 🚀 Starting the Application

The application is **already running** on `http://localhost:3000`

If you need to restart:

```powershell
# Stop the current server (if needed)
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Start the server
npm run dev
```

---

## 👥 Demo User Credentials

### Admin User
- **Email**: `admin@metapharsic.com`
- **Password**: `admin123` (or any password in demo mode)
- **Permissions**: Full access to all data
- **Can See**: All 7 MRs, all 54 doctors across all territories

### MR Users

#### Rajesh Kumar (MR ID: 1)
- **Email**: `rajesh.kumar@metapharsic.com`
- **Password**: Any (demo mode)
- **Territory**: Hyderabad West (Kukatpally, Gachibowli, Miyapur)
- **Can See**: Only 2 doctors in his territory

#### Other MRs Available:
- `suresh.raina@metapharsic.com` - Hyderabad Central
- `priya.sharma@metapharsic.com` - Hyderabad East
- `amit.patel@metapharsic.com` - Hyderabad North
- `neha.gupta@metapharsic.com` - Hyderabad South
- `vikram.singh@metapharsic.com` - Cyberabad
- `raviteja.mr@gmail.com` - Hyderabad East Extended

---

## 🧪 Testing Phase 1

### Option 1: Automated Test Script

```powershell
# Run the comprehensive test script
.\test_phase1.ps1
```

This will test all 7 scenarios and verify MR data isolation.

### Option 2: Manual Testing

1. **Open Application**: `http://localhost:3000`

2. **Login as Admin**:
   - Email: `admin@metapharsic.com`
   - Password: `admin123`
   - Navigate to "Directory" → Should see 54 doctors

3. **Login as MR**:
   - Logout
   - Email: `rajesh.kumar@metapharsic.com`
   - Password: (any)
   - Navigate to "Directory" → Should see only 2 doctors
   - Navigate to "Sales" → Should see only own sales
   - Navigate to "Expenses" → Should see only own expenses

### Option 3: API Testing with curl

```bash
# Admin - Get all doctors
curl http://localhost:3000/api/doctors `
  -H "Authorization: Bearer admin@metapharsic.com"

# MR - Get only territory doctors
curl http://localhost:3000/api/doctors `
  -H "Authorization: Bearer rajesh.kumar@metapharsic.com"

# Admin - Get all MRs
curl http://localhost:3000/api/mrs `
  -H "Authorization: Bearer admin@metapharsic.com"

# MR - Get only own record
curl http://localhost:3000/api/mrs `
  -H "Authorization: Bearer rajesh.kumar@metapharsic.com"
```

---

## 📊 Expected Results

### Admin View
- **Doctors**: 54 total across 11 territories
- **MRs**: 7 total
- **Sales**: All sales records
- **Expenses**: All expense records
- **Schedules**: All visit schedules

### MR View (Rajesh Kumar Example)
- **Doctors**: 2 (Hyderabad West only)
- **MRs**: 1 (own record only)
- **Sales**: 1 (own sales only)
- **Expenses**: 2 (own expenses only)
- **Schedules**: 11 (own schedules only)

---

## 🔍 Debugging Tips

### If MR sees all doctors instead of filtered:

1. Check authentication header is being sent:
   ```typescript
   // In browser DevTools → Network tab
   // Look for Authorization header in API requests
   ```

2. Verify user context in AuthContext:
   ```typescript
   // Check localStorage
   localStorage.getItem('metapharsic_current_user')
   ```

3. Check server logs:
   ```
   [HTTP] GET /api/doctors
   // Should show user context in middleware
   ```

### If tests fail:

1. Ensure server is running on port 3000
2. Check that test script uses correct email format
3. Verify no typos in territory names (case-sensitive)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Backend API with filtering middleware |
| `src/contexts/AuthContext.tsx` | Frontend authentication |
| `src/components/HealthcareDirectory.tsx` | Auto-filtering for MRs |
| `test_phase1.ps1` | Automated test script |
| `PHASE1_REPORT.md` | Detailed implementation report |
| `ULTRA_PLAN.md` | Updated with Phase 1 status |

---

## 🎯 Next: Phase 2 Implementation

To start Phase 2 (Daily Briefing Notifications):

1. Review requirements in `ULTRA_PLAN.md` (Phase 2 section)
2. Implement `/api/daily-briefing` endpoint
3. Create AI optimization algorithm
4. Build Morning Briefing Modal component

**Estimated Time**: 1 week

---

## 📞 Support

- **Documentation**: See `PHASE1_REPORT.md` for detailed analysis
- **API Reference**: See `API.md` for all endpoints
- **Architecture**: See `AGENTS.md` for system overview
- **Quick Start**: See `QUICKSTART.md`

---

**Last Updated**: April 9, 2026  
**Status**: Phase 1 ✅ Complete

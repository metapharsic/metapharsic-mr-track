# UltraPlan: MR Field Tracking & AI Forecasting System

**Vision**: A complete MR productivity system where AI optimizes daily scheduling, territory coverage, and lead conversion while maintaining strict data isolation.

---

## 🎯 Core Principles

1. **MR Data Privacy**: MRs see ONLY their assigned territory and their own data
2. **Proactive Intelligence**: AI doesn't just analyze—it recommends daily actions
3. **Seamless Capture**: Field tracker captures EVERYTHING automatically (GPS, time, voice, photo)
4. **Admin Oversight**: Managers monitor but cannot see MRs' private notes/conversations
5. **Continuous Learning**: Each visit improves AI forecasting for next steps

---

## 📊 Current State Assessment

### ✅ What Works Now

- **Authentication**: Role-based (Admin/MR) works
- **API endpoints**: 50+ endpoints exist but some MR filtering is incomplete
- **Field Tracker**: GPS, photo, voice recording functional
- **AI Services**: Lead scoring, frequency analysis, sentiment with fallbacks
- **In-memory data**: Seeded doctors with territories

### ⚠️ Gaps Identified

1. **MR data isolation incomplete**:
   - `src/services/api.ts` - Many endpoints don't filter by `mr_id` properly
   - `server.ts` - Endpoints return all data, not filtered by MR
   - `src/components/HealthcareDirectory.tsx` - Shows all doctors, not territory-filtered

2. **Notifications system missing**:
   - No push/scheduled notifications for morning briefings
   - No AI-generated "recommended visits today" alerts
   - No missed visit alerts

3. **Territory-based filtering needed**:
   - MRs should only see doctors in their territory
   - Territory not linked to MR user records
   - Directory needs territory filter (auto-applied for MRs)

4. **Admin Field Tracker needs separation**:
   - Currently `MRFieldTracker` is MR-focused
   - Need `AdminFieldTracker` or permission-based view
   - Admin should see all MRs' locations/status, not edit visits

5. **AI forecasting for daily plan**:
   - `DailyCallPlan` exists but AI logic weak
   - Needs territory optimization (cluster visits geographically)
   - Needs time-slot optimization (respect doctor visit windows)
   - Needs predictive ordering (high-value first)

6. **Visit capture completeness**:
   - Currently captures basics (GPS, photo, voice)
   - Missing: route tracking, wait time auto-detection, departure confirmation
   - Need: check-out auto-trigger when leaving geofence

---

## 🎯 Detailed Requirements

### Requirement 1: Strict MR Data Isolation

**Every API endpoint must filter by MR**:

```typescript
// Current problem:
GET /api/doctors → returns ALL doctors

// Required behavior:
GET /api/doctors?mr_id=1 → returns ONLY doctors in MR's territory
// OR: if MR logged in, auto-filter by their territory
```

**Implementation**:

1. **Add `territory` field to MR records**:
   - `server.ts` - `data.mrs[].territory` already exists
   - But doctors need `territory` field matching MR's territory

2. **Update all list endpoints**:
   ```typescript
   // In server.ts for each endpoint:
   app.get('/api/doctors', async (req, res) => {
     const { mr_id } = req.query;
     let doctors = data.doctors;

     // If mr_id provided, filter by territory
     if (mr_id) {
       const mr = data.mrs.find(m => m.id === Number(mr_id));
       if (mr) {
         doctors = doctors.filter(d => d.territory === mr.territory);
       }
     }

     res.json(doctors);
   });
   ```

3. **Frontend auto-filter**:
   - In `useEffect` hooks, always pass current `user.mr_id` to API calls
   - In `HealthcareDirectory.tsx`, default `mr_id` filter for MR users
   - Hide territory selector for MRs (auto-assigned)

---

### Requirement 2: Smart Morning Notifications

**System**: Daily 6 AM (or configurable) AI-generated briefings

**Delivery**:
- In-app notification panel
- Optional email/SMS (if configured)

**Content**:
```
🗓️ Your Day - Tuesday, Apr 8

📍 Today's Optimized Schedule (5 visits):
1. 09:00 - Dr. Priya Nair (Cardiologist) - A-Tier
   📍 Fortis Clinic (2.3km from last)
   AI Note: High engagement - last order ₹50K, follow-up needed

2. 10:30 - Dr. Ramesh Sharma (Cardiologist) - A-Tier
   📍 Sharma Clinic (1.8km from previous)
   AI Note: Product inquiry detected in last call - priority HIGH

3. 14:00 - Dr. Amit Gupta (General) - B-Tier
   📍 City Hospital (5.1km)
   AI Note: 30 days since last visit - overdue

4. 16:00 - Dr. Suresh Patel (Cardiologist) - A-Tier
   📍 Care Clinic (3.2km)
   AI Note: New product sample ready for demo

5. 17:15 - Dr. Meena Shah (Neurologist) - C-Tier
   📍 Neuro Center (4.8km)
   AI Note: Potential conversion - 60% lead score

🚗 Optimized Route: Reduces travel time by 23% vs chronological
📈 Expected orders today: ₹1,25,000 - ₹1,75,000

[View Full Schedule] [Start Navigation]
```

**AI Calculation**:
1. Get all unsent schedules for MR for today
2. Get doctor AI scores (`geminiService.forecastEntityLead()`)
3. Calculate:
   - Distance between clinics (geocoding API or cached coords)
   - Doctor visit windows (`mr_visit_window` field)
   - Historical order value
   - Overdue status
4. Solve Traveling Salesman Problem (simplified):
   - Sort by: (priority_score, distance_to_previous, time_window_match)
5. Generate briefing

**Implementation**:
```typescript
// New endpoint: GET /api/daily-briefing?mr_id=1&date=2025-04-08
{
  date: "2025-04-08",
  schedule: [
    {
      rank: 1,
      doctor_name: "Dr. Priya Nair",
      scheduled_time: "09:00",
      clinic: "Fortis Clinic",
      tier: "A",
      distance_from_previous: 2.3,
      ai_score: 85,
      ai_reasoning: "High engagement - last order ₹50K",
      expected_order: 75000,
      visit_window_match: true
    }
  ],
  total_expected_value: 150000,
  total_travel_km: 17,
  optimized_route_percentage: 23
}
```

---

### Requirement 3: Territory-Based Healthcare Directory

**Current Problem**: `HealthcareDirectory.tsx` shows all doctors

**Required**:
- **MR sees**: Only doctors where `doctor.territory === user.territory`
- **Admin sees**: All doctors (or filter by territory)

**Implementation**:

1. **Add territory to User/Auth**:
   ```typescript
   // In AuthContext, when user logs in:
   const userWithTerritory = {
     ...user,
     territory: mr?.territory // Link MR → territory
   };
   ```

2. **Auto-filter in API**:
   ```typescript
   // GET /api/doctors
   // If query includes mr_id, filter by that MR's territory
   // If user is authenticated middleware, auto-filter
   ```

3. **Frontend changes**:
   ```tsx
   // HealthcareDirectory.tsx
   const { user } = useAuth();

   useEffect(() => {
     if (user?.role === 'mr') {
       // Only fetch my territory
       setFilters({ ...filters, mr_id: user.mr_id });
     }
   }, [user]);
   ```

4. **UI changes**:
   - Hide territory dropdown for MRs (locked to their territory)
   - Show banner: "Showing your territory only"
   - Admin can switch territories via dropdown

---

### Requirement 4: Dual-Purpose Field Tracker

**Current**: `MRFieldTracker.tsx` - MR-only

**Required**:
- **MR uses**: To record THEIR visits (5-step workflow)
- **Admin uses**: To view ALL MRs' real-time status on map

**Solution**:

**Option A: Single component with role-based UI**:

```tsx
// MRFieldTracker.tsx
export default function MRFieldTracker() {
  const { user } = useAuth();

  // MR role → show field capture UI
  // Admin role → show map/list of all active MRs

  if (user?.role === 'mr') {
    return <MRFieldCapture />;
  } else if (['admin', 'manager'].includes(user.role)) {
    return <AdminMRMonitor />;
  }
}
```

**Option B: Separate components** (cleaner):
- Keep `MRFieldTracker` as-is (MR workflow)
- Create new `AdminMRTracking` (already exists as `MRTracking.tsx`)

**Admin MR Tracking features**:
- Map showing all MRs with pins
- Real-time location (from `api.locations`)
- Current activity (idle, traveling, visiting)
- Today's completed vs scheduled visits
- Alert if MR hasn't checked in >2 hours
- Click MR → see today's timeline

**Data needed**:
- `GET /api/mr-locations?date=today` - all MR GPS points
- `GET /api/attendance` - check-in status
- `GET /api/visit-records` - completed visits
- Real-time WebSocket (future) for live updates

---

### Requirement 5: AI Forecasting & Lead Conversion

**Current AI capabilities**:
- ✅ `geminiService.forecastLead()` - lead scoring from text
- ✅ `geminiService.analyzeVisitFrequency()` - visit patterns
- ✅ `geminiService.forecastEntityLead()` - entity potential

**Gaps**:
- ❌ Not automatically triggered after visit recording
- ❌ Lead not auto-created when `detected_lead = true`
- ❌ No daily plan AI optimization (see Requirement 2)
- ❌ No "next visit prediction" date calculation

**Required Enhancements**:

1. **Auto-create leads from voice**:
   ```typescript
   // After visit recording saved:
   if (recording.detected_lead) {
     await api.leads.create({
       doctor_name: recording.entity_name,
       specialty: doctor.specialty,
       territory: doctor.territory,
       comments: `Auto-created from voice: ${recording.lead_details?.interest_topic}`,
       priority: recording.lead_details?.follow_up_needed ? 'high' : 'medium',
       status: 'new'
     });
   }
   ```

2. **Predict next visit date**:
   ```typescript
   // After visit completion, analyze frequency
   const analysis = await geminiService.analyzeVisitFrequency(
     pastVisits,
     doctorName,
     'doctor'
   );

   // Update doctor with recommendation
   await api.doctors.update(doctorId, {
     recommended_next_visit: analysis.next_recommended_date,
     visit_frequency_analysis: analysis
   });
   ```

3. **Daily plan AI optimizations** (see Requirement 2):
   - Cluster by geography
   - Respect time windows
   - Prioritize by AI score × order potential
   - Avoid backtracking

4. **Lead conversion prediction**:
   ```typescript
   // On MR dashboard, show doctor cards with conversion probability
   <DoctorCard
     name="Dr. Sharma"
     leadProbability={75} // from AI
     expectedOrder={120000}
     daysSinceLastVisit={5}
     recommendedAction="Call within 2 days - high probability"
   />
   ```

---

## 🏗️ Implementation Phases

### Phase 1: MR Data Isolation (Critical - Week 1) ✅

**Status**: ✅ **COMPLETE & VERIFIED** (April 9, 2026)

**Goal**: MRs only see their territory's data

**Test Results**:
- ✅ Admin sees ALL 54 doctors across 11 territories
- ✅ MR (Rajesh Kumar) sees ONLY 2 doctors from Hyderabad West
- ✅ MR sees only own sales, expenses, schedules
- ✅ All 18 API endpoints filter correctly

**Tasks Completed**:

1. ✅ **Add territory to doctor entity**:
   - `server.ts` - doctors already have `territory` field
   - Verified: doctor.territory matches mr.territory

2. ✅ **Update API endpoints** - ALL implemented:
   - `GET /api/doctors` - filter by territory ✅
   - `GET /api/sales`, `/api/expenses`, `/api/leads` - filter by mr_id ✅
   - `GET /api/visit-records`, `/api/attendance`, `/api/activities` - filter by mr_id ✅
   - `GET /api/visit-recordings`, `/api/visit-schedules`, `/api/doctor-visits` - filter by mr_id ✅
   - `GET /api/approval-requests` - MR sees own, admin sees all ✅
   - `GET /api/entity-credits` - filter by territory entities ✅
   - `GET /api/mr-locations`, `/api/notifications` - filter by mr_id ✅
   - `GET /api/mrs` - MR sees own, admin sees all ✅

3. ✅ **Add middleware for auth-based filtering** (`server.ts` lines 736-777):
   - Authentication middleware extracts user from Bearer token
   - `filterByTerritory()` helper for territory-based filtering
   - `filterByMrId()` helper for mr_id-based filtering

4. ✅ **Fix HealthcareDirectory component** (`HealthcareDirectory.tsx`):
   - Auto-filter for MRs (lines 49-56)
   - Auto-set form territory when creating entities (lines 71-75)

5. ✅ **Test** - Test script created: `test_phase1.ps1`
   - Login as MR → verified only sees territory doctors
   - Login as admin → sees all data
   - API testing → all endpoints filter correctly

---

### Phase 2: Daily Briefing Notifications (Week 2) ✅

**Status**: ✅ **COMPLETE** - Routes & Components Already Configured (April 9, 2026)

**Goal**: MR gets morning briefing with AI-optimized schedule

**Test Results**:
- ✅ `/api/daily-briefing` endpoint implemented (server.ts line 1076)
- ✅ Morning Briefing Modal component created
- ✅ Integrated into MRDashboard component
- ✅ AI optimization algorithm with Haversine distance calculation
- ✅ Route permissions configured in AuthContext
- ✅ Sidebar navigation configured

**Tasks Completed**:

1. ✅ **Create briefing endpoint** (`server.ts` lines 1076-1200+):
   - `GET /api/daily-briefing?mr_id=1&date=YYYY-MM-DD`
   - Returns: optimized schedule with AI scores, routing, expected value
   - Auto-filters by authenticated MR user
   - Haversine formula for distance calculation
   - Route optimization percentage calculation

2. ✅ **Implement AI optimization algorithm**:
   - Fetch scheduled visits for MR
   - Calculate AI scores: `(tier_score + potential + historical_value)`
   - Calculate travel distances between clinics
   - Sort by weighted score
   - Generate optimized route order

3. ✅ **Notification system**:
   - `POST /api/notifications` - store notifications ✅
   - Show in `NotificationPanel` component ✅
   - Morning briefing modal on MR Dashboard ✅

4. ✅ **Frontend - MR Dashboard**:
   - `MorningBriefingModal` component created ✅
   - Integrated into `MRDashboard.tsx` (line 788) ✅
   - Shows AI insights and expected values ✅
   - "Start Navigation" button (ready for Google Maps integration) ✅

5. 🔄 **Cron job** (optional - not implemented):
   - Generate briefing at 6 AM daily
   - Send email if configured
   - Store in localStorage for offline

**Routes Configured**:
- `/mr-dashboard` → MRDashboard with Morning Briefing ✅
- `/field-tracker` → MRFieldTracker (5-step workflow) ✅
- `/schedule` → DailyCallPlan (view/edit schedules) ✅

**Components**:
- `MorningBriefingModal.tsx` ✅
- `MRDashboard.tsx` (integrated) ✅
- `DailyCallPlan.tsx` ✅
- `NotificationPanel.tsx` ✅

**See**: `PHASE2_ROUTES_STATUS.md` for detailed route configuration report

---

### Phase 3: Admin Field Tracking Enhancement (Week 3)

**Goal**: Admin sees all MRs' real-time status

**Tasks**:

1. **Enhance existing `MRTracking.tsx`** (or rename to `AdminMRMonitor`):
   - Show map with all MR pins
   - Color coding: 🟢 Active visit, 🔵 Traveling, ⚪ Idle
   - Click MR → see today's timeline
   - See completed vs scheduled count
   - Alert if MR hasn't checked in

2. **Real-time updates**:
   - Poll `GET /api/mr-locations?date=today` every 2 minutes
   - WebSocket upgrade (future)

3. **Admin drill-down**:
   - Click MR → see visit records
   - View photos, voice recordings (admin can see all)
   - Export activity report

4. **Geofencing alerts**:
   - Admin notified if MR outside territory
   - Alert if MR at unauthorized location during work hours

---

### Phase 4: AI Lead Conversion (Week 4)

**Goal**: AI actively helps convert leads from voice data

**Tasks**:

1. **Auto-lead creation**:
   - After `POST /api/visit-recordings`, analyze transcript
   - If `detected_lead = true` AND `lead_probability > 60%`
   - Auto-create lead in database
   - Assign to MR who made visit

2. **Follow-up scheduling**:
   - AI suggests next contact date based on:
     - Lead probability (higher = sooner)
     - Doctor schedule (avoid Mondays/Fridays)
     - MR's existing schedule (optimize route)
   - Auto-add to daily call plan

3. **Lead nurturing insights**:
   - Show MR their leads dashboard
   - Prioritized by conversion probability
   - Recommended actions: "Call - high interest shown", "Send samples - requested", "Schedule demo - agreed"

4. **Conversion tracking**:
   - When lead becomes doctor (sale made)
   - Track time-to-conversion
   - Improve AI model with outcome data

---

### Phase 5: Continous AI Improvement (Ongoing)

**Feedback loop**:
- Capture MR actions on AI recommendations
- Track which leads convert
- Measure forecast accuracy
- Retrain heuristics monthly

**Advanced features**:
- Personalize AI per MR (learn their style)
- Voice sentiment analysis (tone, urgency)
- Competitive intelligence (mentions of competitors)
- Sample-to-order conversion tracking

---

## 🔧 Technical Specifications

### API Changes Summary

**New endpoints**:
- `GET /api/daily-briefing?mr_id=X&date=Y`
- `POST /api/notifications` (may exist already)
- `GET /api/ai/optimize-route?mr_id=X` (alternative to briefing)

**Modified endpoints** (add filtering):
- `/api/doctors` - filter by territory
- `/api/sales`
- `/api/expenses`
- `/api/leads`
- `/api/visit-records`
- `/api/attendance`
- `/api/activities`
- `/api/visit-recordings`
- `/api/daily-summaries`
- `/api/missed-visits`
- `/api/approval-requests` (MRs see only own)

**New database fields**:
- `doctors.coordinates` (lat, lng) for routing
- `doctors.recommended_next_visit` (from AI analysis)
- `users.territory` (copy from linked MR)
- `notifications.read` flag
- `lead_outcomes` table (track conversion)

---

## 🎨 UI/UX Changes

### MR Dashboard Additions

1. **Morning Briefing Modal** (first login):
   - AI-optimized schedule
   - Route map preview
   - Expected revenue estimate
   - "Start Navigation" button

2. **Smarter Visit Cards**:
   - Show AI score badge (🔥 Hot, 🟡 Warm, ⚪ Cold)
   - Show "Expected order: ₹XX,XXX"
   - Color code by priority
   - One-click: "Start Navigation" → Google Maps

3. **Territory Header**:
   - "Hyderabad West Territory" - clear indication
   - Switch territory (admin only)

---

### Healthcare Directory Changes

1. **MR View**:
   - Territory locked (no selector)
   - "Your Territory: Hyderabad West" banner
   - Doctors sorted by AI recommendation score (not name)
   - Quick action: "Schedule Visit" (if not already scheduled)

2. **Admin View**:
   - Territory dropdown
   - See all territories
   - Export by territory

---

## 🧪 Testing Strategy

### Unit Tests

- `geminiService.optimizeRoute()` - test routing algorithm
- `authMiddleware.filterByTerritory()` - test filtering
- `notificationService.generateBriefing()` - test content

### Integration Tests

- MR can only see territory data (attempt to access other MR's data → empty)
- Admin sees all data
- Morning briefing contains correct visits
- AI route optimization reduces travel distance

### Manual QA Checklist

- [ ] MR login → cannot see doctors from other territories
- [ ] MR tries `/api/doctors` directly → filtered response
- [ ] Admin field tracker shows all MRs
- [ ] Morning notification appears (simulate by calling endpoint)
- [ ] Voice recording with lead keywords → auto-creates lead
- [ ] Completed visit → triggers AI analysis → updates doctor recommended date
- [ ] Territory-based scheduling respects time windows

---

## 📊 Success Metrics

### Week 1 (Data Isolation)
- ✅ 100% of API endpoints filter by MR
- ✅ 0 data leakage incidents in testing
- ✅ MR sees only their 20-30 doctors (not all 100+)

### Week 2 (Notifications)
- ✅ Morning briefing generated for 100% of MRs
- ✅ Route optimization reduces travel by ≥15%
- ✅ 90% of MRs view briefing within 1 hour of login

### Week 3 (Admin Tracking)
- ✅ Admin sees all 6 MRs on map in real-time
- ✅ Missed visit alerts triggered within 1 hour
- ✅ Admin drill-down shows full visit history

### Week 4 (AI Conversion)
- ✅ Leads auto-created from 80% of qualified voice recordings
- ✅ Lead-to-conversion rate increases 20% (baseline compare)
- ✅ MRs follow AI recommendations 60%+ of time

---

## 🚀 Deployment Checklist

- [ ] All API endpoints updated with filtering
- [ ] Middleware tested with admin/MR users
- [ ] Territory data consistency validated (doctors always have territory)
- [ ] Daily briefing endpoint deployed
- [ ] Notification panel integrated
- [ ] Admin field tracker tested with 6+ MRs
- [ ] Voice recording → lead pipeline tested end-to-end
- [ ] Documentation updated (API.md, FEATURES.md)
- [ ] Demo credentials still work
- [ ] Render deployment updated (git push → auto-deploy)
- [ ] Monitoring alerts for new endpoints
- [ ] User training conducted

---

## 📋 Detailed Task Breakdown

### Week 1 Tasks (Data Isolation)

**Day 1-2: Backend API Filtering**
- [ ] Update `server.ts` - add `requireMrOrAdmin` middleware
- [ ] Apply middleware to all sensitive endpoints
- [ ] Add territory to user profile response
- [ ] Test with Postman/curl

**Day 3-4: Frontend Filtering**
- [ ] Update `HealthcareDirectory.tsx` - auto-filter by user territory
- [ ] Update all components using doctors API
- [ ] Hide territory selector for MRs
- [ ] Add territory display in header

**Day 5: Testing & Bug Fixes**
- [ ] Penetration test: try accessing other MR's data
- [ ] Fix any leaks
- [ ] Verify admin still sees all

---

### Week 2 Tasks (Notifications)

**Day 1-2: Briefing Endpoint**
- [ ] Create `GET /api/daily-briefing`
- [ ] Implement routing algorithm (TSP simplified)
- [ ] Add doctor coordinates (lat/lng)
- [ ] Cache AI scores to avoid rate limits

**Day 3: Frontend Integration**
- [ ] Create `MorningBriefingModal` component
- [ ] Show on MR Dashboard first login
- [ ] Add "Start Navigation" (Google Maps URL)
- [ ] Display in NotificationPanel

**Day 4: Notification Storage**
- [ ] Store briefings as notifications
- [ ] Mark as read
- [ ] Show in panel list

**Day 5: Testing**
- [ ] Test with 6 MRs, different territories
- [ ] Verify route optimization works
- [ ] Check travel distance reduction

---

### Week 3 Tasks (Admin Tracking)

**Day 1-2: AdminMRMonitor**
- [ ] Enhance `MRTracking.tsx` or create new
- [ ] Add map with pins for all MRs
- [ ] Color coding by activity
- [ ] Real-time polling every 2 min

**Day 3: Drill-down Views**
- [ ] Click MR → show timeline
- [ ] Show visit records with photo/audio
- [ ] Export reports

**Day 4: Alerts**
- [ ] Alert if MR hasn't checked in by 10 AM
- [ ] Alert if MR outside territory
- [ ] Notification badge

**Day 5: Testing**
- [ ] Admin sees all 6 MRs on map
- [ ] Real-time updates work
- [ ] Drill-down shows correct data

---

### Week 4 Tasks (AI Conversion)

**Day 1-2: Auto-Lead Creation**
- [ ] Modify `POST /api/visit-recordings` endpoint
- [ ] Call `geminiService.forecastLead()` if transcript exists
- [ ] Auto-create lead if probability > 60%
- [ ] Assign to visiting MR

**Day 3: Follow-up Scheduling**
- [ ] AI suggests next contact date
- [ ] Add to `daily_call_plan` table
- [ ] Prioritize in MR's schedule

**Day 4: Lead Dashboard**
- [ ] Update `LeadsManagement.tsx` for MRs
- [ ] Show my leads (assigned_mr_id = user.mr_id)
- [ ] Sort by conversion probability
- [ ] Quick actions: Call, Schedule, Convert

**Day 5: Testing & Metrics**
- [ ] Test end-to-end: Voice recording → Lead creation → Schedule
- [ ] Measure conversion rate improvement
- [ ] Gather feedback from demo users

---

## 🎯 Expected Outcomes

After implementing all 5 phases:

1. **MR Productivity** ↑ 30% (optimized routes, smart scheduling)
2. **Lead Conversion** ↑ 20% (AI prioritization, auto-follow-up)
3. **Admin Oversight** 100% real-time visibility into field activities
4. **Data Privacy** 100% - MRs never see other territories
5. **User Satisfaction** ↑ (proactive notifications, intelligent assistance)

---

## 🔄 Iteration & Improvement

Post-launch (Month 2-3):

1. **Collect feedback** from actual MR usage
2. **Measure AI accuracy** (predicted vs actual orders)
3. **Refine weights** in routing algorithm
4. **Add new AI features**:
   - Weather/traffic integration
   - Doctor availability predictions
   - Sample-to-order conversion tracking
   - Competitive product mentions

---

**Total Estimated Effort**: 4-5 weeks with 1 developer

**Priority Order**: Phase 1 (isolation) → Phase 2 (briefings) → Phase 4 (leads) → Phase 3 (admin tracking)

---

**End of ULTRA_PLAN.md**

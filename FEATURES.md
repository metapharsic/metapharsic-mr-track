# Feature Guide - Metapharsic Life Sciences CRM

Comprehensive guide to all features and how to use them.

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Core Features by Module](#core-features-by-module)
   - [Authentication](#authentication)
   - [Dashboard](#dashboard)
   - [MR Dashboard](#mr-dashboard)
   - [Field Tracker](#field-tracker)
   - [Healthcare Directory](#healthcare-directory)
   - [Sales Tracking](#sales-tracking)
   - [Expense Manager](#expense-manager)
   - [Leads Management](#leads-management)
   - [Visit Scheduling](#visit-scheduling)
   - [Daily Call Plan](#daily-call-plan)
   - [Approval Workflow](#approval-workflow)
   - [Entity Credits](#entity-credits)
   - [MR Tracking](#mr-tracking)
   - [Global Search](#global-search)
   - [Voice Assistant](#voice-assistant)
4. [AI Features](#ai-features)
5. [Mobile & Field Features](#mobile--field-features)
6. [Tips & Tricks](#tips--tricks)
7. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Overview

Metapharsic CRM is a comprehensive solution for managing Medical Representative operations in the pharmaceutical/life sciences industry.

**Key Highlights**:
- 📍 GPS-based attendance & visit verification
- 🎤 Voice recording with AI analysis
- 📸 Photo proof capture
- 📊 Real-time analytics & forecasting
- 🤖 AI-powered insights (optional, works offline too)
- 🔐 Role-based access control
- 🌐 Responsive design (works on tablets & phones)

---

## User Roles

### Admin
**Access**: Full system access

**Can**:
- Manage all MRs
- Create/edit/delete users
- View all data across territories
- Manage products, pricing
- Approve expenses, reschedules
- Configure system settings
- Access all reports

**Login**: `admin@metapharsic.com` / `admin123`

---

### Manager
**Access**: Team oversight without full admin rights

**Can**:
- View assigned MR's data
- Edit MR information
- Approve expenses & requests
- View sales & performance
- Manage leads for team
- Create schedules
- Generate reports

**Cannot**:
- Delete users
- System configuration

---

### MR (Medical Representative)
**Access**: Personal data & field tools

**Can**:
- View daily schedule
- Check-in with GPS
- Record visits (voice, photo, notes)
- Log expenses
- Track sales orders
- View personal performance
- Update profile

**Cannot**:
- View other MR's data
- Access admin features

**Login**: See demo credentials in Login screen

---

### Viewer
**Access**: Read-only analytics

**Can**:
- View dashboard metrics
- Browse directory
- See reports (no edit)

---

## Core Features by Module

### Authentication

**Location**: `/login`

**Features**:
- Email/password login (demo mode accepts any password for seeded accounts)
- Google OAuth (optional - requires configuration)
- One-click demo credential fill
- Session persistence (localStorage)
- Role-based redirect after login

**Usage**:
1. Navigate to `/login`
2. Enter email & password
3. Click "Sign In"
4. Redirected to appropriate dashboard

**Demo Quick Login**:
- Click "Fill Admin Credentials" or "Fill MR Credentials"
- Click "Sign In"

---

### Dashboard

**Location**: `/` (home)

**Audience**: Admin/Manager

**Features**:
- System overview cards
- Total MR count, active/inactive
- Today's visits summary
- Recent sales & expenses
- Performance metrics
- Quick action buttons

**Widgets**:
1. **MR Performance**
   - Cards per MR: visits completed, orders, revenue
   - Performance score % (auto-calculated)

2. **Today's Activity**
   - Check-ins vs schedules
   - On-time vs late
   - Missed visits alert

3. **Revenue**
   - Daily/weekly/monthly sales
   - Target vs actual
   - Top products

4. **Expenses**
   - Pending approvals
   - Top expense categories
   - Anomaly alerts

**Usage**:
- Default landing page after admin/manager login
- Click cards to drill down (e.g., MR card → MR detail)
- Use date picker to change timeframe

---

### MR Dashboard

**Location**: `/mr-dashboard`

**Audience**: MRs (primary), Managers (view all)

**Features**:
- Today's assigned visits (schedule)
- Attendance check-in with GPS
- Expandable visit cards with notes
- Recent visit logs
- Performance metrics
- Grid/List view toggle

**View Modes**:

**List View**:
```
1. Dr. Ramesh Sharma | Priority: High | Status: Pending
   Time: 10:00 AM | Clinic: Sharma Clinic
   [Start Visit] [Call] [Expand ▼]
```

**Grid View**:
```
┌─────────────────────────────┐
│ ● Dr. Ramesh Sharma         │
│   Priority: High            │
│   Status: Pending           │
│   10:00 AM • Sharma Clinic  │
│   [Start Visit]             │
└─────────────────────────────┘
```

**Usage**:
1. **Check In**: Click "Mark Attendance" → captures GPS
2. **Start Visit**: Click "Start Visit" on schedule → opens Field Tracker
3. **View Details**: Click chevron to expand card
   - See doctor notes, estimated duration, specialty, tier
   - Click "View Visit Details" → Visit Record page
4. **Call Contact**: Phone icon → shows contact info toast
5. **Recent Visits**: Scroll down to see past visits
   - Click card to expand full notes, conversation summary, order value

**Status Colors**:
- 🟢 Green = Completed
- 🔵 Blue = In Progress
- 🟡 Yellow = Pending

---

### Field Tracker

**Location**: `/field-tracker`

**Audience**: MRs in the field

**Workflow Steps**:

#### Step 1: GPS Check-in
```
[ 📍 Capture GPS ]
Status: Getting location...
✓ Captured: 17.3850°N, 78.4867°E
Accuracy: 15m
[ Continue → ]
```
- Auto-detects current location
- Manual refresh if needed
- Requires browser permission

#### Step 2: Photo Proof
```
[ 📸 Take Photo ]
[ 📷 Camera   📁 Upload ]
┌───────────┐
│  Preview  │
│  (200×200) │
└───────────┘
[ Retake • Continue → ]
```
- Camera capture or file upload
- Auto-compressed to 200px JPEG
- Typically doctor's nameplate/clinic signboard

#### Step 3: Voice Recording
```
[ 🎤 Record Conversation ]
○ Recording (00:15)  ● Stop
[ Playing... ] [ Pause ] [ ↺ ]

AI Analysis:
├─ ✓ Lead Detected (75% confidence)
├─ ✓ Sale Expected (₹75,000)
└─ Keywords: product_efficacy, pricing_objection, follow_up_required
[ Continue → ]
```
- Start/Stop recording (max 5 minutes recommended)
- Real-time transcription (Web Speech API)
- AI analysis runs automatically:
  - Lead probability
  - Sale amount prediction
  - Product mentions
  - Conversation sentiment
  - Key discussion topics

**Continue** even without recording (manual entry possible)

#### Step 4: Outcome Form
```
[ ✅ Visit Outcome ]
─────────────────────────────
Products Detailed: [ CardiCare Plus, Atorvastatin ]
Samples Given:    [ ✓ Yes ]
Order Placed:     [ ₹ 75,000 ]
Doctor Feedback:  [ Very positive about new formulation ]
Next Follow-up:   [ 2025-04-15 ]
─────────────────────────────
[ ← Back   Submit & Checkout → ]
```

#### Step 5: Check-out GPS
```
[ 📍 Check-out Location ]
✓ Captured: 17.3860°N, 78.4870°E
Distance from check-in: 350m

✓ Visit Record Complete!
Visit ID: #12345
[ Return to Dashboard ]
```

**All Data Recorded**:
- GPS check-in/out timestamps & coordinates
- Photo proof URL
- Audio recording (if made)
- Transcription & AI analysis
- Outcome details
- Visit status = 'completed'

---

### Healthcare Directory

**Location**: `/directory`

**Audience**: All users (MRs, managers, admins)

**Tabs**: Doctors | Pharmacies | Hospitals

**Features**:
- Comprehensive search & filters
- Entity cards with quick stats
- Visit history per entity
- AI visit frequency recommendations
- Contact actions (call, email)
- CRUD operations (admin/manager only)

**Search Options**:
- By name
- By territory
- By tier (A/B/C)
- By specialty (doctors)
- By rating
- By potential (high/medium/low)

**Entity Card**:
```
┌────────────────────────────┐
│ ★★★★★ 4.8 • Tier A • High │
│ Dr. Ramesh Sharma          │
│ Cardiologist               │
│ 📍 Sharma Clinic           │
│ 📞 +91 98765 43210         │
│ 📧 doctor@example.com      │
│                            │
│ Visits: 45 • Orders: 12    │
│ Value: ₹1,56,000           │
│                            │
│ [ View Profile ]           │
│ [ Schedule Visit ]         │
└────────────────────────────┘
```

**View Profile** → Detailed page:
- Full info (qualification, timings, notes)
- Visit history table (date, purpose, outcome)
- Order history
- AI Recommendations:
  - "Visit frequency: Weekly (last visit 5 days ago)"
  - "Engagement score: 85/100"
  - "Trend: Increasing"

---

### Sales Tracking

**Location**: `/sales`

**Audience**: Admin, Manager, MR (own data only)

**Features**:
- Sales order entry (manual or from visits)
- Sales history with filters
- AI revenue forecasting
- Product performance analytics
- Doctor/territory-wise breakdown
- Charts & visualizations (Recharts)

**Sales Entry**:
```
[ + New Sale ]
────────────────────
MR: [ Rajesh Kumar ▼ ]
Doctor: [ Dr. Ramesh Sharma ▼ ]
Product: [ CardiCare Plus 10mg ▼ ]
Quantity: [ 100 ]
Amount: [ ₹75,000 ]
Date: [ 2025-04-08 ]
Clinic: [ Sharma Clinic ]
────────────────────
[ Save Sale ]
```

**Sales Forecast**:
```
Next 3 Months Predicted:
─────────────────────────────
May  2025: ₹15,00,000  ──┬── 90% CI: ₹16,50,000 - ₹13,50,000
Jun  2025: ₹16,00,000  ──┼──
Jul  2025: ₹18,00,000  ──┘
─────────────────────────────
Confidence: 78%
```

**Charts**:
1. Monthly revenue trend (line chart)
2. Top products (bar chart)
3. MR performance comparison
4. Territory-wise sales (map/chart)

**Natural Language Queries** (voice or text):
- "What are top 3 products this month?"
- "Show sales for Hyderabad West last week"
- "Compare Rajesh vs Suresh's performance"

---

### Expense Manager

**Location**: `/expenses`

**Audience**: MRs (create), Admin/Manager (approve)

**Features**:
- Expense logging with categories
- Receipt photo upload
- Approval workflow
- AI cost reduction insights
- Expense reports & charts

**Categories**:
- Travel (cab, fuel, tolls)
- Meals (client lunch, team dinner)
- Accommodation (hotel)
- Transport (parking, bus)
- Office supplies
- Samples (free samples for doctors)

**Expense Entry**:
```
[ + New Expense ]
────────────────────
Category: [ Travel ▼ ]
Amount: [ ₹2,500 ]
Date: [ 2025-04-08 ]
Description: [ Cab to client meeting at Sharma Clinic ]
Receipt: [ 📁 Upload ]
────────────────────
[ Submit for Approval ]
```

**Approval Flow**:
1. MR submits expense
2. Manager receives notification
3. Manager approves/rejects with comment
4. MR notified via panel

**AI Insights** (click "Get Insights"):
```
💡 Cost Reduction Recommendations:
─────────────────────────────────────
• Average travel cost: ₹2,200/day (you're 14% above)
• Consider cab pooling with other MRs
• Fuel expenses spiked on Apr 5 - review necessity
• Meal allowance within limit (good)
─────────────────────────────────────
```

---

### Leads Management

**Location**: `/leads`

**Audience**: Admin, Manager, MRs

**Features**:
- Lead pipeline (.new → assigned → contacted → converted → lost)
- Priority scoring (auto + manual)
- Assignment to MRs
- Auto-lead creation from voice recordings
- Conversion tracking

**Lead Card**:
```
┌────────────────────────────┐
│ 🔴 High Priority           │
│ Dr. New Doctor             │
│ Specialty: Cardiologist    │
│ Territory: Hyderabad West  │
│                            │
│ Status: new                │
│ Created: Apr 8, 2025       │
│ Assigned: —                │
│                            │
│ Comments: Met at conf...   │
│ [ Assign to MR ▼ ]         │
[ Mark Contacted ]           │
─────────────────────────────┘
```

**Auto-Lead Detection**:
When voice recording is analyzed, if AI detects:
- "interested in products"
- "would like to try samples"
- "schedule a demo"
→ System auto-creates lead with `detected_lead: true`

**Assignment**:
1. Click "Assign to MR" dropdown
2. Select MR from territory
3. Lead appears in that MR's Daily Call Plan

**Conversion**:
- Mark as "converted" → creates doctor record in directory
- Email notification to team

---

### Visit Scheduling

**Location**: `/schedule`

**Audience**: Admin, Manager, MRs (own)

**Features**:
- Create visit schedules
- Multi-date bulk scheduling
- Conflict detection
- Rescheduling with approval
- Recurring templates (weekly, biweekly)

**Schedule Entry**:
```
[ + New Schedule ]
────────────────────
MR: [ Rajesh Kumar ▼ ]
Doctor: [ Dr. Ramesh Sharma ▼ ] (auto-suggests from directory)
Date: [ 📅 2025-04-08 ]
Time: [ 🕐 10:00 ]
Clinic: [ Sharma Clinic ]
Purpose: [ CardiCare Plus demo ]
Priority: [ 🔴 High ▼ ]
────────────────────
[ Create Schedule ]
```

**Bulk Create**:
- Select multiple doctors
- Select date range (e.g., next week)
- System auto-generates schedules respecting:
  - MR territory boundaries
  - Working hours (9 AM - 6 PM)
  - Tier-based frequency (A-tier = weekly)

**Reschedule**:
1. Click date on existing schedule
2. Change to new date/time
3. Requires approval if < 24 hours notice

---

### Daily Call Plan

**Location**: `/schedule` (default tab) or MR Dashboard

**Audience**: MRs (primary), Managers

**Features**:
- AI-recommended daily visit list
- Priority ordering (A-tier first)
- Auto-generated each morning at 6 AM
- MR can customize/reorder
- Mark completed/missed
- Voice logs sync

**Daily Plan Card**:
```
📅 Tue, Apr 8, 2025
─────────────────────────────
1. [✓] 09:00 - Dr. Priya Nair (A)
        Cardiology, Fortis
        Purpose: Sample follow-up

2. [ ] 10:30 - Dr. Ramesh Sharma (A)
        Sharma Clinic
        Purpose: CardiCare demo

3. [ ] 14:00 - Dr. Amit Gupta (B)
        City Hospital
        Purpose: New product intro
─────────────────────────────
[ View All Schedules ]
```

**AI Recommendation Factors**:
- Days since last visit (priority ↑ as gap increases)
- Entity tier (A > B > C)
- Historical order value
- Weather/traffic (integrated if available)
- MR preference learning

**Customization**:
- Drag & drop to reorder
- Delete unwanted visits (requires reason)
- Add custom visit (free-form)

---

### Approval Workflow

**Location**: `/approvals`

**Audience**: Managers/Admins only

**Features**:
- Expense approval queue
- Visit reschedule approvals
- Credit extension requests
- Bulk approve/reject
- Comment back to MR

**Approval Card**:
```
📌 Reschedule Request
─────────────────────────────
From: Rajesh Kumar
MR ID: 1

Visit: Dr. Ramesh Sharma
Original: Apr 8, 10:00 AM
Requested: Apr 9, 2:00 PM
Reason: Client unavailable today

[ ✓ Approve ]  [ ✗ Reject ]
  Add comment: [            ]
─────────────────────────────
```

**Email Notifications**:
- MR gets notified when request submitted
- MR gets notified on decision
- Escalation to admin if pending > 48 hours

---

### Entity Credits

**Location**: `/entity-credits`

**Audience**: Admin, Manager

**Features**:
- Credit limit management for doctors/pharmacies/hospitals
- Outstanding balance tracking
- Auto-block when overdue
- Payment history
- Adjust credit terms

**Credit Card**:
```
🏥 City General Hospital
─────────────────────────────
Credit Limit: ₹2,00,000
Outstanding: ₹75,000
Payment Terms: Net 30
Status: ✅ Current
Last Payment: Apr 1, 2025 (₹30,000)

[ Edit Credit ]  [ View History ]
─────────────────────────────
```

**Blocking Rules**:
- Outstanding > 90 days → auto-block
- 3 missed payments → auto-block
- Manual override by admin

---

### MR Tracking

**Location**: `/mr-tracking`

**Audience**: Admin, Manager

**Features**:
- Real-time MR location on map
- Geofencing verification (visits within 200m radius)
- Activity timeline
- Daily route playback
- Idle time detection

**Map View**:
```
Map with pins:
🟢 = Active visit
🔵 = In-transit
⚪ = Idle > 30min

Select MR from dropdown:
[ Rajesh Kumar ▼ ]
[ Live: Dr. Sharma Clinic • 45 min ]
[ Last check-in: 10:12 AM ]
[ Today's distance: 42 km ]
```

**Route Analysis**:
- Green route = optimal planned path
- Red dots = idle stops >15min
- "Off-route" alerts when deviating >2km

---

### Global Search

**Shortcut**: `Ctrl+K` (or `Cmd+K` on Mac)

**Audience**: All users

**Features**:
- Instant search across all entities
- Fuzzy matching
- Keyboard navigation (↑↓ to select, Enter to open)
- Quick actions from results
- Recent searches

**Search Queries**:
```
ramesh        → Dr. Ramesh Sharma, Rajesh Kumar
cardio        → All cardiologists, Cardiology products
hyderabad     → Entities in Hyderabad
tier a        → All A-tier entities
priya         → Dr. Priya Sharma, Priya Nair
```

**Result Types**:
- 👤 Doctors
- 💊 Pharmacies
- 🏥 Hospitals
- 👥 MRs
- 💰 Sales
- 📦 Products
- 🎯 Leads

**Quick Actions** (hover/click result):
- [View] - Open detail page
- [Call] - Show phone number
- [Schedule] - Create visit
- [Edit] - Edit entity (if permission)

---

### Voice Assistant

**Icon**: 🎤 Microphone in sidebar

**Audience**: All users

**Features**:
- Voice commands for navigation
- Hands-free operation for MRs in field
- Speech-to-text for search
- Natural language understanding (browser built-in)

**Commands**:

| Command | Action |
|---------|--------|
| "Open search" | Focus global search |
| "Close search" | Close search |
| "Go to dashboard" | Navigate home |
| "Show my schedule" | Open MR Dashboard |
| "Log expense" | Open expense manager |
| "Start visit" | Open field tracker |
| "Call Rajesh" | Contact info (if available) |

**Usage**:
1. Click 🎤 icon or say "Hey Assistant" (if configured)
2. Speak command clearly
3. Assistant confirms: "Navigating to Dashboard"

**Browser Support**:
- Chrome/Edge (full)
- Firefox (partial)
- Safari (limited)

---

## AI Features

### Lead Scoring

**Where**: Visit recordings, Sales Tracking

**Scoring Factors**:
- Conversation length (>60s = higher)
- Product questions asked
- Sample requests
- Follow-up commitment
- Sentiment analysis

**Output**:
```
Lead Probability: 75%
Status: HOT
Revenue Forecast: ₹1,12,500/month
Confidence: 68%
```

---

### Visit Frequency Analysis

**Where**: Healthcare Directory → Doctor Profile

**Algorithm**:
- Calculates last N visits (30d, 90d)
- Compares to target frequency by tier:
  - Tier A: Weekly
  - Tier B: Bi-weekly
  - Tier C: Monthly
- Detects overdue visits
- Recommends next date

**Display**:
```
Visit Analysis for Dr. Sharma
──────────────────────────────
Total visits: 45
Last visit: 5 days ago
30-day visits: 3 ✓ (on track)
90-day visits: 12 ⚠ (declining)
Trend: ↓ Decreasing (-20% vs last quarter)
Recommendation: Weekly (next: Apr 11)
──────────────────────────────
```

---

### Sentiment Analysis

**Where**: Doctor profile, Visit record

**Analyzes**: Conversation summaries & notes

**Output**:
- Overall sentiment: 😊 Positive / 😐 Neutral / 😞 Negative
- Trend: ↑ Improving / → Stable / ↓ Declining
- Key concerns: ["Pricing concerns", "Competitor product"]
- Interest topics: ["Product efficacy", "Samples"]
- Engagement score: 85/100

---

### Sales Forecasting

**Where**: Sales Tracking → Forecast tab

**Model**: Time series (ARIMA-like) + confidence intervals

**Output**:
```
Next 3 months:
May: ₹15L (90% CI: ₹13.5L - ₹16.5L)
Jun: ₹16L (90% CI: ₹14L - ₹18L)
Jul: ₹18L (90% CI: ₹15.5L - ₹20.5L)
Confidence: 78% (increasing data quality)
```

**Factors**:
- Historical sales trends
- Seasonality (quarterly peaks)
- New product launches
- Sales rep changes

---

### Expense Optimization

**Where**: Expense Manager → Insights button

**Analyzes**:
- Category-wise spending
- Anomaly detection (days > 3x average)
- Benchmark vs other MRs
- Patterns (e.g., every Friday expensive)

**Output**:
```
💡 Recommendations:
─────────────────────────
• Transport costs 30% above team avg - consider public transport
• Meal expenses spiked on Apr 3 (₹5,000) - review attendees
• Travel costs optimal (within 10% of budget)
• No receipt for ₹1,200 on Apr 5 - attach documentation
─────────────────────────
```

---

## Mobile & Field Features

### Responsive Design

All pages optimized for:
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

**Mobile-Specific**:
- Bottom navigation (Field Tracker)
- Larger touch targets (44px min)
- Swipe gestures (cards, lists)
- Offline caching (Service Worker - pending)

### GPS Features

**Attendance Check-in**:
- Captures current GPS coordinates
- Geofences for clinic location (150m radius)
- Stores lat/lng/accuracy/timestamp
- Prevents fake check-ins (must be at location)

**Visit Check-in/out**:
- Both captured automatically in Field Tracker
- Distance calculation between check-in/out
- Route mapping (would integrate with Google Maps API)

---

## Tips & Tricks

### Efficient Workflow

1. **Keyboard Navigation**:
   - Tab through form fields
   - Enter to submit
   - Esc to cancel

2. **Quick Filters**:
   - In Directory, type to search instantly
   - Use tier filters (A/B/C) to prioritize

3. **Batch Operations**:
   - Select multiple leads → bulk assign
   - Bulk approve expenses from queue

4. **Voice Logging**:
   - Start Field Tracker → Record → Skip to outcome
   - Transcription auto-fills notes (edit if needed)
   - AI extracts order amount & products

5. **Offline Mode** (future):
   - Cache schedules in localStorage
   - Queue visits when offline → sync on reconnect

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` / `Cmd + K` | Open Global Search |
| `Esc` | Close modals, cancel edits |
| `Enter` | Submit forms, open selected |
| `Ctrl + L` | Focus location search (Directory) |
| `Ctrl + P` | Print current page |
| `Ctrl + R` | Refresh data (hold Ctrl to force) |
| `Ctrl + /` | Show keyboard shortcuts help |

**In Field Tracker**:
- `Space` → Start/Stop recording (when focused)
- `→` → Next step
- `←` → Previous step

---

## Feature Request Priority

**High Impact** (Could be added):
- Offline mode (Service Worker)
- PDF report generation
- Bulk data import (Excel/CSV)
- Bulk SMS to doctors
- Calendar sync (Google Calendar)
- Mobile app (React Native)
- Advanced analytics dashboard
- Multi-language support

**Nice to Have**:
- Dark mode
- Customizable dashboard widgets
- Advanced permission granularity
- Two-factor authentication
- Audit log viewer
- Data export (all formats)

---

## Support Resources

- **Full API Reference**: See [API.md](./API.md)
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Architecture Explained**: See [AGENTS.md](./AGENTS.md)
- **Developer Quickstart**: See [QUICKSTART.md](./QUICKSTART.md)

---

**End of FEATURES.md**

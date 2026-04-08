# Metapharsic Life Sciences CRM - Agent Architecture

**Version**: 1.0  
**Last Updated**: 2025-04-08  
**Architecture**: Multi-Agent System with API-First Design

This document describes the key "agents" (modules/components) that make up the MR Life Science CRM system. Each agent has specific responsibilities and communicates through well-defined interfaces.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Agent Types](#agent-types)
   - [API Services](#api-services)
   - [UI Modules](#ui-modules)
   - [Context Providers](#context-providers)
   - [AI Analysis Agents](#ai-analysis-agents)
   - [Utility Services](#utility-services)
3. [Agent Communication](#agent-communication)
4. [Data Flow](#data-flow)

---

## System Overview

The Metapharsic CRM is a comprehensive Medical Representative management system built with:

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js + Vite dev server
- **Data**: In-memory store (production-ready for database integration)
- **Authentication**: Local storage + optional Google OAuth
- **AI**: Gemini API with local fallback (no hard dependency)

---

## Agent Types

### API Services

#### **1. API Gateway (`src/services/api.ts`)**
**Responsibility**: Centralized HTTP client for all backend communication.

**Endpoints Managed**:
```
GET    /api/mrs                         - List all MRs
POST   /api/mrs                         - Create MR
PATCH  /api/mrs/:id                     - Update MR

GET    /api/products                    - List products
GET    /api/doctors                     - List doctors
GET    /api/pharmacies                  - List pharmacies
GET    /api/hospitals                   - List hospitals
GET    /api/targets                     - List targets

GET    /api/expenses                    - List expenses
POST   /api/expenses                    - Create expense

GET    /api/sales                       - List sales
POST   /api/sales                       - Create sale
GET    /api/sales-forecast              - Sales predictions

GET    /api/doctor-visits               - List visits
GET    /api/visit-schedules             - List schedules
GET    /api/visit-schedules?mr_id=X     - Filter by MR
POST   /api/visit-schedules             - Create schedule
PATCH  /api/visit-schedules/:id/start  - Mark as in-progress
DELETE /api/visit-schedules/:id         - Cancel schedule

GET    /api/leads                       - List leads
POST   /api/leads                       - Create lead
PATCH  /api/leads/:id                   - Update lead

GET    /api/attendance?mr_id=X          - Get attendance
POST   /api/attendance/check-in         - Check in

GET    /api/activities?mr_id=X&date=Y   - Get activities
GET    /api/visit-recordings            - Get recordings
POST   /api/visit-recordings            - Upload recording
GET    /api/visit-recordings?entity=X   - Filter by entity

GET    /api/approval-requests           - List approvals
POST   /api/approval-requests           - Create approval
PATCH  /api/approval-requests/:id       - Update approval

GET    /api/entity-credits              - Get credit limits
PATCH  /api/entity-credits/:id          - Update credit

GET    /api/mr-locations                - Get GPS locations
POST   /api/mr-locations                - Update location

GET    /api/notifications?mr_id=X       - Get notifications
POST   /api/send-email                  - Send email

GET    /api/visit-records?mr_id=X       - Get visit records
POST   /api/visit-records               - Create record
PATCH  /api/visit-records/:id           - Update record

GET    /api/missed-visits               - Get missed visit alerts

GET    /api/daily-summaries?mr_id=X     - Get daily summary

GET    /api/daily-call-plan             - Get call plan
POST   /api/daily-call-plan             - Create/update plan
POST   /api/daily-call-plan/:id/complete - Mark complete
```

**Communication**: All components via direct import  
**State**: Stateless  
**Error Handling**: Network failures throw exceptions

---

#### **2. Authentication API (`src/services/api.ts` - authApi)**
**Responsibility**: Google OAuth token verification.

```
POST /api/auth/google
Payload: { credential: string }
Response: { email, name, picture, email_verified, sub }
```

**Fallback**: Local authentication (demo mode) bypasses this endpoint.

---

### UI Modules

#### **3. MR Dashboard (`src/components/MRDashboard.tsx`)**
**Role**: Primary interface for MRs to manage daily visits.

**Responsibilities**:
- Display today's assigned visit schedules
- Show attendance check-in status
- Track recent visit history
- Real-time status updates (pending/in-progress/completed)
- Grid/List view modes

**Key Features**:
- Attendance check-in with GPS integration
- Visit expansion with detailed notes
- Quick actions: start visit, call contact, view details
- Performance metrics display

**Dependencies**:
- `api.visits` (schedules, visits)
- `api.attendance` (check-in status)
- `AuthContext` (current user)
- `NotificationContext` (toast notifications)
- `locationService` (GPS coordinates)

**Events Emitted**:
- `handleCheckIn()` → POST `/api/attendance/check-in`
- `handleStartVisit()` → PATCH `/api/visit-schedules/:id/start`

---

#### **4. MR Field Tracker (`src/components/MRFieldTracker.tsx`)**
**Role**: Step-by-step field visit recording workflow.

**Workflow Steps**:
1. **GPS** - Capture current location for check-in
2. **Photo** - Capture visit proof (auto-compressed to 200px JPEG)
3. **Record** - Voice recording with AI analysis
4. **Outcome** - Record products detailed, samples, order, feedback
5. **Checkout** - Capture checkout GPS

**Dependencies**:
- `api.visitRecords` (create/update visit records)
- `api.visitRecordings` (upload voice)
- `api.dailySummaries.get()` (load summary)
- `VoiceRecorder` component (audio capture)
- `locationService` (GPS)

**Data Model**:
```typescript
VisitRecord {
  check_in_gps, check_out_gps,
  photo_url, photo_captured,
  arrival_time, waiting_time, speaking_time,
  conversation_summary, audio_recording_url,
  sale_done, sale_amount, order_value,
  status: 'in_progress' | 'completed' | 'missed' | 'cancelled'
}
```

---

#### **5. Healthcare Directory (`src/components/HealthcareDirectory.tsx`)**
**Role**: Manage doctors, pharmacies, hospitals.

**Entities**:
- **Doctors**: specialty, tier (A/B/C), potential, rating, visit history
- **Pharmacies**: credit management, purchases, tier
- **Hospitals**: bed count, credit terms, contact person

**Features**:
- Full CRUD operations
- Search/filter by territory, tier, specialty
- View visit history and orders
- AI visit frequency analysis (via `geminiService`)

**Dependencies**:
- `api.doctors`, `api.pharmacies`, `api.hospitals`
- `geminiService.analyzeVisitFrequency()`

---

#### **6. Sales Tracking (`src/components/SalesTracking.tsx`)**
**Role**: Track orders and analyze sales performance.

**Data Tracked**:
- Sales with MR, product, doctor, clinic, quantity, amount
- AI forecasting with confidence intervals
- Revenue trends by product/territory/MR

**AI Features**:
- Sales forecasting (next 3-6 months)
- Natural language queries via voice/text
- Product recommendations

**Dependencies**:
- `api.sales`
- `api.sales.getForecast()`
- `geminiService.analyzeSales()`

---

#### **7. Expense Manager (`src/components/ExpenseManager.tsx`)**
**Role**: Track and analyze MR expenses.

**Categories**: Travel, Meals, Accommodation, Transport, etc.

**AI Features**:
- Cost reduction recommendations
- Anomaly detection
- Optimization insights

**Dependencies**:
- `api.expenses`
- `geminiService.analyzeExpenses()`

---

#### **8. Leads Management (`src/components/LeadsManagement.tsx`)**
**Role**: Track and convert new doctor leads.

**Lead States**: new → assigned → contacted → converted → lost

**Features**:
- Lead creation (manual or AI-detected from voice)
- Priority scoring (high/medium/low)
- Assignment to MRs
- Conversion tracking

**Dependencies**:
- `api.leads`
- `VisitRecordingData.detected_lead` (auto-lead creation)

---

#### **9. Visit Schedule (`src/components/VisitSchedule.tsx`)**
**Role**: Schedule and manage MR visit calendars.

**Features**:
- Create/update/cancel visits
- Priority assignment (high/medium/low)
- Recurring schedule templates
- Conflict detection

**Dependencies**:
- `api.visits.createSchedule()`
- `api.visits.deleteSchedule()`

---

#### **10. MR Field Tracking (`src/components/MRFieldTracker.tsx`)**
**Role**: Comprehensive GPS tracking and field activity monitoring (admin view).

**Features**:
- Real-time MR location on map
- Visit verification via GPS geofencing
- Activity timeline
- Route optimization insights

**Dependencies**:
- `api.locations.getAll()` / `api.locations.update()`
- `locationService` (browser geolocation)
- Map integration (Leaflet/Google Maps)

---

#### **11. Approval Workflow (`src/components/ApprovalWorkflow.tsx`)**
**Role**: Multi-level approval system for expense rescheduling, credit extensions.

**Workflow Types**:
- `reschedule` - Visit rescheduling requests
- `sale` - Large sale approvals
- `credit_extension` - Extended credit limits

**Features**:
- Submit approval requests
- Manager review & approve/reject
- Status tracking (pending/approved/rejected)
- Notification on decision

**Dependencies**:
- `api.approvals.getAll()`, `create()`, `update()`
- `NotificationContext`

---

#### **12. Entity Credits (`src/components/EntityCredits.tsx`)**
**Role**: Credit limit management for doctors, pharmacies, hospitals.

**Features**:
- View current credit limits
- Track outstanding balances
- Update credit terms
- Block/Unblock entities

**Dependencies**:
- `api.credits.getAll()`, `update()`

---

#### **13. Daily Call Plan (`src/components/DailyCallPlan.tsx`)**
**Role**: AI-recommended daily visit plan for MRs.

**Recommendations Based On**:
- Visit frequency analysis
- Days since last visit
- Entity tier (A/B/C priority)
- Historical order patterns

**Features**:
- Auto-generated daily plan
- Drag & drop rescheduling
- Mark calls as completed/missed
- Voice logging integration

**Dependencies**:
- `api.dailyCallPlan.getAll()`, `create()`, `complete()`
- `geminiService.forecastEntityLead()` (priority scoring)

---

#### **14. Global Search (`src/components/GlobalSearch.tsx`)**
**Role**: Universal search across all entities (Ctrl+K).

**Searchable Types**:
- Doctors, Pharmacies, Hospitals
- MRs, Leads, Sales
- Products, Expenses

**Features**:
- Fuzzy matching
- Keyboard navigation
- Quick actions (view, edit, call)

**Dependencies**:
- All list APIs (`/api/*` GET endpoints)

---

#### **15. Voice Assistant (`src/components/VoiceAssistant.tsx`)**
**Role**: Voice command interface for hands-free operation.

**Supported Commands**:
- "Open search" / "Close search"
- "Go to dashboard"
- "Start visit"
- "Log expense"
- Navigation commands

**Dependencies**:
- Web Speech API (browser-native)
- `navigate()` from react-router

---

#### **16. Login (`src/components/Login.tsx`)**
**Role**: Authentication gateway.

**Authentication Methods**:
1. **Email/Password** (demo mode accepts any password for seeded users)
2. **Google OAuth** (optional, requires `GOOGLE_CLIENT_ID`)
3. **Demo credentials** (one-click fill)

**Demo Users**:
- Admin: `admin@metapharsic.com` / `admin123`
- MR: `rajesh.kumar@metapharsic.com` / any

**Dependencies**:
- `AuthContext.login()`
- `AuthContext.loginWithGoogle()`
- `authApi.verifyGoogleToken()` (OAuth only)

---

#### **17. Sidebar (`src/components/Sidebar.tsx`)**
**Role**: Main navigation with role-based menu.

**Menu Items** (role-gated):
- Dashboard (all)
- MR Management (admin/manager)
- Directory (directory.view)
- Sales, Expenses, Schedule, Leads (respective permissions)
- Field Tracker (data.view)
- Settings (settings.view)
- Users (users.view - admin only)

**Features**:
- Active route highlighting
- Collapsible sections
- User profile dropdown
- Search trigger (Ctrl+K)

**Dependencies**:
- `useAuth()` for permissions & user info
- `useNavigate()` for routing

---

### Context Providers

#### **18. Authentication Context (`src/contexts/AuthContext.tsx`)**
**Role**: Centralized auth state management.

**Responsibilities**:
- User login/logout
- Role-based permission checks
- User CRUD (admin only)
- Persist to localStorage

**State**:
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  users: User[],              // All system users
  permissions: string[]        // Current user's permissions
}
```

**User Model**:
```typescript
User {
  id: number,
  name: string,
  email: string,
  role: 'admin' | 'manager' | 'mr' | 'viewer',
  mr_id?: number,              // Linked MR record
  avatar_url?: string,
  permissions: string[],
  last_login?: string,
  created_at: string
}
```

**Default Users** (auto-seeded):
- Admin (/admin123)
- Pre-configured MRs from `server.ts` dummy data

**Permissions** (role-based):
```typescript
admin:   ['dashboard.view', 'mrs.view', 'mrs.create', ..., 'users.*']
manager: ['dashboard.view', 'mrs.view', 'mrs.edit', ..., 'reports.*']
mr:      ['dashboard.view', 'products.view', 'directory.view', ..., 'mr-dashboard.view']
viewer:  ['dashboard.view', 'mrs.view', 'products.view', ...]
```

**Helper Functions**:
- `hasPermission(permission)` - Check single permission
- `hasRole(roles[])` - Check role membership
- `canAccessRoute(route)` - Check route accessibility
- `assignRoleToMR(mrId, role, userId?)` - Link MR to user account

**Persistence**: localStorage keys:
- `metapharsic_users` - All user accounts
- `metapharsic_current_user` - Current session
- `metapharsic_google_user` - OAuth profile

---

#### **19. Notification Context (`src/contexts/NotificationContext.tsx`)**
**Role**: Toast notification system.

**Notification Types**:
- `success` (green)
- `error` (red)
- `warning` (amber)
- `info` (blue)

**API**:
```typescript
addNotification(message, type, duration?)
removeNotification(id)
```

**Usage Example**:
```typescript
const { addNotification } = useNotifications();
addNotification('Check-in successful!', 'success');
```

**Dependencies**: Framer Motion for animations

---

### AI Analysis Agents

#### **20. Gemini AI Service (`src/services/geminiService.ts`)**
**Role**: AI-powered analytics with offline fallback.

**No API Key Required** - Automatically falls back to rule-based local analysis when `GEMINI_API_KEY` is not set.

**Capabilities**:

##### 20.1 `forecastLead(visitNotes, doctorName, purpose)`
Predicts if a doctor is a high-potential lead.

**Returns**:
```typescript
{
  isLead: boolean,
  confidence: number,           // 0-1
  reasoning: string,
  suggestedPriority: 'high' | 'medium' | 'low'
}
```

**Fallback Logic**:
- Always returns `isLead: true` with 0.75 confidence
- Reasoning: "Based on the visit notes, this doctor shows interest..."

---

##### 20.2 `analyzeVisitFrequency(visits, entityName, entityType)`
Analyzes visit patterns and recommends optimal frequency.

**Returns**:
```typescript
{
  entity_id: number,
  entity_name: string,
  total_visits: number,
  last_visit_date: string,     // YYYY-MM-DD or "Never"
  visits_last_30_days: number,
  visits_last_90_days: number,
  avg_gap_between_visits: number,
  recommended_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly',
  is_overdue: boolean,
  next_recommended_date: string,
  trend: 'increasing' | 'stable' | 'decreasing'
}
```

**Fallback Algorithm**:
- `visits30 >= 8` → daily
- `visits30 >= 4` → weekly
- `visits30 >= 2` → biweekly
- `visits90 <= 1` → quarterly
- Default: monthly

---

##### 20.3 `analyzeVisitComments(visits, entityName)`
Sentiment analysis on conversation summaries.

**Returns**:
```typescript
{
  entity_id: number,
  entity_name: string,
  total_comments_analyzed: number,
  overall_sentiment: 'positive' | 'neutral' | 'negative',
  sentiment_trend: 'improving' | 'stable' | 'declining',
  key_concerns: string[],       // Top 3
  interest_topics: string[],    // Top 3
  product_mentions: string[],
  engagement_score: number,     // 0-100
  summary: string               // MR summary
}
```

**Fallback Logic**:
- Sentiment: positive if >0 comments, else neutral
- Concerns: ['Follow-up needed', 'Product interest detected']
- Engagement: 65 (with comments) or 20 (no comments)

---

##### 20.4 `forecastEntityLead(profile, visits, transcript?)`
Comprehensive lead forecasting with revenue predictions.

**Profile Structure**:
```typescript
{
  name: string,
  type: 'doctor' | 'chemist' | 'hospital' | 'clinic',
  tier: 'A' | 'B' | 'C',
  specialty?: string
}
```

**Returns**:
```typescript
{
  entity_id: number,
  entity_type: string,
  entity_name: string,
  lead_probability: number,       // 0-100
  lead_status: 'hot' | 'warm' | 'cold' | 'unknown',
  revenue_forecast: number,      // INR monthly estimate
  recommended_actions: string[], // 3 specific actions
  risk_factors: string[],        // 2-3 risks
  confidence: number,            // 0-100
  reasoning: string
}
```

**Fallback Algorithm**:
- Has transcript (>20 chars) → 60% probability, hot status
- Has orders → 45% probability, warm status
- Otherwise → 20% probability, cold status
- Revenue: `probability * 150`
- Confidence: 55 (transcript) or 30 (no data)

---

##### 20.5 `analyzeSales(query, salesSummary)`
Natural language sales analytics.

**Input**: User query about sales data + aggregated sales summary

**Returns**: String response or `null` if unavailable

**Fallback**: Returns `null` (no-op), client handles display

---

##### 20.6 `analyzeExpenses(query, expenseSummary)`
Expense optimization recommendations.

**Input**: Query about expenses + aggregated expense data

**Returns**: String response or `null` if unavailable

**Fallback**: Returns `null` (no-op), client handles display

---

### Utility Services

#### **21. Location Service (`src/services/locationService.ts`)**
**Role**: GPS tracking for MR field activities.

**API**:
```typescript
locationService.getLastLocation() -> { lat, lng, timestamp }
locationService.startTracking(callback)
locationService.stopTracking()
```

**Browser API**: `navigator.geolocation`
- High accuracy mode
- 10-second timeout
- Uses cached last known location when available

---

#### **22. Google Calendar (`src/services/googleCalendar.ts`)**
**Role**: Calendar integration (placeholder - requires API).

**Status**: Stub implementation, not actively used

---

#### **23. Gmail Notifications (`src/services/gmailNotifications.ts`)**
**Role**: Email notifications via Gmail API (placeholder).

**Status**: Stub implementation

---

#### **24. Data Classifier (`src/lib/dataClassifier.ts`)**
**Role**: Automatic categorization of visit notes.

**Classifications**:
- `sample_discussion`
- `product_efficacy`
- `pricing_objection`
- `order_placed`
- `follow_up_required`
- `complaint`
- `general_enquiry`

**Algorithm**: Keyword-based rule engine (no ML dependency)

---

## Agent Communication

### Direct Import Pattern
Most frontend agents communicate via direct service imports:

```typescript
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../services/geminiService';
```

### Context-based State Sharing
Global state via React contexts:
- `AuthContext` - Authentication & permissions
- `NotificationContext` - Toast notifications

### API Contract
Frontend agents → Backend server via REST JSON:
- Methods: GET, POST, PATCH, DELETE
- Authentication: None (local) or session-based (OAuth stub)
- Response: Always JSON with consistent data shapes from `types.ts`

### Server → External APIs
Only optional integrations:
- Google OAuth verification (if configured)
- Gemini AI analysis (if configured)

Both have local fallbacks.

---

## Data Flow

### 1. Authentication Flow
```
Login Form
  ↓ submit(email, password)
AuthContext.login()
  ↓ (demo mode: accepts any password for seeded users)
setUser(user) + localStorage
  ↓
ProtectedRoute renders component
```

### 2. Visit Recording Flow
```
MRFieldTracker (Step 1-5)
  ↓ collect: GPS, photo, audio, outcome
  ↓ POST /api/visit-recordings
  ↓ POST /api/visit-recordings/:id/complete
  ↓ auto-analyze: geminiService.forecastLead(transcript)
  ↓ create lead if detected → POST /api/leads
```

### 3. AI Analysis Flow
```
Component needs insights
  ↓ call geminiService.*()
  ↓ check: apiKey configured?
  ↓ YES: fetch Gemini API (async)
  ↓ NO:  return mock fallback (sync)
  ↓ display results in UI
```

### 4. Attendance Flow
```
MRDashboard → handleCheckIn()
  ↓ locationService.getLastLocation()
  ↓ POST /api/attendance/check-in { mr_id, lat, lng }
  ↓ update local state + notification
  ↓ realtime update via re-fetch
```

---

## Key Design Principles

1. **Zero Hard Dependencies**: All external APIs (Google, Gemini) have local fallbacks
2. **Modular Agents**: Each component has single responsibility
3. **Type Safety**: Full TypeScript interfaces in `types.ts`
4. **Error Resilience**: Network failures → local state continues
5. **Role-Based Access**: Permission checks at route & component level
6. **Demo Mode Out of Box**: Works with seeded data without configuration
7. **Progressive Enhancement**: AI features add value but aren't critical

---

## Extension Points

To add a new agent/module:

1. **Define types** in `src/types.ts`
2. **Create component** in `src/components/` (if UI) or `src/services/` (if logic)
3. **Add API routes** in `server.ts` (if backend needed)
4. **Register routes** in `src/App.tsx`
5. **Add permission** to `ROLE_PERMISSIONS` in `AuthContext.tsx`
6. **Add to sidebar** in `src/components/Sidebar.tsx`
7. **Document** here in `AGENTS.md`!

---

## Deployment Notes

### Environment Variables
```bash
# Optional - only if enabling real OAuth
GOOGLE_CLIENT_ID="..."
VITE_GOOGLE_CLIENT_ID="..."

# Optional - only if enabling real AI
GEMINI_API_KEY="..."

# Required
APP_URL="http://localhost:3000"
```

### Built-in Demo Users
- Admin: `admin@metapharsic.com` / `admin123`
- MRs: Any seed email + any password
- Seeded from `server.ts` dummy data

### Production Scaling
- Replace in-memory store with PostgreSQL/MongoDB
- Implement real OAuth flow
- Add proper session management (JWT/cookies)
- Deploy `server.ts` as standalone Express app
- Build frontend: `npm run build` → serve `dist/`

---

**End of AGENTS.md**

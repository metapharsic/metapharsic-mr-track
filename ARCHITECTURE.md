# System Architecture - Metapharsic Life Sciences CRM

**Version**: 1.0  
**Architecture**: Monolithic Full-Stack Application  
**Pattern**: API-First, Agent-Based Design  
**Date**: 2025-04-08

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Scalability Design](#scalability-design)
7. [Design Decisions & Rationale](#design-decisions--rationale)
8. [Deployment Topology](#deployment-topology)
9. [Future Evolution](#future-evolution)

---

## High-Level Overview

The Metapharsic CRM is a **Medical Representative (MR) Life Sciences** management system that enables:

- MR field activity tracking (GPS, voice, photos)
- Sales and expense management
- Doctor/lead relationship management
- AI-powered analytics and forecasting
- Multi-role access control (Admin, Manager, MR, Viewer)

**Key Characteristics**:
- **Offline-Capable**: Works without external APIs via mock data & local AI
- **Real-Time**: Live attendance, visit tracking, notifications
- **Mobile-Ready**: Responsive design, GPS integration, voice support
- **Zero Config**: Runs out-of-box with seeded demo data

---

## Technology Stack

### Frontend
| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | React 19 | UI library with hooks |
| **Language** | TypeScript 5.8 | Type safety |
| **Routing** | React Router 7.13 | Client-side navigation |
| **Styling** | Tailwind CSS 4.x | Utility-first CSS |
| **Icons** | Lucide React | Icon library |
| **Animation** | Framer Motion 12 | Smooth transitions |
| **HTTP Client** | Native Fetch | API communication |
| **Forms** | Controlled React forms | User input |
| **Charts** | Recharts 3.8 | Data visualization |
| **Voice** | Web Speech API | Speech-to-text |
| **Geolocation** | Browser Geolocation API | GPS tracking |

### Backend
| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express.js 4.x | REST API server |
| **Dev Server** | Vite 6.x | Hot reload, build tool |
| **Process Manager** | PM2 (production) | Daemon process |
| **Database** | In-memory (demo) / PostgreSQL (prod) | Data persistence |
| **Caching** | Redis (optional) | Session & cache |

### AI/ML
| Service | Technology | Fallback |
|---------|------------|----------|
| **LLM** | Google Gemini Flash | Rule-based local analysis |
| **Use Cases** | Lead scoring, frequency analysis, sentiment, forecasting | Heuristic algorithms |

### Authentication
| Service | Technology | Backups |
|---------|------------|---------|
| **Primary** | Local Storage + Demo Auth | Works offline |
| **Optional** | Google OAuth 2.0 | Silently disabled if not configured |

### Infrastructure
| Component | Technology |
|-----------|------------|
| **Containerization** | Docker |
| **Cloud** | GCP Cloud Run / AWS EB / Azure App Service |
| **CDN** | CloudFlare / CloudFront (static assets) |
| **SSL** | Let's Encrypt / Cloud Provider certs |
| **Monitoring** | PM2-Monit / CloudWatch / App Insights |
| **CI/CD** | GitHub Actions |

---

## System Components

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User (Browser)                      │
└───────────────────────────┬───────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Optional)                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                     SSL Termination                   │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express.js Server (server.ts)            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  REST API Layer                                      │ │
│  │  - /api/mrs, /api/doctors, /api/sales, ...          │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  In-Memory Data Store (or PostgreSQL connection)     │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────┘
                            │
                            │ Optional External APIs
                            ▼
              ┌──────────────────────────┐
              │  Google OAuth            │
              │  Gemini AI (optional)    │
              └──────────────────────────┘
```

### Layer Breakdown

#### 1. Presentation Layer (Frontend)

**Components** (React):
```
App.tsx              - Main app with routing setup
├─ Login.tsx          - Authentication gateway
├─ Sidebar.tsx        - Navigation menu (role-based)
├─ Dashboard.tsx      - Admin analytics overview
├─ MRDashboard.tsx    - MR daily visits & attendance
├─ MRFieldTracker.tsx - Field visit recording workflow
├─ HealthcareDirectory.tsx - Doctors/Pharmacies/Hospitals
├─ SalesTracking.tsx  - Orders & forecasting
├─ ExpenseManager.tsx - Expense tracking & AI insights
├─ LeadsManagement.tsx- Lead pipeline
├─ VisitSchedule.tsx  - Calendar scheduling
└─ ...
```

**State Management**:
- **Local**: Component `useState` for UI state
- **Global**: React Contexts (`AuthContext`, `NotificationContext`)
- **Server**: Data fetched via `api` service

#### 2. Application Layer (Backend)

**Server (`server.ts`)**:
- Express.js configuration
- CORS, JSON body parsing
- Static file serving (Vite dev server)
- API route definitions (~50 endpoints)
- In-memory data store (demo) or DB connection (prod)
- Request validation
- Error handling middleware

**API Service (`src/services/api.ts`)**:
- Centralized HTTP client
- Organized by domain (mrs, sales, visits, etc.)
- Type-safe request/response (TypeScript)

#### 3. Data Layer

**Demo Mode**:
```typescript
const data = {
  mrs: [...],        // 6 MR records
  doctors: [...],    // 20 doctors
  pharmacies: [...], // 15 pharmacies
  hospitals: [...],  // 10 hospitals
  products: [...],   // 50 products
  schedules: [...],  // 23 visit schedules
  // ... more
};
```

**Production**: PostgreSQL schema with normalized tables.

---

## Data Flow

### 1. User Authentication Flow

```
┌─────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────┐
 │  Login  │────▶│ AuthCtx    │────▶│ localStorage│────▶│ Protected│
 │  Form   │     │ .login()   │     │ .setItem()  │     │  Route   │
 └─────────┘     └────────────┘     └─────────────┘     └──────────┘
       │                 │                      │                │
       │                 │                      │                ▼
       │                 │                      │        ┌────────────┐
       │                 │                      │        │  Component │
       │                 │                      │        │  Renders   │
       └─────────────────┴──────────────────────┴────────┴────────────┘
```

**Demo Credentials** (any password accepted):
- `admin@metapharsic.com` / `admin123`
- Pre-seeded MR emails

**Google OAuth Flow** (optional):
```
1. User clicks "Sign in with Google"
2. Google returns OAuth token
3. POST /api/auth/google verifies token
4. AuthContext.loginWithGoogle() creates/fetches user
5. Redirect to appropriate dashboard
```

### 2. Visit Recording Flow (Field Tracker)

```
MR selects schedule
        │
        ▼
MRFieldTracker component mounts
        │
        ├─▶ Step 1: GPS Check-in
        │   └─ locationService.getCurrentPosition()
        │
        ├─▶ Step 2: Photo Capture
        │   └─ FileReader → compress → base64
        │
        ├─▶ Step 3: Voice Recording
        │   └─ MediaRecorder API → Blob → base64
        │   └─ geminiService.forecastLead(transcript) [AI]
        │
        ├─▶ Step 4: Outcome Form
        │   └─ Products, order, feedback
        │
        └─▶ Step 5: Check-out GPS
            │
            └─ POST /api/visit-records (complete record)
            └─ Auto-create lead if detected
            └─ Update schedule: 'completed'
```

### 3. AI Analysis Flow

```
Component needs insights
        │
        ▼
Call geminiService.{method}()
        │
        ├─ Check: GEMINI_API_KEY configured?
        │  │
        │  ├─ YES ──▶ Fetch https://generativelanguage.googleapis.com/...
        │  │           └─ Parse JSON response
        │  │
        │  └─ NO ───▶ Return local fallback (rules/heuristics)
        │
        ▼
Display results in UI
```

**Fallback Example**: `analyzeVisitFrequency()`
- If no API key: Uses simple thresholds (visits30 >= 8 → daily)
- If API key: Gemini model analyzes patterns

### 4. Real-Time Updates

Currently uses **polling** (not true WebSocket):

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    api.visits.getSchedules(); // Re-fetch every 30s
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

**Future**: Could implement Socket.io for push notifications.

---

## Security Architecture

### Authentication Model

**Demo Mode**:
- ✅ No authentication required
- ✅ Hardcoded demo users with any password
- ✅ Session stored in `localStorage`
- ⚠️ Not production secure

**Production**:
- 🔒 Google OAuth 2.0 or JWT
- 🔒 Password hashing (bcrypt)
- 🔒 Server-side sessions (Redis) or signed JWT
- 🔒 CSRF protection (csurf middleware)
- 🔒 Helmet.js security headers

### Authorization

Role-Based Access Control (RBAC):

```typescript
Permissions = {
  admin:   ['dashboard.view', 'mrs.*', 'users.*', ...],   // Full access
  manager: ['dashboard.view', 'mrs.edit', 'sales.*', ...], // Limited admin
  mr:      ['dashboard.view', 'mr-dashboard.view', ...],  // Field staff only
  viewer:  ['dashboard.view', 'mrs.view', ...]            // Read-only
}
```

Check: `AuthContext.hasPermission('sales.view')`

### Data Validation

- ✅ All inputs validated in frontend forms
- ✅ Creation/update endpoints validate payloads
- ✅ TypeScript prevents type mismatches
- ✅SQL queries use parameterized inputs (no concatenation)

### Rate Limiting

**Not implemented** (demo only). For production:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

---

## Scalability Design

### Horizontal Scaling Strategy

```
                    ┌─────────────┐
                    │   Load      │
                    │  Balancer   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │  App 1   │    │  App 2   │   │  App 3   │
    └────┬─────┘    └────┬─────┘   └────┬─────┘
         │               │              │
         └───────────────┼──────────────┘
                         │
                    ┌────▼────┐
                    │ Shared  │
                    │  DB     │
                    └─────────┘
```

**Requirements**:
- Stateless app servers (no local storage)
- Database connection pooling (`pgbouncer`)
- Shared session store (Redis)
- Load balancer health checks

### Database Scaling

**Read-heavy workloads** (analytics, reports):

```
           ┌──────────────┐
           │   Primary    │  (Writes)
           └──────┬───────┘
                  │ Replication
           ┌──────┴───────┐
           │   Replica 1  │  (Reads)
           └──────┬───────┘
           │      │
           ▼      ▼
       Read   Read
```

### Caching Strategy

**Redis for**:
1. Session storage (if using server-side sessions)
2. API response caching (frequent queries):
   - Products list (rarely changes)
   - MR territories
   - Configuration settings
3. Rate limiting counters

**CDN for**:
1. Static assets (`dist/` build)
2. Uploaded images (S3/CloudFront)

---

## Design Decisions & Rationale

### 1. Single Monolith vs Microservices

**Decision**: Monolith (single repo, single server)

**Rationale**:
- ✅ Simpler deployment (one process)
- ✅ Shared types & code reuse
- ✅ Easier debugging (single stack trace)
- ✅ No network latency between services
- ✅ Perfect for small team (likely <10 devs)

**Future Split**: If scale requires, extract:
- `users-service` (auth/user mgmt)
- `analytics-service` (AI/forecasting)
- `notification-service` (emails/push)

### 2. In-Memory vs Database

**Decision**: In-memory for demo, PostgreSQL for production

**Rationale**:
- ✅ Zero-setup demo (just `npm install && npm run dev`)
- ✅ Fast development (no migrations)
- ✅ Easy to understand schema
- ⚠️ Data lost on restart (acceptable for demo)

**Production Migration**:
- Replace `data` object with SQL queries
- Use TypeORM or Prisma for ORM
- Keep API shape identical

### 3. React Router v7 vs Other Routing

**Decision**: React Router (de facto standard)

**Rationale**:
- ✅ Battle-tested, widely used
- ✅ Good TypeScript support
- ✅ Lazy loading & code splitting
- ✅ Nested routes for layout
- ✅ Declarative route guards (`ProtectedRoute`)

### 4. Tailwind CSS vs Component Library

**Decision**: Tailwind CSS utility classes

**Rationale**:
- ✅ No design system lock-in (MUI, AntD, etc.)
- ✅ Highly customizable
- ✅ Small bundle size (purge unused)
- ✅ Rapid prototyping
- ✅ Consistent spacing/sizing

**No component library** because:
- Avoid bloat
- Custom branding flexibility
- No dependency lock-in

### 5. Local AI Fallback vs Hard Dependency

**Decision**: Gemini API with local fallback

**Rationale**:
- ✅ Free tier limits → app still works
- ✅ No API key needed for demo
- ✅ Predictable behavior when offline
- ✅ Easy to swap AI provider (only `geminiService.ts`)

**Fallback Quality**:
- Simple but reasonable heuristics
- "Good enough" for demo purposes
- Marked clearly when using fallback (console warnings)

### 6. localStorage vs Cookies vs Backend Sessions

**Demo**: localStorage (simplest)
- ✅ Persists across page reloads
- ✅ No server setup needed
- ⚠️ Vulnerable to XSS (acceptable for demo)

**Production**: HTTP-only cookies or JWT
- ✅ More secure (not accessible to JS)
- ✅ CSRF protection easier
- ✅ Server can revoke

### 7. Vite + Express vs Separate Frontend/Backend

**Decision**: Vite dev server as middleware in Express

**Rationale**:
- ✅ Single `npm run dev` command
- ✅ Same origin API (no CORS during dev)
- ✅ Simple production build (`npm run build`)
- ⚠️ Less flexible for separate deployments

**Production**: Serve static files from Express:
```typescript
app.use(express.static('dist'));
```

---

## Deployment Topology

### Development

```
Developer Machine
├─ Node.js + npm
├─ Vite dev server (port 3000)
├─ Hot reload (file watch)
└─ In-memory data store
```

No database, no external services needed.

### Staging

```
VPS / Cloud Instance
├─ Node.js app (PM2)
├─ PostgreSQL
├─ Nginx reverse proxy
├─ SSL certificate
└─ Domain name (staging.example.com)
```

### Production (Scaled)

```
                    ┌──────────────┐
                    │   Cloud      │
                    │  Load       │
                    │  Balancer    │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │  App 1   │    │  App 2   │   │  App 3   │
    │  Docker  │    │  Docker  │   │  Docker  │
    └────┬─────┘    └────┬─────┘   └────┬─────┘
         │               │              │
         └───────────────┼──────────────┘
                         │
                    ┌────▼────┐
                    │  Redis  │  (session/cache)
                    └─────────┘
                         │
                    ┌────▼────┐
                    │   PostgreSQL │
                    │   (Primary) │
                    └────┬─────┘
                         │ Replication
                    ┌────▼────┐
                    │ Replica │
                    └─────────┘
```

---

## Future Evolution

### Phase 2: Enhanced Features

1. **Real Database**: PostgreSQL with migrations
2. **File Storage**: AWS S3 for photos/audio
3. **Notifications**: Push notifications (FCM/APNs)
4. **Messaging**: In-app chat between MRs/managers
5. **Reports**: PDF export, scheduled reports
6. **Mobile App**: React Native wrapper for field use
7. **Offline Mode**: Service Worker + IndexedDB sync
8. **Multi-tenant**: Support multiple companies

### Phase 3: Enterprise Features

1. **Audit Logging**: Track all data changes
2. **Advanced Analytics**: ML models for predictions
3. **Integration APIs**: Connect to ERP, accounting systems
4. **Workflow Engine**: Customizable approval flows
5. **Multi-language**: i18n support (English, Hindi, Telugu, etc.)
6. **DSAR Compliance**: GDPR data export/deletion

### Phase 4: AI-Powered

1. **Voice AI**: Full conversation analysis
2. **Computer Vision**: Photo analysis of products/shelves
3. **Predictive Routing**: Optimal visit sequence
4. **Sentiment Tracking**: Monitor doctor satisfaction over time
5. **Pricing Optimization**: Dynamic pricing suggestions

---

## Performance Targets

| Metric | Target |
|--------|--------|
| **API Response Time** | <100ms (p95) |
| **Page Load** | <2s (first paint) |
| **Bundle Size** | <500KB (gzipped) |
| **Concurrent Users** | 1000+ per instance |
| **Database Queries** | <50ms (indexed) |
| **Uptime** | 99.9% (SLA) |

---

## Monitoring & Observability

### Application Metrics

```typescript
// Track in code
console.log(JSON.stringify({
  level: 'info',
  event: 'visit_completed',
  mr_id: 1,
  duration: 45,
  order_value: 75000,
  timestamp: new Date().toISOString()
}));
```

### Infrastructure Monitoring

- **Server**: CPU/Memory/Disk (CloudWatch/Prometheus)
- **Database**: Connections, slow queries, replication lag
- **Network**: Request rate, latency, error rate
- **Uptime**: Ping endpoint `/health` every 30s

### Alerting

Set alerts for:
- 5xx error rate > 1%
- API response time > 500ms
- Database connections > 80%
- Disk space < 20GB
- MR check-in异常 (suspicious patterns)

---

## Cost Estimation (Production)

### Small Deployment (100 users)

| Service | Monthly Cost |
|---------|--------------|
| VPS (4GB RAM, 2 vCPU) | $20-40 |
| PostgreSQL (managed) | $15-25 |
| Domain + SSL | $10-15 |
| Backup storage | $5-10 |
| **Total** | **$50-90/month** |

### Medium Deployment (500 users)

| Service | Monthly Cost |
|---------|--------------|
| Load balancer + 2x app instances | $80-120 |
| PostgreSQL (8GB, read replica) | $100-200 |
| Redis Cloud | $20-40 |
| CDN + Storage (images/audio) | $30-50 |
| SSL & domain | $15 |
| **Total** | **$245-425/month** |

---

## Conclusion

This architecture provides:
- ✅ **Rapid time-to-value** (5-minute setup)
- ✅ **Production-ready foundation** (scalable patterns)
- ✅ **AI-enhanced** with offline fallbacks
- ✅ **Role-based security** (RBAC)
- ✅ **Mobile-first** field workflows
- ✅ **Cost-effective** deployment

The design prioritizes developer experience while maintaining scalability for growth.

---

**End of ARCHITECTURE.md**

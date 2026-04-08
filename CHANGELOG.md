# Changelog

All notable changes to the Metapharsic Life Sciences CRM project.

---

## [Unreleased] - 2025-04-08

### Added
- **MR Dashboard** - Complete redesign with grid/list toggle, attendance check-in, expandable visit cards
- **MR Field Tracker** - Multi-step workflow for field visit recording
  - GPS check-in/out with location capture
  - Photo proof capture with automatic 200px JPEG compression
  - Voice recording with live transcription
  - AI analysis of conversations (lead detection, sentiment, product mentions)
  - Outcome form with order tracking
- **Attendance System** - GPS-based check-in with location verification
- **Approval Workflow** - Multi-level approval system for expenses, reschedules, credit extensions
- **Entity Credits Management** - Credit limit tracking for doctors/pharmacies/hospitals
- **Missed Visit Alerts** - Automatic notification when MR misses scheduled visit
- **Daily Summaries** - End-of-day activity reports per MR
- **Daily Call Plan** - AI-recommended daily visit schedule
- **Voice Assistant** - Browser speech API integration for navigation commands
- **Global Search** - Ctrl+K universal search across all entities
- **Notification Panel** - Real-time toast notifications
- **Photo Compression** - Automatic 200px JPEG compression to avoid oversized uploads
- **AI Fallback System** - All AI features work without API keys using local heuristics
- **Demo Authentication** - Hardcoded demo credentials for instant testing
- **In-Memory Data Store** - Realistic dummy data for immediate prototyping

### Changed
- Upgraded to React 19
- Upgraded to TypeScript 5.8
- Upgraded to Vite 6.x
- Switched from CRA to Vite + Express custom server
- Rewrote server.ts with comprehensive REST API (50+ endpoints)
- Restyled entire UI with Tailwind CSS 4.x
- Replaced Redux with Context API for state management
- Implemented role-based access control (RBAC) with 4 roles
- Enhanced responsive design for mobile field use

### Security
- Removed hardcoded API dependencies (now optional)
- Input validation on all API endpoints
- TypeScript strict mode enforcement
- Prepared for JWT/session-based auth

### Infrastructure
- Added `render.yaml` for Render.com deployment
- Configured for Node.js 18+ runtime
- Production build pipeline with `npm run build`
- Hot reload development server with Vite

---

## [0.1.0] - 2025-04-01 (Initial Release)

### Added
- Basic MR management (CRUD)
- Product portfolio
- Doctor/pharmacy/hospital directory
- Sales tracking
- Expense tracking
- Visit scheduling
- Leads management
- Google OAuth integration (optional)
- Gemini AI integration (optional)

---

## Version Strategy

### Semantic Versioning

We use **SemVer**: `MAJOR.MINOR.PATCH`

- **MAJOR** - Breaking changes (new architecture, DB schema changes)
- **MINOR** - New features (new modules, significant enhancements)
- **PATCH** - Bug fixes, small improvements

### Release Branches

- `main` - Stable production releases
- `develop` - Integration branch for features
- `feature/*` - Feature development
- `hotfix/*` - Critical production fixes

---

## Migration Notes

### From v0.1.0 to v1.0.0

**Breaking Changes**:
- Dropped Create React App (use Vite now)
- Changed authentication flow (removed password hashing requirement in demo mode)
- API endpoints restructured (`/api/*` now organized by domain)
- Type definitions moved to `src/types.ts` (were scattered)

**Upgrade Steps**:
1. Update dependencies to match `package.json`
2. Replace CRA config with Vite config (`vite.config.ts`)
3. Update API calls to use new `src/services/api.ts` structure
4. Run `npm run build` - fix any TypeScript errors
5. Test thoroughly before deploying

---

## Patch Releases

### [1.0.0] - 2025-04-08

**Initial full release with demo mode**

---

## Contributors

Thanks to all contributors!

- metapharsic-team@metapharsic.com

---

**Legend**:
- 🎨 UI/UX improvements
- 🐛 Bug fix
- ⚡ Performance improvement
- 🔒 Security
- 📱 Mobile optimization
- 🤖 AI/ML feature
- 📚 Documentation
- 🏗️ Architecture change

---

**End of CHANGELOG.md**

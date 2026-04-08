<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Metapharsic Life Sciences CRM" width="1200" height="475">

# 🏥 Metapharsic Life Sciences CRM

**Medical Representative Field Tracking & Analytics Platform**

[![Live on Render](https://img.shields.io/badge/Live-Render.com-00DFA2?logo=render&logoColor=white)](https://render.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 🚀 Live Application

**🌐 URL**: [metapharsic-life-science.onrender.com](https://metapharsic-life-science.onrender.com)

**Status**: ✅ Live | 🆓 Free Tier (May sleep after 15min inactivity)

---

## 📋 Quick Links

| Documentation | Description |
|--------------|-------------|
| **[QUICKSTART.md](QUICKSTART.md)** | Get running locally in 5 minutes |
| **[API.md](API.md)** | Complete REST API reference (50+ endpoints) |
| **[AGENTS.md](AGENTS.md)** | System architecture & component breakdown |
| **[FEATURES.md](FEATURES.md)** | Complete feature guide with screenshots |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Technical design & scalability patterns |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deploy to any cloud platform |
| **[RENDER.md](RENDER.md)** | Render-specific deployment & management |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Developer guide & contribution rules |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history & changes |

---

## ✨ Key Features

### 🎯 Core Functionality
- **MR Field Tracking** - GPS, photo proof, voice recording, automated visit logging
- **Real-Time Dashboard** - Live metrics, performance scores, activity tracking
- **Sales Management** - Order entry, forecasting, revenue analytics
- **Expense Tracking** - Receipt upload, approval workflow, AI cost optimization
- **Healthcare Directory** - Doctors, pharmacies, hospitals with AI visit recommendations
- **Lead Management** - Pipeline tracking, auto-assignment, conversion analytics
- **Visit Scheduling** - Intelligent daily call plan, bulk scheduling, conflict detection
- **Approval Workflow** - Multi-level approvals for expenses, reschedules, credits

### 🤖 AI-Powered (Optional)
- **Lead Scoring** - Predict high-potential doctors from conversation
- **Visit Frequency Analysis** - Optimal visit scheduling recommendations
- **Sentiment Analysis** - Doctor engagement tracking over time
- **Revenue Forecasting** - 3-month sales predictions with confidence intervals
- **Expense Optimization** - Cost reduction recommendations
- **Natural Language Queries** - Ask questions about your data

### 📱 Mobile-Field Ready
- **GPS Verification** - Prevent fake check-ins with geofencing
- **Photo Capture** - Auto-compressed proof of visit (200px JPEG)
- **Voice Recording** - Speech-to-text with AI analysis
- **Offline-Capable** - Works without API keys (demo mode)
- **Responsive Design** - Optimized for tablets & phones

---

## 🔐 Demo Credentials

**No setup required!** The app runs immediately with demo data.

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@metapharsic.com` | `admin123` | Full access to all features |
| **MR** | `rajesh.kumar@metapharsic.com` | *any* | MR dashboard, field tracker, personal data |
| **MR** | `suresh.raina@metapharsic.com` | *any* | MR dashboard, field tracker, personal data |
| **MR** | `priya.sharma@metapharsic.com` | *any* | MR dashboard, field tracker, personal data |

---

## ⚡ 5-Minute Setup (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to: **http://localhost:3000**

### 4. Login
Use any demo credentials above.

**That's it!** No database setup, no API keys needed.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              React Frontend (SPA)               │
│  • TypeScript + React 19                       │
│  • Tailwind CSS 4.x                           │
│  • Framer Motion animations                   │
│  • React Router v7                            │
└──────────────────┬────────────────────────────┘
                   │ Fetch API
                   ▼
┌─────────────────────────────────────────────────┐
│           Express.js Backend                    │
│  • 50+ REST endpoints                          │
│  • In-memory data store (demo)                 │
│  • PostgreSQL ready (production)               │
│  • CORS, JSON, error handling                  │
└──────────────────┬────────────────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  Optional APIs   │
        │  • Google OAuth  │
        │  • Gemini AI     │
        │  (Both have local fallbacks)              │
        └──────────────────┘
```

**Key Design Principles**:
- ✅ **Zero Hard Dependencies** - Works without external APIs
- ✅ **Demo Mode Out-of-Box** - Seeded data, instant start
- ✅ **AI-Enhanced** - Optional Gemini integration with local fallbacks
- ✅ **Role-Based Security** - Admin/Manager/MR/Viewer permissions
- ✅ **Mobile-First** - Field workflows optimized for tablets/phones
- ✅ **Type-Safe** - Full TypeScript coverage

---

## 📦 Tech Stack

**Frontend**:
- React 19 (Hooks, Context API, Router 7)
- TypeScript 5.8
- Tailwind CSS 4.x (utility-first styling)
- Framer Motion 12 (animations)
- Recharts 3.8 (charts)
- Lucide React (icons)
- Vite 6.x (build tool + dev server)

**Backend**:
- Node.js 18+
- Express.js 4.x
- TypeScript runtime (tsx)
- In-memory store (demo) / PostgreSQL (prod)

**AI/ML**:
- Google Gemini Flash (optional, via `@google/genai`)
- Local fallback algorithms (rules-based)

**Infrastructure**:
- Render.com (hosting)
- Vite dev middleware
- PM2 (process manager for prod)

---

## 🎯 Use Cases

### For Medical Representatives
- **Daily Planning**: See assigned visits, optimize route
- **Field Recording**: GPS check-in, photo proof, voice notes
- **Order Entry**: Log sales immediately after visit
- **Expenses**: Track travel, meals, submit for approval
- **Performance**: View personal stats, targets, achievements

### For Managers
- **Team Oversight**: Monitor all MR activities in real-time
- **Approvals**: Expense, reschedule, credit approvals
- **Analytics**: Revenue forecasts, territory performance
- **Scheduling**: Create visit plans, assign leads
- **Compliance**: Verify visits via GPS + photo

### For Administrators
- **User Management**: Create/edit/delete accounts
- **Configuration**: Set territories, targets, products
- **Reports**: Comprehensive analytics, export data
- **Credit Management**: Entity credit limits, blocks
- **System Settings**: Configure AI, notifications, integrations

---

## 🌟 Unique Features

### 1. **Voice-Powered AI Analysis**
Record conversations → auto-transcribe → AI extracts:
- Lead probability & status (hot/warm/cold)
- Products discussed
- Order prediction
- Sentiment & engagement score
- Follow-up recommendations

**Works offline** with fallback: "Based on keywords detected..."

### 2. **GPS-Verified Visits**
Prevent timesheet fraud:
- Check-in within 150m of clinic
- Check-out captures distance from check-in
- Route mapping & idle detection
- Missed visit automatic alerts

### 3. **Intelligent Daily Call Plan**
AI recommends optimal visit order based on:
- Entity tier (A/B/C priority)
- Days since last visit
- Historical order value
- Territory proximity
- MR's personal patterns

### 4. **Zero-Configuration AI**
Set `GEMINI_API_KEY` for real AI, or leave blank for local heuristics:
```
if (!apiKey) {
  return {
    leadProbability: hasTranscript ? 60 : hasOrders ? 45 : 20,
    reasoning: calculateReasoning(),
  };
}
```

---

## 🚢 Deployment

### Already Deployed!

Your app is **live at**:
https://metapharsic-life-science.onrender.com

### Managing Deployment

See **RENDER.md** for:
- Environment variable configuration
- Custom domain setup
- Database setup (PostgreSQL)
- Monitoring & logs
- Scaling & upgrades
- Troubleshooting

### Deploy Elsewhere

See **DEPLOYMENT.md** for guides on:
- Docker deployment
- Google Cloud Run
- AWS Elastic Beanstalk
- Azure App Service
- Traditional VPS

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Components** | 25+ React components |
| **API Endpoints** | 50+ REST endpoints |
| **TypeScript Interfaces** | 30+ type definitions |
| **Lines of Code** | 3000+ |
| **Documentation** | 100KB+ (7 guides) |
| **Demo Users** | 4 pre-configured |
| **Roles** | 4 (Admin, Manager, MR, Viewer) |
| **AI Features** | 6 analysis engines |
| **Mobile-Ready** | 100% responsive |
| **Time to Value** | 5 minutes |

---

## 🔄 Development Status

**Current Version**: `1.0.0` (Unreleased)

**Active Development**:
- ✅ MR Dashboard with attendance & visit tracking
- ✅ Field Tracker with GPS, photo, voice
- ✅ AI analysis module with local fallback
- ✅ Approval workflow system
- ✅ Healthcare directory with AI insights
- ✅ Sales & expense tracking
- ✅ Render deployment configured

**Planned**:
- ⏳ PostgreSQL migration scripts
- ⏳ Mobile app (React Native wrapper)
- ⏳ Offline mode (Service Worker)
- ⏳ PDF report generation
- ⏳ Bulk data import (CSV/Excel)
- ⏳ Real-time notifications (WebSocket)

---

## 🤝 Contributing

We welcome contributions! Please read:

1. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guidelines & workflow
2. **[QUICKSTART.md](QUICKSTART.md)** - Setup instructions
3. **[API.md](API.md)** - API reference
4. **[AGENTS.md](AGENTS.md)** - Architecture

**Quick Start**:
```bash
git clone https://github.com/yourorg/metapharsic-crm.git
cd metapharsic-crm
npm install
npm run dev
```

---

## 📄 License

[INSERT LICENSE INFO HERE]

---

## 📞 Support

- **Documentation**: See docs folder above
- **Issues**: [GitHub Issues](https://github.com/yourorg/metapharsic-crm/issues)
- **Email**: metapharsic-team@metapharsic.com
- **Render Status**: [status.render.com](https://status.render.com)

---

## 🙏 Acknowledgments

**Built with**:
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Express.js](https://expressjs.com/) - Backend
- [Vite](https://vitejs.dev/) - Build tool
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Render](https://render.com/) - Hosting platform

**AI Integration**:
- [Google Gemini](https://ai.google.dev/) - Optional LLM

---

<p align="center">
  <b>Metapharsic Life Sciences CRM</b><br>
  Made with ❤️ for Medical Representatives Worldwide
</p>

---

**Last Updated**: 2025-04-08  
**Version**: 1.0.0 (Unreleased)  
**Live URL**: https://metapharsic-life-science.onrender.com

</div>
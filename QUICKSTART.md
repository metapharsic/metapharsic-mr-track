# Quickstart Guide - Developer Onboarding

Get the Metapharsic Life Sciences CRM up and running on your local machine in 5 minutes!

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Setup (5 minutes)](#quick-setup)
3. [Running the Application](#running-the-application)
4. [Understanding the Codebase](#understanding-the-codebase)
5. [Testing](#testing)
6. [Common Development Tasks](#common-development-tasks)
7. [Troubleshooting](#troubleshooting)
8. [Contributing Guidelines](#contributing-guidelines)

---

## Prerequisites

### Required Software

- **Node.js** 18+ LTS (download from [nodejs.org](https://nodejs.org/))
- **Git** (for version control)
- **Modern browser** (Chrome, Firefox, Edge, Safari)

### Optional Tools

- **VS Code** (recommended IDE)
- **PostgreSQL** or **MongoDB** (if you want to use real database instead of in-memory)
- **Docker & Docker Compose** (for containerized setup)

### Verify Installation

```bash
# Check Node.js version
node --version  # Should be v18.x or higher

# Check npm version
npm --version  # Should be 9.x or higher

# Check Git
git --version
```

---

## Quick Setup

### Step 1: Clone Repository

```bash
# If from local folder, skip this
cd /path/to/metapharsic-life-science-mr

# Optional: add as git remote if not already
git remote add origin https://github.com/yourorg/metapharsic-crm.git
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`. Should take 2-5 minutes.

✅ **Check**: You should see `node_modules` folder created.

### Step 3: Configure Environment

The app runs in **demo mode by default** - no configuration needed!

But if you want to customize:

```bash
# Copy example env file
cp .env.example .env.local

# Edit with your values (optional - defaults work for demo)
nano .env.local  # or any text editor
```

**Minimum required for demo** (already set in `.env`):
```env
GEMINI_API_KEY=""
GOOGLE_CLIENT_ID=""
VITE_GOOGLE_CLIENT_ID=""
APP_URL=http://localhost:3000
```

### Step 4: Start Development Server

```bash
npm run dev
```

You should see:

```
> react-example@0.0.0 dev
> node ./node_modules/tsx/dist/cli.mjs server.ts

Startup: visit_schedules deduped (0 renumbered), 23 entries, nextId=24
Server running on http://localhost:3000
```

✅ **Success**: Server is running!

---

## Running the Application

### Open in Browser

Navigate to: **http://localhost:3000**

You'll see the login page.

### Login Credentials

**Demo Mode** - Choose one:

**Option 1: Admin Account**
- Email: `admin@metapharsic.com`
- Password: `admin123`
- Access: Full admin privileges

**Option 2: MR Account** (any password works)
- Email: `rajesh.kumar@metapharsic.com`
- Password: `anything` (e.g., `test123`)
- Access: MR dashboard and field features

**Option 3: Other MR Accounts**
- `suresh.raina@metapharsic.com`
- `priya.sharma@metapharsic.com`
- Any password works in demo mode

### First Steps After Login

1. **Explore the Dashboard** - Overview of metrics and quick stats
2. **Try MR Dashboard** - Navigate to `/mr-dashboard` to see visit schedules
3. **Start a Visit** - Click "Start Visit" on any scheduled visit
4. **Test Field Tracker** - Go through GPS → Photo → Record flow
5. **Check Directory** - Browse doctors/pharmacies/hospitals
6. **View Sales** - See order history and AI forecasts

---

## Understanding the Codebase

### Project Structure

```
📦 metapharsic-crm
├── 📁 src/
│   ├── 📁 components/       # UI components (React)
│   │   ├── MRDashboard.tsx
│   │   ├── MRFieldTracker.tsx
│   │   ├── HealthcareDirectory.tsx
│   │   ├── SalesTracking.tsx
│   │   ├── ExpenseManager.tsx
│   │   ├── LeadsManagement.tsx
│   │   ├── Login.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── 📁 contexts/         # React contexts (auth, notifications)
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── 📁 services/         # API clients and utilities
│   │   ├── api.ts
│   │   ├── geminiService.ts
│   │   ├── locationService.ts
│   │   └── ...
│   ├── 📁 lib/              # Utilities and helpers
│   ├── 📁 utils/            # Pure utility functions
│   ├── 📄 types.ts          # TypeScript type definitions
│   ├── 📄 App.tsx           # Main app with routing
│   └── 📄 main.tsx          # Entry point
├── 📄 server.ts             # Backend server (Express + Vite)
├── 📄 package.json          # Dependencies
├── 📄 AGENTS.md             # Architecture documentation
├── 📄 API.md                # API reference
├── 📄 ARCHITECTURE.md       # System design (optional)
├── 📄 DEPLOYMENT.md         # Production deployment
└── 📄 QUICKSTART.md         # This file
```

### Key Concepts

#### 1. State Management
- **Local State**: `useState` in components
- **Global State**: `AuthContext`, `NotificationContext`
- **Server State**: Fetched via `api` service

#### 2. Routing
- React Router v7
- Protected routes: `ProtectedRoute` component
- Role-based access: `canAccessRoute` in `AuthContext`

#### 3. API Layer
All API calls go through `src/services/api.ts`:

```typescript
import { api } from '../services/api';

// Example: get all MRs
const mrs = await api.mrs.getAll();
```

### TypeScript

Full type safety throughout. All types defined in `src/types.ts`:

```typescript
export interface MR {
  id: number;
  name: string;
  territory: string;
  // ...
}

export interface Visit {
  id: number;
  mr_id: number;
  doctor_name: string;
  // ...
}
```

---

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] Login with admin credentials works
- [ ] Login with MR credentials works
- [ ] Invalid credentials show error
- [ ] Logout clears session
- [ ] Session persists on page refresh

#### MR Dashboard
- [ ] Schedules display for today
- [ ] Attendance check-in works (GPS optional)
- [ ] "Start Visit" updates schedule status
- [ ] Visit details expand/collapse
- [ ] Performance metrics show correctly

#### Field Tracker
- [ ] GPS capture (or fallback)
- [ ] Photo capture/upload works
- [ ] Voice recording works
- [ ] Outcome form submits
- [ ] Checkout completes visit record

#### Directory
- [ ] Doctors list loads
- [ ] Search/filter works
- [ ] Entity details viewable
- [ ] AI analysis loads (if configured)

---

### Running TypeScript Check

```bash
npm run lint
```

This runs `tsc --noEmit` to type-check without emitting files.

---

### API Testing with cURL

```bash
# Get all MRs
curl http://localhost:3000/api/mrs | jq

# Get products
curl http://localhost:3000/api/products | jq

# Get schedules
curl "http://localhost:3000/api/visit-schedules?mr_id=1" | jq
```

---

## Common Development Tasks

### 1. Add a New API Endpoint

**Step 1**: Add to `server.ts`:

```typescript
app.get('/api/my-endpoint', async (req, res) => {
  res.json({ message: 'Hello' });
});
```

**Step 2**: Add to `src/services/api.ts`:

```typescript
myResource: {
  get: () => fetch(`${API_BASE}/my-endpoint`).then(res => res.json() as Promise<any>),
}
```

**Step 3**: Use in component:

```typescript
import { api } from '../services/api';
const data = await api.myResource.get();
```

### 2. Create a New Component

```bash
# Create component file
touch src/components/MyComponent.tsx
```

Template:

```tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function MyComponent() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1>My Component</h1>
      <p>Hello, {user?.name}</p>
    </div>
  );
}
```

### 3. Add a New Route

Edit `src/App.tsx`:

```tsx
const MyComponent = lazy(() => import('./components/MyComponent'));

// Inside Routes
<Route path="/my-route" element={
  <ProtectedRoute requiredPermission="my.permission">
    <MyComponent />
  </ProtectedRoute>
} />
```

### 4. Add a New Permission

Edit `src/contexts/AuthContext.tsx`:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    ...existing,
    'my.permission'  // Add here
  ],
  mr: [
    ...existing,
    // Add MR-specific permissions
  ]
};

const ROUTE_PERMISSIONS: Record<string, string> = {
  ...existing,
  '/my-route': 'my.permission'
};
```

### 5. Modify the Data Model

Edit `src/types.ts`:

```typescript
export interface NewType {
  field1: string;
  field2: number;
}
```

Then update API endpoints and components to use it.

### 6. Update Dummy Data (server.ts)

Edit the `data` object in `server.ts` to add sample records:

```typescript
const data = {
  mrs: [
    ...existing,
    {
      id: 7,
      name: "New MR",
      territory: "New Territory",
      // ...
    }
  ]
};
```

---

## Troubleshooting

### Server Won't Start

**Issue**: `Error: listen EADDRINUSE: address already in use :::3000`

**Fix**: Port 3000 is already in use. Either:

```bash
# Option 1: Kill existing process
npx kill-port 3000

# Option 2: Use different port
PORT=3001 npm run dev
```

### Dependencies Failed to Install

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### API Returns 404 for My Endpoint

- ✅ Check endpoint is defined in `server.ts`
- ✅ Check the route path matches exactly
- ✅ Server was restarted after adding endpoint (`Ctrl+C` then `npm run dev`)

### TypeScript Errors

```bash
# Check all types are correct
npm run lint

# If specific error:
# "Type 'X' is not assignable to type 'Y'"
# Ensure your object matches the interface in types.ts
```

### GPS/Location Not Working

- Use HTTPS in production (required for geolocation)
- Check browser permissions
- LocationService falls back to cached location if denied

### Photos Too Large

Already handled! Images are automatically compressed to 200px JPEG max. Max file size: ~100KB.

### Voice Recording Silent

- Check browser permissions for microphone
- Ensure user interaction before recording (browser policy)
- Check browser console for errors

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes

Edit files, add components, etc.

### 3. Test Locally

```bash
npm run dev  # Ensure server running
# Test in browser
npm run lint  # Type check
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

Conventional commits recommended:
- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation
- `style:` - formatting (no code change)
- `refactor:` - code restructuring
- `test:` - add tests
- `chore:` - build/CI changes

### 5. Push & Create PR

```bash
git push origin feature/my-new-feature
# Then create PR on GitHub/GitLab/Bitbucket
```

---

## Hot Reload

The development server supports hot reload for both frontend and backend:

- **Frontend**: Changes to `.tsx`, `.ts` files in `src/` automatically refresh browser
- **Backend**: Changes to `server.ts` require manual restart (`Ctrl+C` → `npm run dev`)

---

## Useful VS Code Extensions

- **ES7+ React/Redux/React-Native snippets** - React code snippets
- **TypeScript React** - TSX syntax highlighting
- **Tailwind CSS IntelliSense** - Autocomplete for utility classes
- **Auto Rename Tag** - Auto-rename paired tags
- **Bracket Pair Colorizer** - Color matching brackets
- **Error Lens** - Show errors inline
- **GitLens** - Git integration

---

## Learning Resources

### Key Files to Read

1. **src/types.ts** - Understand data models
2. **src/services/api.ts** - See all available API calls
3. **src/contexts/AuthContext.tsx** - Learn auth/role system
4. **src/components/MRDashboard.tsx** - Example of complex component
5. **AGENTS.md** - Full architecture overview

### Concepts to Understand

1. **React Hooks**: `useState`, `useEffect`, `useCallback`, `useContext`
2. **TypeScript**: Interfaces, type inference, generics
3. **React Router**: Navigation, protected routes, lazy loading
4. **Tailwind CSS**: Utility-first CSS classes
5. **Framer Motion**: Animation library (see `motion.div` usage)
6. **Context API**: Global state management pattern

---

## Frequently Asked Questions

**Q: Do I need Google OAuth to run this?**  
A: No! Demo mode uses local authentication. See login credentials above.

**Q: Do I need a Gemini API key?**  
A: No! AI features have local fallbacks. The app works fully without it.

**Q: Can I use PostgreSQL instead of in-memory data?**  
A: Yes! Set `DATABASE_URL` in `.env` and update `server.ts`. See `DEPLOYMENT.md`.

**Q: How do I reset the demo data?**  
A: Stop server, clear the in-memory data in `server.ts` (or just restart - it's fresh each time).

**Q: Where are uploaded files stored?**  
A: Currently in-memory only (for demo). For production, configure cloud storage.

**Q: How do I add a new MR?**  
A: Add to `data.mrs` in `server.ts`, or create admin UI for CRUD (not implemented yet).

---

## Contributing

### Before Starting Work

1. Check existing issues in GitHub
2. Comment on issue you want to work on
3. Create a branch for your feature/bugfix

### Code Style

- Use TypeScript (no JavaScript)
- 2-space indentation
- Semicolons required
- Single quotes for strings
- Components in PascalCase (`MyComponent`)
- Files in kebab-case (`my-component.tsx`)
- Services in camelCase (`api.ts`)

### Pull Request Checklist

- [ ] Type checking passes (`npm run lint`)
- [ ] No console.log statements (remove before committing)
- [ ] Feature works in demo mode (test with local auth)
- [ ] Updated documentation if needed
- [ ] Commit messages follow conventional format
- [ ] No merge conflicts

---

## Getting Help

- **Documentation**: See `AGENTS.md`, `API.md`, `DEPLOYMENT.md`
- **Type Definitions**: Check `src/types.ts`
- **Architecture**: Read `ARCHITECTURE.md` (if created)
- **Issues**: Create GitHub issue with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser/OS info
  - Screenshots if applicable
  - Server logs if relevant

---

## Next Steps

- ✅ Set up the project
- ✅ Run the server
- ✅ Explore the codebase
- ✅ Make a small change (e.g., modify a component)
- ✅ Read the `AGENTS.md` architecture doc
- ✅ Check out `API.md` for all endpoints
- ✅ Review `DEPLOYMENT.md` if planning production deployment

---

**You're ready to start developing!** 🚀

---

**End of QUICKSTART.md**

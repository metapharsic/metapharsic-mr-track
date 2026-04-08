# Contributing to Metapharsic CRM

Thank you for considering contributing! This guide will help you get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Style Guidelines](#style-guidelines)
5. [Commit Messages](#commit-messages)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Reporting Bugs](#reporting-bugs)
9. [Feature Requests](#feature-requests)
10. [Documentation](#documentation)

---

## Code of Conduct

We are committed to fostering a welcoming and inclusive community. Please:

- ✅ Be respectful and professional
- ✅ Use inclusive language
- ✅ Accept constructive criticism
- ✅ Focus on what's best for the community
- ✅ Show empathy towards others

Harassment or toxicity will not be tolerated.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ LTS
- **Git**
- Code editor (VS Code recommended)
- Understanding of **React** + **TypeScript**

### Fork & Clone

```bash
# 1. Fork the repository on GitHub
# Click "Fork" button on https://github.com/yourorg/metapharsic-crm

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/metapharsic-crm.git
cd metapharsic-crm

# 3. Add upstream remote
git remote add upstream https://github.com/yourorg/metapharsic-crm.git

# 4. Install dependencies
npm install

# 5. Start development server
npm run dev
```

### Verify Setup

- ✅ Server starts without errors
- ✅ App loads at http://localhost:3000
- ✅ Can login with demo credentials
- ✅ No build warnings (`npm run lint` passes)

---

## Development Workflow

### 1. Create a Branch

Choose a descriptive branch name:

```bash
# Feature branch
git checkout -b feature/add-offline-mode

# Bug fix
git checkout -b fix/mr-dashboard-crash

# Hotfix (for production issue)
git checkout -b hotfix/checkin-gps-fail
```

**Branch Naming Conventions**:
- `feature/short-description`
- `fix/short-description`
- `hotfix/short-description`
- `docs/update-section`
- `refactor/component-name`

---

### 2. Make Changes

#### Code Structure

```
src/
├── components/     # React components
│   ├── MyComponent.tsx
│   └── __tests__/  # Component tests (optional)
├── services/       # API clients, utilities
├── contexts/       # React contexts
├── types.ts        # TypeScript interfaces
├── utils/          # Pure functions
└── lib/            # Third-party integrations

server.ts           # Backend Express server
```

#### Adding a New Component

```bash
touch src/components/MyComponent.tsx
```

Template:

```tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch data if needed
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p>Hello, {user?.name}</p>

      {/* Your component JSX */}
    </div>
  );
}
```

#### Adding a New API Endpoint

**Step 1**: Add route in `server.ts`:

```typescript
app.get('/api/my-endpoint', async (req, res) => {
  try {
    const data = await fetchDataFromMemoryOrDB();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});
```

**Step 2**: Add to `src/services/api.ts`:

```typescript
myResource: {
  getAll: () => fetch(`${API_BASE}/my-endpoint`).then(res => res.json() as Promise<MyType[]>),
}
```

**Step 3**: Define type in `src/types.ts`:

```typescript
export interface MyType {
  id: number;
  name: string;
  // ...
}
```

**Step 4**: Use in component:

```typescript
import { api } from '../services/api';
const items = await api.myResource.getAll();
```

---

### 3. Type Check

```bash
npm run lint
```

Fix any TypeScript errors before committing.

---

### 4. Test Manually

```bash
# Dev server should already be running
# Test your changes in browser:

1. Refresh http://localhost:3000
2. Navigate to affected pages
3. Test with both Admin and MR accounts
4. Check browser console for errors
5. Test responsive design (mobile view)
```

---

### 5. Commit Changes

```bash
git add .
git status  # Review what you're committing
git commit -m "feat: add new feature description"
```

**Good commit message examples**:
- `feat: add AI visit frequency analysis to doctor profile`
- `fix: prevent GPS checkin crash when location denied`
- `docs: update API.md with new endpoints`
- `refactor: simplify MRDashboard state management`

**Bad examples**:
- `fixed bug` (too vague)
- `updated files` (unhelpful)
- `final final` (unprofessional)

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**:
- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation changes
- `style:` - formatting (no code change)
- `refactor:` - code restructuring
- `test:` - add tests
- `chore:` - build/CI changes

---

### 6. Keep Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch onto main
git rebase upstream/main

# If conflicts, resolve them:
# - Edit conflicted files
# - git add <resolved-files>
# - git rebase --continue

# Push to your fork
git push origin feature/my-branch --force-with-lease
```

---

### 7. Open Pull Request

1. Go to GitHub: `https://github.com/YOUR_USERNAME/metapharsic-crm`
2. Click **"Compare & pull request"**
3. Fill PR template:

**Title**: `feat: add feature X` or `fix: issue Y`

**Description**:
```
## What
Brief description of changes.

## Why
Reason for change (bug fix, new feature, improvement).

## How
Technical approach (optional if self-explanatory).

## Testing
Steps to test:
1. Login as admin
2. Navigate to /directory
3. Search for "Dr. Smith"
4. Verify AI analysis appears

## Screenshots
(if UI changes) - Attach screenshots

## Checklist
- [ ] npm run lint passes
- [ ] Tested on localhost:3000
- [ ] Works in demo mode
- [ ] No console errors
- [ ] Updated docs if needed
```

4. Click **"Create pull request"**
5. Wait for review

---

## Style Guidelines

### TypeScript

- **Strict mode**: `strict: true` in `tsconfig.json`
- **No `any`** unless absolutely necessary (use `unknown` instead)
- **Interfaces** over types for objects:
  ```typescript
  interface User {
    id: number;
    name: string;
  }
  ```
- **Explicit return types** for public functions:
  ```typescript
  export function getUser(id: number): Promise<User> {
    // ...
  }
  ```

### React

- **Functional components only** (no class components)
- **Hooks**:
  - `useState` for component state
  - `useEffect` for side effects
  - `useCallback` for event handlers (when passed as props)
  - `useMemo` for expensive calculations
  - `useRef` for DOM refs
- **Component structure**:
  ```tsx
  export default function MyComponent() {
    // 1. Hooks
    const [state, setState] = useState();

    // 2. Callbacks (useCallback)
    const handleClick = useCallback(() => {}, []);

    // 3. Effects (useEffect)
    useEffect(() => {}, []);

    // 4. Render
    return <div>...</div>;
  }
  ```

### Tailwind CSS

- **Use utility classes** (no custom CSS unless absolutely needed)
- **Mobile-first**: responsive classes (`md:`, `lg:`)
- **Consistent spacing**: Use Tailwind scale (1 unit = 0.25rem)
- **Colors**: Use Tailwind palette (`blue-600`, `emerald-500`, `gray-900`)

**Example**:
```tsx
<div className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
  <h2 className="text-xl font-bold text-gray-900 mb-2">Title</h2>
  <p className="text-gray-600">Content</p>
  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    Action
  </button>
</div>
```

### File Naming

- **Components**: `PascalCase.tsx` → `MyComponent.tsx`
- **Services/Utils**: `camelCase.ts` → `api.ts`, `locationService.ts`
- **Contexts**: `PascalCaseContext.tsx` → `AuthContext.tsx`
- **Hooks**: `camelCase.ts` → `useAuth.ts`

### Imports

**Order**:
```typescript
// 1. React & React libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

// 3. Internal - services
import { api } from '../services/api';
import { geminiService } from '../services/geminiService';

// 4. Internal - contexts
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// 5. Internal - components
import MyComponent from './MyComponent';

// 6. Types
import { User, MR } from '../types';

// 7. Utils
import { cn } from '../lib/utils';
```

---

## Commit Messages

### Format

```
type(scope): subject

body

footer
```

**Type** (required): `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`  
**Scope** (optional): component or module (`mrdashboard`, `api`, `auth`)  
**Subject** (required): short description (50 chars max, no period)  
**Body** (optional): longer explanation  
**Footer** (optional): `BREAKING CHANGE:`, `Closes #123`

### Examples

```
feat(api): add endpoint for missed visit alerts

Add GET /api/missed-visits to retrieve all missed visits with
alert details. Useful for manager oversight.

Closes #45
```

```
fix(mrdashboard): prevent crash when schedules empty

Add null check for schedules array before mapping.
Previously unmapped arrays caused runtime error.

Fixes #52
```

```
docs(agents): update API service section with new endpoints

Add missing endpoints for visit-records, daily-summaries,
and daily-call-plan to match server.ts implementation.
```

---

## Pull Request Process

### Before Opening PR

- [ ] **branch is up-to-date** with `upstream/main`
- [ ] **passes TypeScript check**: `npm run lint` (no errors)
- [ ] **tested manually** (local dev server)
- [ ] **no console.log** statements (remove debug logs)
- [ ] **no hardcoded values** (use env vars or constants)
- [ ] **updated documentation** if needed
- [ ] **screenshots** if UI changes

### After Opening PR

1. **CI checks**: Render/GitHub Actions will run automatically
2. **Review**: Maintainer will review within 2-3 business days
3. **Address feedback**: Make requested changes, push to same branch
4. **Squash & merge**: Maintainer merges (keep commit history clean)

### PR Reviews

**What reviewers look for**:
- ✅ Code correctness & TypeScript types
- ✅ Appropriate use of existing patterns
- ✅ No security vulnerabilities
- ✅ Performance implications
- ✅ Test coverage (manual or automated)
- ✅ Documentation updated
- ✅ Backward compatibility (or clear migration path)

**Responding to feedback**:
- 👍 Acknowledge comment with "Good point" or "Fixed"
- ✏️ Make changes and push (no need to comment)
- ❓ Ask for clarification if unsure
- 💬 Engage in discussion (technical decisions)

---

## Testing

### Manual Testing Checklist

Before approving PR, test:

**General**:
- [ ] Page loads without errors (check browser console)
- [ ] No TypeScript warnings
- [ ] Responsive on mobile (Chrome DevTools)
- [ ] Works in Chrome, Firefox, Safari

**Authentication**:
- [ ] Login works (admin & MR)
- [ ] Logout works
- [ ] Session persists on refresh
- [ ] Protected routes redirect unauthenticated users

**Feature-Specific**:
- [ ] All CRUD operations work
- [ ] API calls succeed (check Network tab)
- [ ] Error states display properly
- [ ] Loading states show during async ops
- [ ] Notifications appear/disappear

**Data Integrity**:
- [ ] Created records appear in list
- [ ] Updates persist
- [ ] Delete works (soft/hard as designed)

---

## Reporting Bugs

### Bug Report Template

Use GitHub Issues with this template:

```markdown
## Bug Description
Clear description of what's happening.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll to '....'
4. See error

## Expected Behavior
What should happen instead.

## Screenshots/Video
If applicable, attach.

## Environment
- Browser: [Chrome 120, Safari 17, etc.]
- OS: [Windows 11, macOS 14, Ubuntu 22.04]
- Screen size: [Desktop 1920x1080, Mobile 375x667]
- App URL: [localhost:3000 or live URL]

## Additional Context
Logs, error messages, console output, etc.

**Severity**: Critical / High / Medium / Low
```

### Good Bug Report

✅ Specific steps  
✅ Expected vs actual  
✅ Screenshots  
✅ Environment details  
✅ Not a duplicate

❌ "It's broken" (vague)  
❌ "Something's wrong" (unhelpful)  
❌ Already reported (check existing issues)

---

## Feature Requests

### Feature Request Template

```markdown
## Problem
What problem does this solve? Who is affected?

## Proposed Solution
Describe the feature/change.

## Alternatives Considered
Other approaches you've thought of.

## Implementation Ideas
Optional: Technical approach you envision.

## Priority
Critical / High / Medium / Low / Nice-to-have

**Related**: Link to any existing issues or discussions
```

### Feature Evaluation Criteria

We consider:
- ✅ **User impact** - How many users benefit?
- ✅ **Alignment** - Fits core product vision?
- ✅ **Complexity** - Effort vs benefit
- ✅ **Maintenance cost** - Ongoing support burden
- ✅ **Security** - Any risks?
- ✅ **Performance** - Impact on speed?

---

## Documentation

### Update Docs with Code Changes

When adding/changing features:

- [ ] Update **API.md** if endpoints change
- [ ] Update **AGENTS.md** if adding new component/agent
- [ ] Update **FEATURES.md** for user-facing changes
- [ ] Update **CHANGELOG.md** with new version entry
- [ ] Add JSDoc comments to new functions

### Documentation Style

- **Clear & concise**
- **Code examples** where helpful
- **Screenshots** for UI changes
- **Link** to related sections

---

## Development Tips

### Debugging

**Frontend**:
- Use React DevTools browser extension
- Check browser console for errors
- Network tab for failed API calls

**Backend**:
- Add `console.log` statements in `server.ts`
- Check Render logs (View logs in dashboard)
- Test API with cURL/Postman

**Database**:
If using PostgreSQL:
```bash
psql $DATABASE_URL -c "SELECT * FROM mrs;"
```

---

### Environment Differences

**Local vs Production**:

| Aspect | Local | Render (Production) |
|--------|-------|---------------------|
| Data | In-memory (reset on restart) | PostgreSQL (persistent) |
| Auth | Demo mode (any password) | Same (unless configured OAuth) |
| AI | Local fallback | Local fallback (unless API key set) |
| Logging | Console | Render logs dashboard |
| Domain | localhost:3000 | your-app.onrender.com |
| Sleep | Never | Free tier sleeps after 15min |

---

### Performance Tips

- **Lazy load** components with `React.lazy()` (already in `App.tsx`)
- **Use `useMemo`/`useCallback`** for expensive computations
- **Avoid inline functions** in render (creates new function each render)
- **Optimize re-renders**: `React.memo()` for pure components
- **Don't over-fetch**: Only request needed data
- **Compress images**: Already done (200px max)

---

## Getting Help

**Stuck?** Reach out:

1. **Check existing docs**: `QUICKSTART.md`, `API.md`, `ARCHITECTURE.md`
2. **Search issues**: https://github.com/yourorg/metapharsic-crm/issues
3. **Ask in PR**: Comment on your PR or open draft PR for discussion
4. **Create issue**: For bugs or unclear requirements
5. **Email team**: metapharsic-team@metapharsic.com

---

## Recognition

Contributors will be:
- Listed in `CHANGELOG.md`
- Credited in release notes
- Eligible for team rewards (if applicable)

---

## License

By contributing, you agree that your contributions will be licensed under the same LICENSE as the project.

---

**Happy coding! 🚀**

---

**End of CONTRIBUTING.md**

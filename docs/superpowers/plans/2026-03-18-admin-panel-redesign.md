# Admin Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all per-page headers and navigation with a persistent dark sidebar + light content area shell across every admin page (except article editor and login).

**Architecture:** Three new shared components (`AdminLayout`, `AdminSidebar`, `AdminPageHeader`) are created first. `App.jsx` is restructured into a single nested layout route. Each page then strips its own standalone header and adds `<AdminPageHeader>`. `AdminArticlesList` is deleted and `AdminDashboard` becomes the single articles management page at `/admin`. A new `AdminArticleWriter` placeholder is added at `/admin/write`.

**Tech Stack:** React 19, React Router v7, Tailwind CSS v4, lucide-react

---

## File Map

| File | Action |
|---|---|
| `src/components/AdminLayout.jsx` | **Create** — shell: sidebar + scrollable content area |
| `src/components/AdminSidebar.jsx` | **Create** — dark nav with NavLink active state, user info, logout |
| `src/components/AdminPageHeader.jsx` | **Create** — title + optional action slot |
| `src/pages/AdminArticleWriter.jsx` | **Create** — placeholder shell |
| `src/App.jsx` | Modify — nested layout route, remove AdminArticlesList, add AdminArticleWriter |
| `src/pages/AdminDashboard.jsx` | Modify — strip header + all nav buttons, rename title to "Articles" |
| `src/pages/AdminStagingQueue.jsx` | Modify — strip dark header |
| `src/pages/AdminIngestion.jsx` | Modify — strip dark header |
| `src/pages/AdminSettingsPage.jsx` | Modify — strip `<header>` element |
| `src/pages/AdminAboutEditor.jsx` | Modify — strip dark header, promote save indicator |
| `src/pages/AdminUsersPage.jsx` | Modify — strip dark header |
| `src/pages/AdminDestinationsList.jsx` | Modify — strip dark shell + header, lighten table |
| `src/pages/AdminDestinationEditor.jsx` | Modify — strip dark shell + header, lighten cards, promote save indicator |
| `src/pages/AdminArticlesList.jsx` | **Delete** |

---

## Task 1: Three shared components

**Files:**
- Create: `src/components/AdminLayout.jsx`
- Create: `src/components/AdminSidebar.jsx`
- Create: `src/components/AdminPageHeader.jsx`

### AdminLayout.jsx

- [ ] **Step 1: Create `src/components/AdminLayout.jsx`**

```jsx
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
```

### AdminSidebar.jsx

- [ ] **Step 2: Create `src/components/AdminSidebar.jsx`**

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { FileText, PenLine, Inbox, Upload, MapPin, Info, Settings, Users, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const GROUP_CLS = 'text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 px-3 mb-1 mt-4 first:mt-0'
const BASE_CLS = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-colors'
const ACTIVE_CLS = 'bg-white/10 text-white border-l-2 border-[#00E676]'

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${BASE_CLS} ${isActive ? ACTIVE_CLS : ''}`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AdminSidebar() {
  const navigate = useNavigate()
  const { user, signOut, isSuperAdmin } = useAuth()

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email || 'Admin'

  return (
    <div className="flex flex-col w-56 flex-shrink-0 bg-stone-950 h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <p className="text-sm font-bold text-white">Travel Times</p>
        <p className="text-[10px] text-stone-500 mt-0.5">Sri Lanka</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className={GROUP_CLS}>Content</p>
        <NavItem to="/admin" end icon={FileText} label="Articles" />
        <NavItem to="/admin/write" icon={PenLine} label="Write" />
        <NavItem to="/admin/staging" icon={Inbox} label="Staging" />
        <NavItem to="/admin/ingest" icon={Upload} label="Ingest" />

        <p className={GROUP_CLS}>Manage</p>
        <NavItem to="/admin/destinations" icon={MapPin} label="Destinations" />
        <NavItem to="/admin/about" icon={Info} label="About" />
        <NavItem to="/admin/settings" icon={Settings} label="Settings" />

        {isSuperAdmin && (
          <>
            <p className={GROUP_CLS}>Admin</p>
            <NavItem to="/admin/users" icon={Users} label="Users" />
          </>
        )}
      </nav>

      {/* User / logout */}
      <div className="border-t border-white/10 px-3 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-stone-700 flex-shrink-0 overflow-hidden">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold">{displayName[0]?.toUpperCase()}</div>
          }
        </div>
        <p className="text-xs text-stone-400 truncate flex-1">{displayName}</p>
        <button
          onClick={handleSignOut}
          className="text-stone-600 hover:text-red-400 transition-colors flex-shrink-0"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )
}
```

### AdminPageHeader.jsx

- [ ] **Step 3: Create `src/components/AdminPageHeader.jsx`**

```jsx
export default function AdminPageHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-stone-200 bg-white">
      <h1 className="text-xl font-bold text-stone-900">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Verify files exist**

```bash
ls src/components/AdminLayout.jsx src/components/AdminSidebar.jsx src/components/AdminPageHeader.jsx
```

Expected: all three listed.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdminLayout.jsx src/components/AdminSidebar.jsx src/components/AdminPageHeader.jsx
git commit -m "feat: add AdminLayout, AdminSidebar, AdminPageHeader components"
```

---

## Task 2: AdminArticleWriter + App.jsx route restructure

**Files:**
- Create: `src/pages/AdminArticleWriter.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/pages/AdminArticleWriter.jsx`**

```jsx
import AdminPageHeader from '../components/AdminPageHeader'

export default function AdminArticleWriter() {
  return (
    <div className="min-h-full">
      <AdminPageHeader title="Write Article" />
      <div className="px-8 py-12 text-stone-400 text-sm">
        Rich text editor coming soon.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/App.jsx`**

Replace the entire file with the following (note: only the imports and admin route block change — public routes are untouched):

```jsx
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import { AuthProvider } from './contexts/AuthContext'

const DestinationsPage = lazy(() => import('./pages/DestinationsPage'))
const PublicArticlesPage = lazy(() => import('./pages/PublicArticlesPage'))
const PublicArticleDetailPage = lazy(() => import('./pages/PublicArticleDetailPage'))
const DestinationDetailPage = lazy(() => import('./pages/DestinationDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminArticleWriter = lazy(() => import('./pages/AdminArticleWriter'))
const AdminArticleEditor = lazy(() => import('./pages/AdminArticleEditor'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminIngestion = lazy(() => import('./pages/AdminIngestion'))
const AdminStagingQueue = lazy(() => import('./pages/AdminStagingQueue'))
const AdminDestinationsList = lazy(() => import('./pages/AdminDestinationsList'))
const AdminDestinationEditor = lazy(() => import('./pages/AdminDestinationEditor'))
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'))
const AdminAboutEditor = lazy(() => import('./pages/AdminAboutEditor'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-sm font-medium text-stone-600">Loading...</p>
    </div>
  </div>
)

const AppContent = () => (
  <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#00E676] selection:text-white">
    <ScrollToTop />
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes with footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destination/:slug" element={<DestinationDetailPage />} />
          <Route path="/articles" element={<PublicArticlesPage />} />
          <Route path="/article/:slug" element={<PublicArticleDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Standalone admin routes (no sidebar) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/articles/:id" element={
          <ProtectedRoute><AdminArticleEditor /></ProtectedRoute>
        } />

        {/* Sidebar admin routes */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/write" element={<AdminArticleWriter />} />
          <Route path="/admin/staging" element={<AdminStagingQueue />} />
          <Route path="/admin/ingest" element={<AdminIngestion />} />
          <Route path="/admin/destinations" element={<AdminDestinationsList />} />
          <Route path="/admin/destinations/new" element={<AdminDestinationEditor />} />
          <Route path="/admin/destinations/:id" element={<AdminDestinationEditor />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/about" element={<AdminAboutEditor />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </Suspense>
  </div>
)

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
)

export default App
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminArticleWriter.jsx src/App.jsx
git commit -m "feat: add AdminArticleWriter placeholder; restructure App.jsx into nested layout route"
```

---

## Task 3: AdminDashboard — strip header + nav buttons

**File:** `src/pages/AdminDashboard.jsx`

The current return block (line 148+) starts with `<div className="min-h-screen bg-stone-50">`. Inside it:
- Lines 150–196: dark `bg-stone-950` header block with user avatar, "Admin Panel" title, back-to-site, and logout — **delete entirely**
- Lines 198+: content area with toolbar and table — **keep, with edits**

- [ ] **Step 1: Remove unused imports from the import line**

Current import line (line 3):
```js
import { Edit, Eye, Archive, Trash2, Search, LogOut, User, Upload, Loader2, RefreshCw, RotateCcw, Globe, EyeOff, MapPin, Settings, Info, Users } from 'lucide-react'
```

Replace with (removes `LogOut, User, Upload, MapPin, Settings, Info, Users`):
```js
import { Edit, Eye, Archive, Trash2, Search, Loader2, RefreshCw, RotateCcw, Globe, EyeOff, PenLine } from 'lucide-react'
```

- [ ] **Step 2: Remove `signOut`, `user`, and `isSuperAdmin` from useAuth and delete `handleSignOut`**

Current (line 14):
```js
const { user, signOut, isSuperAdmin } = useAuth()
```

Delete the entire line (all three are unused after this task — `user` was only in the header, `signOut`/`isSuperAdmin` in the removed buttons).

Then delete the entire `handleSignOut` function (lines 77–84):
```js
const handleSignOut = async () => {
  try {
    await signOut()
    navigate('/')
  } catch (err) {
    console.error('Error signing out:', err)
  }
}
```

- [ ] **Step 3: Remove the dark header block from the return statement**

Delete lines 150–196 (the `<div className="bg-stone-950 text-stone-50 shadow-lg">` block and its entire contents including the closing `</div>`).

- [ ] **Step 4: Change outer wrapper and add AdminPageHeader**

Current outer wrapper (line 149):
```jsx
<div className="min-h-screen bg-stone-50">
```

Replace with:
```jsx
<div>
```

Then add these imports at the top of the file (after the existing imports):
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Add `<AdminPageHeader>` as the first child inside `<div>`, before the content area div. The content area div currently starts with `<div className="max-w-7xl mx-auto px-6 py-8">` — insert the header before it:

```jsx
<div>
  <AdminPageHeader
    title="Articles"
    action={
      <button
        onClick={() => navigate('/admin/write')}
        className="flex items-center gap-2 px-4 py-2 bg-stone-950 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
      >
        <PenLine size={16} />
        Write Article
      </button>
    }
  />
  <div className="max-w-7xl mx-auto px-6 py-8">
    {/* ... rest of content unchanged ... */}
  </div>
</div>
```

- [ ] **Step 5: Remove nav buttons from the toolbar**

Inside the toolbar (`<div className="flex flex-col md:flex-row gap-4...">`, around line 206), the right side currently has many nav buttons. Remove ALL of these buttons (keep only the refresh button):

**Remove** these buttons entirely:
- Destinations button (`onClick={() => navigate('/admin/destinations')}`)
- About button (`onClick={() => navigate('/admin/about')}`)
- Settings button (`onClick={() => navigate('/admin/settings')}`)
- Users button (the `{isSuperAdmin && (...)}` block)
- Ingest button (`onClick={() => navigate('/admin/ingest')}`)
- Review Queue button (`onClick={() => navigate('/admin/staging')}`)

**Keep** only the refresh button:
```jsx
<div className="flex items-center gap-3">
  <button
    onClick={loadDashboardData}
    className="flex items-center gap-2 px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg font-medium transition-colors text-sm"
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
    Refresh
  </button>
</div>
```

- [ ] **Step 6: Verify no remaining references to removed items**

Check that `signOut`, `handleSignOut`, `LogOut`, `User`, `Upload`, `MapPin`, `Settings`, `Info` are gone from this file:

```bash
grep -n "signOut\|handleSignOut\|LogOut\|MapPin\|navigate.*destinations\|navigate.*about\|navigate.*settings\|navigate.*ingest\|navigate.*staging\|navigate.*users\|Review Queue\|isSuperAdmin" src/pages/AdminDashboard.jsx
```

Expected: only `isSuperAdmin` can appear (it's used in the toolbar) — wait, we removed isSuperAdmin too since its only use (the Users button) is removed. Confirm no output.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminDashboard.jsx
git commit -m "feat: strip AdminDashboard header and nav buttons for sidebar redesign"
```

---

## Task 4: AdminStagingQueue and AdminIngestion — strip headers

**Files:**
- Modify: `src/pages/AdminStagingQueue.jsx`
- Modify: `src/pages/AdminIngestion.jsx`

### AdminStagingQueue

The return block starts at line 265. The header is lines 267–284 (`<div className="bg-stone-950 ...">...</div>`).

- [ ] **Step 1: Update AdminStagingQueue imports**

Add to imports:
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Remove from lucide import: `ArrowLeft, LogOut`

Remove `signOut` from `useAuth()` destructure (line 55):
```js
// Before:
const { signOut } = useAuth()
// After: remove entirely (if signOut is the only thing from useAuth, remove the whole line)
```

Remove the `handleSignOut` function entirely (lines 93–95):
```js
const handleSignOut = async () => {
  try { await signOut(); navigate('/') } catch (err) { console.error(err) }
}
```

Remove `useNavigate` import and `const navigate = useNavigate()` line (AdminStagingQueue only uses navigate in handleSignOut — verify with a quick grep first).

- [ ] **Step 2: Modify return block**

Change outer wrapper:
```jsx
// Before:
<div className="min-h-screen bg-stone-50">
// After:
<div className="min-h-full">
```

Delete the header block entirely (the `<div className="bg-stone-950 text-stone-50 shadow-lg">` through its closing `</div>` — lines 267–284).

Insert `<AdminPageHeader title="Staging Queue" />` as the first child inside the outer div.

Change the content wrapper:
```jsx
// Before:
<div className="max-w-7xl mx-auto px-6 py-8">
// After:
<div className="px-6 py-8">
```

- [ ] **Step 3: Commit AdminStagingQueue**

```bash
git add src/pages/AdminStagingQueue.jsx
git commit -m "feat: strip AdminStagingQueue header for sidebar redesign"
```

### AdminIngestion

The return starts at line 398. Header is lines 400–423 (`<div className="bg-stone-950 ...">...</div>`).

- [ ] **Step 4: Update AdminIngestion imports**

Add to imports:
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Remove from lucide import: `ArrowLeft, LogOut`

Remove `signOut` from useAuth destructure. Remove `handleSignOut` function.

Verify `navigate` is not used elsewhere in the component (search for `navigate(` in the file). If only used in handleSignOut, remove `useNavigate` import and the `const navigate` line too.

- [ ] **Step 5: Modify AdminIngestion return block**

Change outer wrapper:
```jsx
// Before:
<div className="min-h-screen bg-stone-50">
// After:
<div className="min-h-full">
```

Delete the header block (lines 400–423, the `<div className="bg-stone-950...">` block).

Insert `<AdminPageHeader title="Ingest Content" />` as the first child.

Change content wrapper:
```jsx
// Before:
<div className="max-w-5xl mx-auto px-6 py-8">
// After:
<div className="max-w-5xl mx-auto px-6 py-8">
```
(content wrapper max-w and padding stays the same)

- [ ] **Step 6: Commit AdminIngestion**

```bash
git add src/pages/AdminIngestion.jsx
git commit -m "feat: strip AdminIngestion header for sidebar redesign"
```

---

## Task 5: AdminSettingsPage and AdminAboutEditor — strip headers

**Files:**
- Modify: `src/pages/AdminSettingsPage.jsx`
- Modify: `src/pages/AdminAboutEditor.jsx`

### AdminSettingsPage

The return starts at line 54. The header is `<header className="h-13 px-5...">` (lines 56–71).

- [ ] **Step 1: Update AdminSettingsPage imports**

Add:
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Remove from lucide imports: `ArrowLeft, LogOut`

Remove `useNavigate` import. Remove `const navigate = useNavigate()`. Remove `signOut` from `useAuth()` destructure. Remove `handleSignOut` function.

- [ ] **Step 2: Modify return block**

Change outer wrapper:
```jsx
// Before:
<div className="min-h-screen bg-[#F5F5F3]">
// After:
<div className="min-h-full">
```

Delete the `<header>` element entirely (lines 56–71, from `<header className="h-13...">` through `</header>`).

Insert `<AdminPageHeader title="Settings" />` as the first child inside the outer div.

- [ ] **Step 3: Commit AdminSettingsPage**

```bash
git add src/pages/AdminSettingsPage.jsx
git commit -m "feat: strip AdminSettingsPage header for sidebar redesign"
```

### AdminAboutEditor

The return starts at line 102. The header is lines 104–120 (`<div className="bg-stone-950 ...">...</div>`).

The `saveIndicator` const is computed just before the return statement (lines 97–100) — it must be preserved.

- [ ] **Step 4: Update AdminAboutEditor imports**

Add:
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Remove from lucide imports: `ArrowLeft, LogOut`

Remove `useNavigate` import. Remove `const navigate = useNavigate()`. Remove `signOut` from `useAuth()` destructure. Remove `handleSignOut` function.

- [ ] **Step 5: Modify return block**

Change outer wrapper:
```jsx
// Before:
<div className="min-h-screen bg-stone-50">
// After:
<div className="min-h-full">
```

Delete header block (lines 104–120, the `<div className="bg-stone-950...">` through its closing `</div>`).

Insert `<AdminPageHeader>` with `saveIndicator` in the action slot, as the first child:
```jsx
<AdminPageHeader title="About Page" action={saveIndicator} />
```

Change content wrapper:
```jsx
// Before:
<div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
// After:
<div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
```

- [ ] **Step 6: Commit AdminAboutEditor**

```bash
git add src/pages/AdminAboutEditor.jsx
git commit -m "feat: strip AdminAboutEditor header, promote save indicator to AdminPageHeader"
```

---

## Task 6: AdminUsersPage — strip header

**File:** `src/pages/AdminUsersPage.jsx`

The return starts at line 66. The header is lines 68–82 (`<div className="bg-stone-950...">...</div>`).

- [ ] **Step 1: Update AdminUsersPage imports**

Add:
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Remove from lucide imports: `ArrowLeft` (and `LogOut` if present).

Remove `useNavigate` import and `const navigate = useNavigate()`. Remove `signOut` from `useAuth()` destructure and `handleSignOut` function (if present).

- [ ] **Step 2: Modify return block**

Change outer wrapper:
```jsx
// Before:
<div className="min-h-screen bg-stone-50">
// After:
<div className="min-h-full">
```

Delete header block (lines 68–82, the `<div className="bg-stone-950...">` through its closing `</div>`).

Insert `<AdminPageHeader title="Admin Users" />` as the first child.

Change content wrapper:
```jsx
// Before:
<div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
// After:
<div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminUsersPage.jsx
git commit -m "feat: strip AdminUsersPage header for sidebar redesign"
```

---

## Task 7: AdminDestinationsList — strip dark shell, lighten table

**File:** `src/pages/AdminDestinationsList.jsx`

This page uses a dark `bg-[#111111]` shell and dark card classes throughout.

- [ ] **Step 1: Update imports**

Add:
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Remove from lucide imports: `ArrowLeft, LogOut`

Remove `useAuth` import line entirely. Remove `const { signOut } = useAuth()`. Remove `handleSignOut` function.

- [ ] **Step 2: Replace outer wrapper and header**

Current return (line 43):
```jsx
return (
  <div className="min-h-screen flex flex-col bg-[#111111]">
    <header className="flex-shrink-0 h-13 px-5 flex items-center justify-between border-b border-white/[0.07] bg-[#111111]">
      {/* ... breadcrumb + New Destination + logout ... */}
    </header>

    <div className="flex-1 p-6">
```

Replace with:
```jsx
return (
  <div className="min-h-full">
    <AdminPageHeader
      title="Destinations"
      action={
        <button
          onClick={() => navigate('/admin/destinations/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
        >
          <Plus size={14} />
          New Destination
        </button>
      }
    />

    <div className="px-6 py-6">
```

- [ ] **Step 3: Update error block**

```jsx
// Before:
<div className="mb-4 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
// After:
<div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
```

- [ ] **Step 4: Lighten the table card**

```jsx
// Before:
<div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
// After:
<div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
```

- [ ] **Step 5: Lighten table header and rows**

```jsx
// Before thead:
<thead className="border-b border-white/10">
// After:
<thead className="border-b border-stone-200">
```

```jsx
// Before tbody:
<tbody className="divide-y divide-white/5">
// After:
<tbody className="divide-y divide-stone-200">
```

```jsx
// Before row hover:
<tr key={dest.id} className="hover:bg-white/5 transition-colors group">
// After:
<tr key={dest.id} className="hover:bg-stone-50 transition-colors group">
```

- [ ] **Step 6: Lighten text colors in table cells**

```jsx
// Destination name (before):
<p className="text-sm font-semibold text-stone-100">{dest.name}</p>
// After:
<p className="text-sm font-semibold text-stone-900">{dest.name}</p>
```

```jsx
// Region cell (before):
<td className="px-5 py-3 text-sm text-stone-400">{dest.region || '—'}</td>
// After:
<td className="px-5 py-3 text-sm text-stone-600">{dest.region || '—'}</td>
```

```jsx
// Draft status badge (before):
'bg-stone-700 text-stone-400'
// After:
'bg-stone-100 text-stone-500'
```

```jsx
// Edit button hover (before):
className="p-1.5 rounded-lg hover:bg-white/10 text-stone-500 hover:text-stone-200 transition-colors"
// After:
className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
```

```jsx
// Delete button hover (before):
className="p-1.5 rounded-lg hover:bg-red-500/20 text-stone-500 hover:text-red-400 transition-colors"
// After:
className="p-1.5 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
```

- [ ] **Step 7: Update "No destinations" text**

```jsx
// Before:
<p className="text-center py-12 text-stone-500 text-sm">No destinations yet.</p>
// After: unchanged (stone-500 is fine on light bg)
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/AdminDestinationsList.jsx
git commit -m "feat: strip AdminDestinationsList dark shell, lighten to light theme"
```

---

## Task 8: AdminDestinationEditor — strip dark shell, lighten cards

**File:** `src/pages/AdminDestinationEditor.jsx`

This page has a dark `bg-[#111111]` shell, dark input fields, dark cards, and a save indicator in the header.

- [ ] **Step 1: Update imports**

Add:
```js
import AdminPageHeader from '../components/AdminPageHeader'
```

Remove from lucide imports: `ArrowLeft, LogOut`

`CheckCircle2`, `Loader2`, and `X` are already in the lucide imports — keep them, they're used in the inline save indicator in Step 4.

Remove `signOut` from `useAuth()` destructure. Remove `handleSignOut` function.

- [ ] **Step 2: Update inputCls constant**

Current (line 34):
```js
const inputCls = "w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors"
```

Replace with:
```js
const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors"
```

- [ ] **Step 3: Update the loading state**

Current (line 244):
```jsx
if (loading) return (
  <div className="h-screen bg-[#111111] flex items-center justify-center">
    <Loader2 className="animate-spin text-[#00E676]" size={28} />
  </div>
)
```

Replace with:
```jsx
if (loading) return (
  <div className="h-screen flex items-center justify-center">
    <Loader2 className="animate-spin text-[#00E676]" size={28} />
  </div>
)
```

- [ ] **Step 4: Replace outer wrapper, header, and save indicator**

Current return (line 250):
```jsx
return (
  <div className="min-h-screen flex flex-col bg-[#111111]">
    {/* Header */}
    <header className="flex-shrink-0 h-13 px-5 flex items-center justify-between border-b border-white/[0.07]">
      {/* ... breadcrumb + save status + logout ... */}
    </header>

    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 flex flex-col gap-5 pb-16">
```

Replace with:
```jsx
return (
  <div className="min-h-full">
    <AdminPageHeader
      title={isNew ? 'New Destination' : (fields.name || 'Untitled')}
      action={
        !isNew ? (
          saveStatus === 'saving'
            ? <span className="flex items-center gap-1.5 text-xs text-stone-500"><Loader2 size={11} className="animate-spin" /> Saving…</span>
            : saveStatus === 'saved'
            ? <span className="flex items-center gap-1.5 text-xs text-[#00E676]/70"><CheckCircle2 size={11} /> Saved</span>
            : saveStatus === 'error'
            ? <span className="flex items-center gap-1.5 text-xs text-red-500"><X size={11} /> Save error</span>
            : null
        ) : null
      }
    />
    <div className="max-w-3xl mx-auto px-8 py-6 flex flex-col gap-5 pb-16">
```

Also close the removed `<div className="flex-1 overflow-y-auto">` — remove its closing `</div>` at the end of the return.

- [ ] **Step 5: Lighten error block**

```jsx
// Before:
<div className="flex items-start gap-2.5 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
// After:
<div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
```

- [ ] **Step 6: Lighten all section cards**

Find all occurrences of dark section styling and replace:

```jsx
// Before (section card):
<section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
// After:
<section className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
```

```jsx
// Before (section header divider):
<div className="px-5 py-3 border-b border-white/5">
// After:
<div className="px-5 py-3 border-b border-stone-100">
```

There will be multiple sections (Destination Info, Map, Hero Image, etc.) — apply to all of them.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminDestinationEditor.jsx
git commit -m "feat: strip AdminDestinationEditor dark shell, lighten to light theme"
```

---

## Task 9: Delete AdminArticlesList

**File:** `src/pages/AdminArticlesList.jsx` — **DELETE**

- [ ] **Step 1: Delete the file**

```bash
git rm src/pages/AdminArticlesList.jsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: delete AdminArticlesList (consolidated into AdminDashboard at /admin)"
```

---

## Task 10: Build verification

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: exits with code 0, no errors. Warnings about unused variables are acceptable if they pre-existed.

If build fails:
- `Cannot find module './pages/AdminArticlesList'` → check App.jsx has no remaining import of it
- `X is not defined` → check imports in the modified page file

- [ ] **Step 2: Manual smoke test (dev server)**

```bash
npm run dev
```

Open `http://localhost:5173/admin`. You should see:
1. Dark sidebar on the left (224px), light content area on the right
2. Sidebar shows: Travel Times logo, CONTENT group (Articles, Write, Staging, Ingest), MANAGE group (Destinations, About, Settings), user avatar + logout at bottom
3. "Articles" nav item is active (green left border, white text)
4. Content area shows `AdminPageHeader` with title "Articles" and "Write Article" button
5. Articles table renders correctly

Navigate to each route and verify the sidebar persists:
- `/admin/write` → "Write Article" header, placeholder text, Write is active in sidebar
- `/admin/staging` → "Staging Queue" header, staging UI renders
- `/admin/ingest` → "Ingest Content" header, drop zone renders
- `/admin/destinations` → "Destinations" header, light table renders
- `/admin/about` → "About Page" header with save indicator
- `/admin/settings` → "Settings" header
- `/admin/users` → "Admin Users" header (super admin only)
- `/admin/articles/:id` → full-screen dark article editor (NO sidebar, unchanged)
- `/admin/login` → login page (NO sidebar, unchanged)

- [ ] **Step 3: Commit build artifacts (if any)**

```bash
git add -p  # review any remaining unstaged changes
git commit -m "feat: admin panel redesign complete — dark sidebar + light content shell"
```

- [ ] **Step 4: Push**

```bash
git push
```

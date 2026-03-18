# Admin Panel Redesign — Design Spec

**Goal:** Replace the fragmented per-page headers and navigation with a persistent dark sidebar + light content area shell, giving the admin panel a unified modern look. Consolidates the articles list at `/admin`, and adds a `/admin/write` placeholder for the upcoming rich text article editor.

**Architecture:** A new `AdminLayout` component (using React Router `<Outlet>`) wraps all sidebar pages via a nested route in `App.jsx`. `AdminSidebar` handles navigation and logout. Each page strips its standalone header and renders content only. A shared `PageHeader` component provides consistent page title + primary action layout. `AdminArticlesList` is removed — `AdminDashboard` (at `/admin`) is the single articles management page.

**Tech Stack:** React 19, React Router v7, Tailwind CSS v4

---

## What stays unchanged

- **AdminLogin** — standalone, no sidebar, no changes
- **AdminArticleEditor** — isolated full-screen dark layout, no changes
- **ProtectedRoute** — no changes

---

## New Files

### `src/components/AdminLayout.jsx`

Shell component. Renders the sidebar on the left and a scrollable content area on the right. Uses `<Outlet />` from React Router so nested routes render inside the content area.

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

### `src/components/AdminSidebar.jsx`

Fixed dark sidebar. Uses `<NavLink>` for active state detection. Super-admin-only items gated by `isSuperAdmin` from `useAuth`.

**Structure:**
```
┌─────────────────────┐
│ ⬛ Travel Times      │  ← logo/site name, stone-950 bg throughout
│                     │
│ CONTENT             │  ← group label, tiny uppercase
│   📄 Articles       │  ← /admin
│   ✏ Write          │  ← /admin/write
│   📥 Staging        │  ← /admin/staging
│   ⬆ Ingest         │  ← /admin/ingest
│                     │
│ MANAGE              │
│   📍 Destinations   │  ← /admin/destinations
│   ℹ About          │  ← /admin/about
│   ⚙ Settings       │  ← /admin/settings
│                     │
│ ADMIN               │  ← only shown to super admins
│   👥 Users          │  ← /admin/users
│                     │
│ ─────────────────── │
│ [avatar] Name       │  ← user info
│ [Logout]            │  ← logout button
└─────────────────────┘
```

**Styling:**
- Sidebar width: `w-56` (224px)
- Background: `bg-stone-950`
- Group labels: `text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 px-3 mb-1`
- Nav item base: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-colors`
- Nav item active: `bg-white/10 text-white border-l-2 border-[#00E676]` — via NavLink `className` callback
- Divider between nav and user section: `border-t border-white/10`
- User section: avatar (from `user.user_metadata.avatar_url`), name (`user.user_metadata.full_name || user.email`), logout icon button

**Icons** (from lucide-react): `FileText`, `PenLine`, `Inbox`, `Upload`, `MapPin`, `Info`, `Settings`, `Users`, `LogOut`

### `src/components/AdminPageHeader.jsx`

Consistent page title + optional action button rendered at the top of each page's content area.

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

---

## `src/App.jsx` — Route restructure

Replace all individual ProtectedRoute-wrapped admin routes (except login and editor) with a single nested layout route. The layout route renders `ProtectedRoute > AdminLayout` as the element, and all sidebar pages become child routes.

```jsx
// Add imports:
import AdminLayout from './components/AdminLayout'

// Replace individual admin routes with:

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
```

**Note:** `ProtectedRoute` renders its `children` prop. Since `AdminLayout` uses `<Outlet>`, this works: ProtectedRoute renders AdminLayout, which renders the matched child route via Outlet.

**`AdminArticlesList` is removed.** The `/admin/articles` route and `AdminArticlesList` component no longer exist. `AdminDashboard` at `/admin` is the single articles management page.

---

## Pages — What Gets Stripped and Added

Each page listed below:
1. **Removes** its standalone `bg-stone-950` header block (the dark bar with back arrow, page title, logout)
2. **Removes** any standalone `bg-[#111111]` wrapper (DestinationsList, DestinationEditor)
3. **Changes** outer wrapper to just `<div className="min-h-full">` (AdminLayout provides the bg)
4. **Adds** `<AdminPageHeader>` at the top with the page title and primary action

### AdminDashboard
This component IS the articles management page. The page title changes from "Dashboard" to "Articles".
- Remove: entire `<div className="bg-stone-950 ...">` header block (lines ~143–190) including user avatar, back-to-site, logout, and all nav buttons (Destinations, About, Settings, Ingest, Review Queue, Users)
- Keep: search bar, refresh button, tabs, table — move search+refresh into the content area below the page header
- Add: `<AdminPageHeader title="Articles" action={<NewArticleButton />} />`
- Outer wrapper: `<div>` (no bg needed, AdminLayout provides it)

### AdminArticlesList
**Deleted.** This component and its route (`/admin/articles`) are removed. `AdminDashboard` at `/admin` serves as the articles list.

### AdminArticleWriter (new)
Placeholder page shell for the upcoming rich text article editor (implemented in a separate spec/plan).

```jsx
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

Route: `/admin/write`

### AdminStagingQueue
- Remove: `bg-stone-950` header with back arrow and logout
- Add: `<AdminPageHeader title="Staging Queue" />`
- Outer wrapper: `<div className="min-h-full">`

### AdminIngestion
- Remove: `bg-stone-950` header with back arrow, "Back to Site", logout
- Add: `<AdminPageHeader title="Ingest Content" />`
- Outer wrapper: `<div className="min-h-full">`

### AdminDestinationsList
- Remove: dark `bg-[#111111]` wrapper + header
- Add: `<AdminPageHeader title="Destinations" action={<NewDestinationButton />} />`
- Outer wrapper: `<div className="min-h-full">`
- Content cards: update from dark to light (`bg-white border-stone-200`)

### AdminDestinationEditor
- Remove: dark `bg-[#111111]` wrapper + header (breadcrumb + logout)
- Add: `<AdminPageHeader title={isNew ? 'New Destination' : destinationName} />`
- Outer wrapper: `<div className="min-h-full">`
- Content cards: update from dark to light

### AdminSettingsPage
- Remove: `bg-stone-950` header with back arrow and logout
- Add: `<AdminPageHeader title="Settings" />`
- Outer wrapper: `<div className="min-h-full">`

### AdminAboutEditor
- Remove: `bg-stone-950` header (keep the save status indicator — move it to AdminPageHeader `action` slot)
- Add: `<AdminPageHeader title="About Page" action={<SaveStatusIndicator />} />`
- Outer wrapper: `<div className="min-h-full">`

### AdminUsersPage
- Remove: custom header with back arrow
- Add: `<AdminPageHeader title="Admin Users" />`
- Outer wrapper: `<div className="min-h-full">`

---

## Files Changed Summary

| File | Action |
|---|---|
| `src/components/AdminLayout.jsx` | **Create** |
| `src/components/AdminSidebar.jsx` | **Create** |
| `src/components/AdminPageHeader.jsx` | **Create** |
| `src/pages/AdminArticleWriter.jsx` | **Create** (placeholder shell) |
| `src/App.jsx` | Restructure admin routes into nested layout route; remove `/admin/articles`; add `/admin/write` |
| `src/pages/AdminDashboard.jsx` | Strip header + nav buttons; rename page title to "Articles" |
| `src/pages/AdminArticlesList.jsx` | **Delete** |
| `src/pages/AdminStagingQueue.jsx` | Strip header |
| `src/pages/AdminIngestion.jsx` | Strip header |
| `src/pages/AdminDestinationsList.jsx` | Strip dark wrapper + header, lighten cards |
| `src/pages/AdminDestinationEditor.jsx` | Strip dark wrapper + header, lighten cards |
| `src/pages/AdminSettingsPage.jsx` | Strip header |
| `src/pages/AdminAboutEditor.jsx` | Strip header, move save status to AdminPageHeader |
| `src/pages/AdminUsersPage.jsx` | Strip header |

---

## Out of Scope

- Staging queue item count badge on sidebar nav item
- Any changes to the existing AdminArticleEditor (isolated full-screen dark layout, no changes)
- Rich text editor implementation for AdminArticleWriter — covered in a separate spec/plan
- Any changes to the login page
- Any changes to public-facing pages
- Dark mode toggle

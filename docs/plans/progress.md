# Travel Times Sri Lanka - Progress Tracker

**Last Updated:** 2026-02-12

---

## Phase 1: Restructure & Ship v1

### 1.1 Restructure Data Model
**Status:** DONE

- Merged article content (restaurants, accommodations, thingsToDo) into `destinations.js` events
- Added date fields (`startDate`, `endDate`, `season`) to all events
- Added helper functions: `isHappeningNow`, `isHappeningSoon`, `isInSeason`, `daysUntilEvent`, `getTimelyEvents`, `getEventBySlug`, `getAllEvents`, `getEventsForDestination`, `getFeaturedTimelyEvents`
- Uses `date-fns` for date calculations
- Renamed destination-level `thingsToDo` to `generalThingsToDo` to avoid collision with event-level data

### 1.2 Migrate to React Router
**Status:** DONE

- Replaced custom hash-based routing (`window.location.hash` + `currentPage` state) with `react-router-dom` v7 library mode
- Route structure implemented:
  - `/` → HomePage
  - `/destinations` → DestinationsPage
  - `/destination/:slug` → DestinationDetailPage
  - `/event/:slug` → ArticlePage
  - `/admin/login` → AdminLogin
  - `/admin` → AdminDashboard (protected)
  - `/admin/editor` → AdminArticleEditor (protected)
  - `*` → NotFoundPage (404)
- New files created:
  - `src/components/ScrollToTop.jsx` - scrolls to top on route change
  - `src/hooks/useScrolled.js` - shared `useScrolled(threshold)` hook
  - `src/components/Layout.jsx` - footer wrapper with `<Outlet />`
  - `src/pages/NotFoundPage.jsx` - 404 catch-all page
- `src/main.jsx` wrapped with `<BrowserRouter>`
- `src/App.jsx` rewritten as clean route tree (no more routing state, scroll state, or image constants)
- Eliminated `setCurrentPage` prop-drilling from all 12+ components
- `ProtectedRoute` now uses `<Navigate to="/admin/login" replace />` instead of `useEffect` redirect
- SharedHeader and SearchModal use `useNavigate()` internally
- Each page manages its own `isScrolled` via `useScrolled()` hook
- HomePage absorbed: image constants, parallax scroll effect, `activeTab`/`setActiveTab` state
- ArticlePage and DestinationDetailPage use `useParams()` for slug
- Admin pages use `useNavigate()` with `{ replace: true }` for redirects
- Fixed bug: AdminDashboard preview button now includes article slug in URL
- Removed debug `console.log('URL hash:...')` from AuthContext
- Added Google Maps API key guard: maps gracefully degrade with placeholder when key is invalid/missing

### 1.3 Restructure EventDetailPage
**Status:** DONE

- Renamed `ArticlePage.jsx` → `EventDetailPage.jsx` via `git mv`
- Switched data source from `getArticleBySlug` (legacy `articles.js`) to `getEventBySlug` + `getDestinationBySlug` from `destinations.js`
- Added `EventDateBadge` in hero section
- Added "Back to [Destination Name]" breadcrumb link
- All `articleData` references replaced with event/article equivalents
- Kandy Perahera magazine layout preserved; other event slugs use same layout with nullable article fields

### 1.4 Restructure DestinationDetailPage
**Status:** DONE

- Events sorted by timeliness using `getEventsForDestination(slug)` with date-aware sorting
- Timely events get green ring visual treatment (`isTimely` check)
- `timelyCount` badge shown when timely events exist
- `EventDateBadge` displayed on each event card

### 1.5 Add "Happening Soon" to Homepage
**Status:** DONE

- "What's Happening" section shows timely events from `getTimelyEvents()`
- Cards with destination name, event name, date badge (via `EventDateBadge`), hero image
- Click navigates to event detail or destination page
- `EventDateBadge` component created (`src/components/ui/EventDateBadge.jsx`) showing "Happening Now", "Starts in X days", "In Season" states

### 1.6 Build Homepage Tabs
**Status:** DONE

- Feature tab: DONE (hero event, happening soon, destinations grid, featured stories, visual gallery, newsletter CTA)
- Journal tab: DONE (`src/pages/tabs/JournalTab.jsx`) — chronological event feed with category filters, EventDateBadge
- Maps tab: DONE (`src/pages/tabs/MapsTab.jsx`) — interactive Google Maps with destination markers, graceful fallback to card grid
- Plan Your Trip tab: DONE (`src/pages/tabs/PlanYourTripTab.jsx`) — static travel info: best time to visit, getting around, quick tips

### 1.7 Fix All Dead UI
**Status:** DONE

- Tab label "Gear" → "Plan" in SharedHeader (`UI.jsx`)
- Footer links wired: Destinations → `/destinations`, About Us → `/about`, Contact → `/contact`, Privacy → `/privacy`, Terms → `/terms`
- Created static pages: `AboutPage.jsx`, `ContactPage.jsx`, `PrivacyPage.jsx`, `TermsPage.jsx`
- Added lazy imports and routes for all 4 static pages in `App.jsx`

### 1.8 Mobile-First Audit & Fixes
**Status:** NOT STARTED

### 1.9 Add More Destinations
**Status:** NOT STARTED

- Currently: 6 destinations (Kandy, Ella, Haputale, Galle, Arugam Bay, Sigiriya)
- Target: 12+ destinations

### 1.10 Deploy to Hostinger
**Status:** NOT STARTED

---

## Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Google Maps API key is placeholder | Medium | `.env` has `YOUR_GOOGLE_MAPS_API_KEY_HERE` - maps show placeholder. Need real key. |
| ~~Homepage tabs only show "Feature" content~~ | ~~Low~~ | FIXED — Journal, Maps, Plan tabs all built |
| ~~Footer links are non-functional~~ | ~~Low~~ | FIXED — Destinations, About, Contact, Privacy, Terms all wired |
| Newsletter form is cosmetic only | Low | No backend to store emails yet |
| Admin CMS uses mock data | Medium | No real CRUD - prototype only |

---

## Files Modified/Created in This Session

| File | Action | Summary |
|------|--------|---------|
| `src/main.jsx` | Modified | Added `<BrowserRouter>` wrapper |
| `src/App.jsx` | Rewritten | Clean route tree, removed all routing/scroll state |
| `src/components/ProtectedRoute.jsx` | Modified | Uses `<Navigate>` component |
| `src/components/UserProfile.jsx` | Modified | Uses `useNavigate()` |
| `src/components/UI.jsx` | Modified | SharedHeader + SearchModal use `useNavigate()` |
| `src/pages/HomePage.jsx` | Modified | Absorbed images, parallax, activeTab; uses `useNavigate()` |
| `src/pages/ArticlePage.jsx` | Modified | `useParams()` + `useNavigate()` + maps guard |
| `src/pages/DestinationsPage.jsx` | Modified | `useNavigate()` + `useScrolled()` |
| `src/pages/DestinationDetailPage.jsx` | Modified | `useParams()` + `useNavigate()` + maps guard |
| `src/pages/AdminLogin.jsx` | Modified | `useNavigate()` with replace |
| `src/pages/AdminDashboard.jsx` | Modified | `useNavigate()`, fixed preview slug bug |
| `src/pages/AdminArticleEditor.jsx` | Modified | `useNavigate()` |
| `src/contexts/AuthContext.jsx` | Modified | Removed debug console.log |
| `src/components/ScrollToTop.jsx` | **Created** | Scroll to top on route change |
| `src/hooks/useScrolled.js` | **Created** | Shared scroll threshold hook |
| `src/components/Layout.jsx` | **Created** | Footer wrapper with `<Outlet />` |
| `src/pages/NotFoundPage.jsx` | **Created** | 404 page |

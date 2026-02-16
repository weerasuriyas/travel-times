# Travel Times Sri Lanka - Product Requirements Document

**Version:** 3.0
**Last Updated:** 2026-02-10
**Status:** Final Draft
**Client Type:** Tourism business
**Deployment Target:** Hostinger
**Timeline:** ASAP (1-2 weeks for v1 launch, then iterative)

---

## 1. Product Overview

**Travel Times** is a magazine-style travel platform focused on Sri Lanka, built for a tourism business client. The core experience is destination-first: users explore destinations, discover events happening there (with upcoming events featured prominently), then dive into rich editorial content about each event with curated recommendations for activities, accommodations, and dining.

### 1.1 Core Content Hierarchy

```
DESTINATIONS (top-level)
  └── EVENTS (belong to a destination, time-aware)
        └── EVENT DETAIL PAGE (the article/editorial write-up)
              ├── Story (editorial content)
              ├── Things to Do (activities & attractions)
              ├── Where to Stay (accommodations + map)
              └── Where to Eat (restaurants + map)
```

**Key principle:** Destinations are the containers. Events are the content. Articles are the editorial storytelling within an event. Everything (hotels, restaurants, activities) exists in the context of a destination's event.

### 1.2 Strategic Direction

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Content model** | Destination → Event → Detail (Stay/Eat/Do) | Mirrors how travelers actually plan trips |
| **Event timing** | Support both specific dates AND seasonal ranges | Some events are annual with exact dates, others are year-round |
| **Upcoming events** | Featured on homepage AND pinned on destination pages | Drives urgency and relevance |
| **Ship strategy** | Ship React SPA first, migrate to Next.js later | Client needs something live ASAP |
| **CMS approach** | Full WYSIWYG admin built on Supabase | Client must publish content independently |
| **Multi-user admin** | Yes, with roles (admin, editor, author) | Content team collaboration required |
| **4th nav tab** | "Plan Your Trip" - interactive trip planner | Users select dates + interests, get personalized itinerary |
| **Next.js migration** | Phase 2 (after initial SPA launch) | SEO critical for tourism, but can't delay launch |
| **Mobile-first** | All pages designed mobile-first, responsive up | Tourism users browse on phones while traveling |
| **Mobile app** | PWA first, then native wrapper (Capacitor) | Offline access, push notifications, app store presence |

### 1.3 Current State Summary

| Area | Status |
|------|--------|
| **Framework** | React 19.2 + Vite (rolldown-vite) |
| **Styling** | Tailwind CSS 4.x + custom CSS animations |
| **Backend** | Supabase (auth only; content is static JS files) |
| **Maps** | Google Maps (@vis.gl/react-google-maps) |
| **Routing** | Custom hash-based routing (react-router-dom installed but unused) |
| **Auth** | Google OAuth via Supabase (working) |
| **Admin CMS** | Prototype only (mock data, no CRUD) |
| **Content** | 3 articles, 6 destinations (static data files) |
| **Deployment** | Not configured |

### 1.4 Mobile Strategy

The platform must be **mobile-first**. Tourism users are primarily browsing on phones while actively traveling or planning trips on the go.

#### Phase 1: Mobile-Responsive Web (Week 1-2)
- All pages designed mobile-first, scaled up for tablet/desktop
- Touch-friendly tap targets (min 44px), swipeable carousels
- Optimized images (responsive srcset, lazy loading, WebP)
- Fast load times on 3G/4G connections (target LCP < 2.5s on mobile)
- Mobile-friendly navigation (hamburger menu, bottom nav consideration)
- Maps usable on touch (pinch-zoom, tap markers)
- Text readable without zooming (min 16px body)
- No horizontal scroll, no hover-only interactions

#### Phase 2: Progressive Web App / PWA (Week 3-6)
- Service worker for offline caching of visited pages
- Web app manifest (Add to Home Screen prompt)
- Offline fallback page with cached destinations
- Background sync for saved itineraries
- Push notifications for upcoming events ("Kandy Perahera starts in 3 days!")
- App-like experience: full-screen mode, splash screen, theme color

#### Phase 3: Native App Wrapper (Week 10+)
- **Capacitor** (by Ionic) to wrap the web app as iOS + Android native app
- Same React codebase, native shell for app store distribution
- Native features: camera (trip photos), GPS (nearby destinations), haptics
- App Store / Google Play listing for brand credibility
- Deep linking (share event URLs that open in app)

#### Mobile-Specific UX Requirements
| Element | Mobile Behavior |
|---------|----------------|
| **Navigation** | Sticky compact header, hamburger or bottom tab bar |
| **Hero banners** | 16:9 aspect (not 21:9), full-width bleed |
| **Event cards** | Single column stack, swipeable horizontal on homepage spotlight |
| **Maps** | Full-screen takeover with back button, not inline |
| **Image galleries** | Swipe-to-navigate, pinch-to-zoom |
| **Trip planner** | Step-by-step wizard (one question per screen) |
| **Destination grid** | 1-col on phone, 2-col on tablet |
| **Text content** | Generous line height (1.7+), max-width for readability |

### 1.5 Brand & Design Language

- **Colors:** `#00E676` (primary green), `#FF3D00` (accent red), `#FFD600` (accent gold)
- **Typography:** System UI, heavy black weight, uppercase italic headings, wide tracking
- **Shapes:** Very rounded corners (32px-48px border radius), pill buttons
- **Aesthetic:** Editorial magazine layout, parallax, hover animations, glass effects

---

## 2. User Flow

### 2.1 Primary Journey

```
┌─────────────────────────────────────────────────────────┐
│  HOMEPAGE                                               │
│  ┌─────────────────────────────────┐                    │
│  │ "Happening Soon" Section        │ ◄── Events with    │
│  │ Featured upcoming events across │     dates closest   │
│  │ all destinations                │     to today        │
│  └─────────┬───────────────────────┘                    │
│            │ click event                                 │
│            ▼                                             │
│  ┌─────────────────────────────────┐                    │
│  │ Destinations Grid               │                    │
│  │ Browse all destinations         │                    │
│  └─────────┬───────────────────────┘                    │
└────────────┼────────────────────────────────────────────┘
             │ click destination
             ▼
┌─────────────────────────────────────────────────────────┐
│  DESTINATION PAGE  (e.g., /destination/kandy)           │
│  ┌─────────────────────────────────┐                    │
│  │ Hero: Map + destination info    │                    │
│  └─────────────────────────────────┘                    │
│  ┌─────────────────────────────────┐                    │
│  │ UPCOMING EVENTS (pinned top)    │ ◄── Sorted by      │
│  │ Events happening soon           │     proximity to    │
│  │ with countdown/date badges      │     current date    │
│  └─────────┬───────────────────────┘                    │
│  ┌─────────────────────────────────┐                    │
│  │ ALL EVENTS                      │ ◄── Year-round &   │
│  │ Other events at this dest       │     seasonal shown  │
│  └─────────┬───────────────────────┘     below          │
│  ┌─────────────────────────────────┐                    │
│  │ Quick Stats / Highlights        │                    │
│  └─────────────────────────────────┘                    │
└────────────┼────────────────────────────────────────────┘
             │ click event
             ▼
┌─────────────────────────────────────────────────────────┐
│  EVENT DETAIL PAGE  (e.g., /event/kandy-perahera)       │
│                                                         │
│  1. HERO + Event overview                               │
│     - Title, subtitle, dates, category                  │
│     - Author, location, read time                       │
│                                                         │
│  2. STORY (editorial write-up)                          │
│     - Rich article content with images                  │
│     - Pull quotes, photo plates                         │
│                                                         │
│  3. THINGS TO DO                                        │
│     - Activities & attractions at this destination      │
│     - Cards with duration, price, category              │
│                                                         │
│  4. WHERE TO STAY                                       │
│     - Interactive map with hotel markers                │
│     - Hotel cards with ratings, prices, tags            │
│                                                         │
│  5. WHERE TO EAT                                        │
│     - Interactive map with restaurant markers           │
│     - Restaurant cards with ratings, specialty, hours   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Homepage Tabs

| Tab | Content |
|-----|---------|
| **Feature** | Cover story (currently Kandy Perahera), featured event cards, photo gallery, destination previews, experience cards, newsletter CTA |
| **Journal** | Chronological feed of all event write-ups, filterable by category |
| **Maps** | Interactive full-island map with all destinations, click to explore |
| **Plan** | Interactive trip planner: select dates + interests → generated itinerary |

### 2.3 Event Date Logic

Events support two date formats:

| Type | Example | Display |
|------|---------|---------|
| **Specific dates** | `startDate: "2026-07-29", endDate: "2026-08-12"` | "Jul 29 - Aug 12, 2026" + countdown badge ("Starts in 12 days") |
| **Seasonal/year-round** | `season: "July - August"` or `season: "Year-round"` | "Best in July - August" or "Available Year-round" |

**"Happening Soon" logic:**
- Events with specific dates within the next 30 days are featured as "Happening Soon"
- Events with specific dates currently ongoing show "Happening Now" badge
- Seasonal events matching the current month get a "In Season" badge
- On destination pages, upcoming/in-season events are pinned above other events

---

## 3. What's Already Built (and what needs to change)

### Current → Desired Mapping

| Current | Becomes | Changes Needed |
|---------|---------|----------------|
| `ArticlePage.jsx` | **EventDetailPage** | Rename, restructure sections to: Story → Do → Stay → Eat |
| `DestinationDetailPage.jsx` | Stays, but restructured | Events become primary content, sorted by date proximity |
| `DestinationsPage.jsx` | Stays | Add "Happening Soon" badges on destination cards |
| `HomePage.jsx` | Stays, but add "Happening Soon" section | Feature upcoming events prominently before destinations |
| `articles.js` data | **events.js** or merged into destinations | Restructure: articles are write-ups that belong to events, events belong to destinations |
| `destinations.js` data | Stays, enhanced | Add date fields to events, more destinations |

### Current Data Structure Problem

Right now, articles and destinations are separate entities with a loose slug-based link. The new model requires:

```
destinations.js (or Supabase)
  └── kandy
        ├── name, description, coordinates, stats...
        ├── events: [
        │     {
        │       slug: "kandy-perahera",
        │       name: "The Fire of Kandy",
        │       startDate: "2026-07-29",     ← NEW
        │       endDate: "2026-08-12",       ← NEW
        │       season: "July - August",      ← existing
        │       type: "Cultural Festival",
        │       article: {                    ← MERGED from articles.js
        │         title, subtitle, author,
        │         content, sections...
        │       },
        │       thingsToDo: [...],            ← MOVED from destination level
        │       restaurants: [...],           ← MOVED from article level
        │       accommodations: [...]         ← MOVED from article level
        │     }
        │   ]
        └── generalThingsToDo: [...]  ← Activities not tied to specific event
```

---

## 4. Known Issues & Gaps

### Critical Gaps
1. **Content hierarchy is flat** - Articles and destinations are disconnected; need event-centric restructure
2. **No date awareness** - Events have no real dates, can't feature "upcoming" events
3. **Homepage tabs non-functional** - Only "Feature" tab renders; Journal, Maps, Plan show nothing
4. **Admin CMS non-functional** - Dashboard uses mock data; no CRUD
5. **No proper routing** - Hash-based routing instead of react-router-dom

### Non-Functional UI Elements
- Footer links go nowhere
- "View Full Gallery" button does nothing
- Hotel/restaurant "View Details" buttons do nothing
- Newsletter form has no backend
- CTA buttons ("Explore Food Scene", "Contact Expert") have no targets
- Social media links non-functional
- Experience cards without events link nowhere

### Technical Debt
- `react-router-dom` installed but unused
- `date-fns` installed but barely used (will be needed for event dates)
- `tslib` installed with no TypeScript
- Console.log debug statements throughout auth code
- Placeholder Unsplash images reused across multiple destinations

---

## 5. Development Roadmap

### Phase 1: Restructure & Ship v1 (Week 1-2)

> **Goal:** Restructure content model around destinations→events, fix all broken UI, deploy to Hostinger.

#### 1.1 Restructure Data Model
- Merge `articles.js` into `destinations.js` as event write-ups
- Add date fields to events (`startDate`, `endDate`, `season`)
- Move restaurants/accommodations/thingsToDo into event context
- Add helper functions:
  - `getUpcomingEvents()` - events within 30 days or currently happening
  - `getEventsForDestination(slug)` - sorted by date proximity
  - `getEventBySlug(slug)` - full event with article content
  - `isHappeningSoon(event)` / `isHappeningNow(event)` / `isInSeason(event)`
- Keep `date-fns` for date calculations (already installed)

#### 1.2 Migrate to React Router
- Replace hash-based routing with react-router-dom
- Route structure:
  - `/` - Homepage
  - `/destinations` - All destinations
  - `/destination/:slug` - Destination detail (events listed)
  - `/event/:slug` - Event detail page (was ArticlePage)
  - `/gallery` - Photo gallery
  - `/about`, `/contact`, `/privacy`, `/terms` - Static pages
  - `/admin`, `/admin/editor`, `/admin/login` - Admin routes
  - `*` - 404 page

#### 1.3 Restructure EventDetailPage (was ArticlePage)
- Rename `ArticlePage.jsx` → `EventDetailPage.jsx`
- Reorder sections: Hero → Story → Things to Do → Where to Stay → Where to Eat
- Add event date display with smart badges:
  - "Happening Now" (green pulse) if between startDate and endDate
  - "Starts in X days" (countdown) if within 30 days
  - "In Season" if seasonal event matches current month
  - Date range display for specific dates
- Add "Back to [Destination Name]" breadcrumb link
- Keep existing map/card interactivity for hotels and restaurants

#### 1.4 Restructure DestinationDetailPage
- Pin upcoming/in-season events at top with date badges
- Show remaining events below
- Add "Happening Soon" visual treatment (border glow, badge)
- Keep existing map, highlights, stats sections
- Each event card shows: image, name, dates/season, type, description, "Read More" link

#### 1.5 Add "Happening Soon" to Homepage
- New section between cover story and destinations: "Happening Soon"
- Shows events across ALL destinations that are upcoming (next 30 days) or in season
- Large cards with destination name, event name, date badge, hero image
- Click → goes to event detail page
- If no upcoming events, show "In Season" events instead

#### 1.6 Build Homepage Tabs

**Journal Tab**
- Chronological feed of all event write-ups
- Cards: hero image, event title, destination name, category, date, read time
- Filter pills (All, Culture, Journey, Heritage, Adventure)
- Cards link to `/event/:slug`

**Maps Tab**
- Full Sri Lanka map with all destinations as markers
- Click destination marker → popup card with name, tagline, upcoming event count, "Explore" link
- Color-code: destinations with upcoming events get green markers, others get gray

**Plan Your Trip Tab**
- Step 1: Select trip length (3, 5, 7, 10, 14 days)
- Step 2: Select interests (Culture, Beach, Hill Country, Wildlife, Adventure, Food)
- Step 3: Generated day-by-day itinerary matching interests to destinations/events
- Mini route map, day cards with destination + suggested activities
- Save to localStorage

#### 1.7 Fix All Dead UI
- Footer links → route to pages
- "View Full Gallery" → `/gallery` page
- Hotel/restaurant buttons → expand card details or scroll to map
- Newsletter → save email to Supabase
- Experience cards → link to relevant event or destination
- Social links → real URLs or remove
- Create placeholder pages: About, Contact, Privacy, Terms, 404

#### 1.8 Mobile-First Audit & Fixes
- Audit every page at 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)
- Fix any horizontal overflow, text truncation, or tiny tap targets
- Ensure hero banners use 16:9 on mobile (not ultra-wide 21:9)
- Convert hover-only interactions to tap-friendly alternatives
- Add responsive image srcset for bandwidth savings on mobile
- Test Google Maps touch interactions (pinch, tap markers)
- Ensure all font sizes >= 16px on mobile to prevent iOS auto-zoom
- Consider bottom tab bar navigation for mobile (Feature, Journal, Maps, Plan)

#### 1.9 Add More Destinations
- Expand to 12+: add Colombo, Nuwara Eliya, Trincomalee, Jaffna, Polonnaruwa, Anuradhapura, Mirissa, Unawatuna
- Each needs at least 1 event (can be year-round/seasonal)
- Use real coordinates and stats

#### 1.10 Deploy to Hostinger
- Production build of SPA (static files)
- Configure Hostinger to serve SPA (all paths → index.html)
- Set environment variables (Supabase URL/key, Google Maps key)
- SSL + custom domain
- Images served from Hostinger `/uploads/` or keep Unsplash for v1

---

### Phase 2: Backend API + CMS + Next.js (Week 3-6)

#### 2.1 Build Node.js API on Hostinger
- Express or Fastify REST API (see Section 6.4-6.5 for endpoints)
- Connect to Hostinger PostgreSQL via `pg` (node-postgres)
- Create database schema (see Section 8)
- Seed database from current static data files
- Auth middleware: verify Supabase JWT tokens, check admin roles
- Image upload endpoint → saves to Hostinger `/uploads/`

#### 2.2 Migrate Frontend to API
- Replace static data imports with `fetch('/api/...')` calls
- Add loading states and error handling
- React app now reads from API instead of static JS files

#### 2.3 Next.js Migration
- App Router, SSR for event/destination pages, SSG for static pages
- Port all components and styling
- API routes can move to Next.js API routes (or keep separate Express server)
- ISR for content pages

#### 2.4 Full WYSIWYG Admin CMS
- Rich text editor (Tiptap/Plate) for event write-ups
- Event management: create/edit events with dates, link to destination
- Restaurant/accommodation/activity management per event
- Image upload to Hostinger via API
- Draft → Review → Published workflow
- Multi-user roles (admin, editor, author)
- Live preview

#### 2.5 SEO
- Meta tags, Open Graph, JSON-LD structured data
- Sitemap, robots.txt, canonical URLs

---

### Phase 3: Engagement & Content (Week 6-10)

- Expand to 15+ articles/event write-ups
- Photo gallery with lightbox
- Newsletter email integration (Resend)
- Social sharing on events
- Analytics (GA or Plausible)
- Enhanced trip planner (save to account, share via link, PDF export)
- **PWA setup:** Service worker (Workbox), web manifest, offline caching, Add to Home Screen
- **Push notifications** for upcoming events via web push API

---

### Phase 4: Advanced (Week 10+)

- User accounts, saved itineraries, bookmarks
- Comments/reactions on events
- Seasonal content engine (dynamic recommendations by current month)
- Travel time estimates between destinations (Google Directions API)
- Multi-language (Sinhala, Tamil)
- Monetization (affiliate hotel links, sponsored content)
- **Capacitor native app wrapper** (iOS + Android) using same React codebase
- Native features: camera for trip photos, GPS for nearby destinations, haptic feedback
- App Store / Google Play submission
- Deep linking (shared URLs open in native app if installed)

---

## 6. Tech Stack & Architecture

### 6.1 Overview

```
┌──────────────────────────────────────────────────┐
│  BROWSER (React SPA)                             │
│  React 19 + Vite + Tailwind CSS 4 + Google Maps  │
└──────────────┬───────────────────────────────────┘
               │ API calls
               ▼
┌──────────────────────────────────────────────────┐
│  HOSTINGER (Node.js)                             │
│  ├── Express/Fastify REST API                    │
│  │   GET /api/destinations                       │
│  │   GET /api/destinations/:slug                 │
│  │   GET /api/events/:slug                       │
│  │   GET /api/events/upcoming                    │
│  │   POST /api/newsletter/subscribe              │
│  │   POST /api/contact                           │
│  │   CRUD /api/admin/events (protected)          │
│  │   CRUD /api/admin/destinations (protected)    │
│  ├── PostgreSQL Database                         │
│  │   All content: destinations, events,          │
│  │   articles, restaurants, accommodations,      │
│  │   newsletter subscribers, itineraries         │
│  ├── Static File Hosting                         │
│  │   Built React SPA (index.html, JS, CSS)       │
│  └── Image Hosting                               │
│      /uploads/ directory for all images           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  SUPABASE (free tier - auth only)                │
│  ├── Google OAuth sign-in/sign-out               │
│  ├── JWT session tokens                          │
│  ├── admin_users table (role checking)           │
│  └── Auth state management                       │
└──────────────────────────────────────────────────┘
```

### 6.2 Auth Flow

```
User clicks "Sign In"
  → Supabase Google OAuth → returns JWT token
  → React stores token in context
  → API requests include token in Authorization header
  → Node.js API verifies JWT with Supabase
  → Checks admin_users table for role (admin/editor/author)
  → Returns data or 401/403
```

- **Readers:** Google sign-in via Supabase. Can save itineraries, bookmark events.
- **Admins/Editors:** Same Google sign-in, but their user_id is in the `admin_users` table with a role.
- **Anonymous users:** Can browse everything. No sign-in required for reading content.

### 6.3 Tech Stack Summary

| Layer | Technology | Hosted On |
|-------|-----------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS 4 | Hostinger (static files) |
| **API** | Node.js (Express or Fastify) | Hostinger (Node.js app) |
| **Database** | PostgreSQL | Hostinger |
| **Auth** | Supabase (Google OAuth) | Supabase cloud (free tier) |
| **Maps** | Google Maps API | Google Cloud |
| **Icons** | Lucide React | Bundled |
| **Images** | Self-hosted | Hostinger `/uploads/` |
| **Date logic** | date-fns | Bundled |
| **PWA** | Workbox (service worker) | Bundled |
| **Native wrapper** | Capacitor (Phase 3) | App Store / Google Play |

### 6.4 API Endpoints (Phase 1 - Read Only)

For v1, the API is read-only (content stays in static JS files, served through API):

```
GET  /api/destinations              → All destinations (summary)
GET  /api/destinations/:slug        → Single destination with events
GET  /api/events/:slug              → Single event with full article content
GET  /api/events/upcoming           → Events happening soon / in season
GET  /api/events/all                → All events (for Journal tab)
POST /api/newsletter                → Subscribe email
POST /api/contact                   → Submit contact form
```

### 6.5 API Endpoints (Phase 2 - Admin CRUD)

```
POST   /api/admin/destinations      → Create destination
PUT    /api/admin/destinations/:id  → Update destination
DELETE /api/admin/destinations/:id  → Delete destination
POST   /api/admin/events            → Create event
PUT    /api/admin/events/:id        → Update event (article, restaurants, hotels)
DELETE /api/admin/events/:id        → Delete event
POST   /api/admin/upload            → Upload image to /uploads/
GET    /api/admin/users             → List admin users
POST   /api/admin/users             → Add admin user with role
```

All admin endpoints require valid Supabase JWT + admin/editor role.

### 6.6 Project Structure (Full Stack)

```
travel-times-srilanka/
├── client/                          # React SPA (current src/ moves here)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── lib/
│   ├── public/
│   ├── index.html
│   └── vite.config.js
├── server/                          # Node.js API
│   ├── index.js                     # Express/Fastify entry point
│   ├── routes/
│   │   ├── destinations.js
│   │   ├── events.js
│   │   ├── newsletter.js
│   │   ├── contact.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js                  # Verify Supabase JWT + check role
│   ├── db/
│   │   ├── connection.js            # PostgreSQL connection (pg or Prisma)
│   │   ├── schema.sql               # Database schema
│   │   └── seed.js                  # Seed from current static data
│   └── package.json
├── uploads/                         # Image storage
├── package.json                     # Root workspace
└── PRD.md
```

### 6.7 Database Access Strategy

For simplicity, use **pg** (node-postgres) directly or **Prisma** ORM:

| Option | Pros | Cons |
|--------|------|------|
| **pg (raw SQL)** | Zero overhead, full control, tiny dependency | Write SQL manually, no type safety |
| **Prisma** | Auto-generated types, migrations, great DX | Heavier dependency, learning curve |
| **Drizzle** | Lightweight ORM, SQL-like syntax, fast | Newer, smaller community |

**Recommendation:** Start with **pg** for simplicity (v1 is mostly read-only). Migrate to Prisma in Phase 2 when admin CRUD gets complex.

### 6.8 Phase 1 Simplification

For the 1-2 week v1 deadline, we can skip the API entirely and keep static data:

```
Week 1-2 (v1): Static JS data files → deploy SPA to Hostinger
Week 3+  (v2): Build Node.js API + migrate to PostgreSQL
```

This means Phase 1 ships as a pure static SPA (no server needed), and the Node.js API + Postgres migration happens alongside the Next.js migration in Phase 2. This is the fastest path to getting something live.

---

## 7. Data Structure

### `src/data/destinations.js` (new structure)

```js
export const destinations = {
  'kandy': {
    slug: 'kandy',
    name: 'Kandy',
    tagline: 'The Cultural Capital',
    description: '...',
    heroImage: '...',
    coordinates: [7.2906, 80.6337],
    region: 'Central Province',
    highlights: ['Temple of the Tooth', 'Esala Perahera', ...],
    stats: { elevation: '500m', temperature: '24°C', bestTime: 'July - August' },

    // General activities (not tied to specific event)
    generalThingsToDo: [
      { name: 'Visit Temple of the Tooth', category: 'Culture', duration: '2-3 hours', ... },
      { name: 'Walk Around Kandy Lake', category: 'Leisure', duration: '1 hour', ... },
    ],

    // Events at this destination
    events: [
      {
        slug: 'kandy-perahera',
        name: 'The Fire of Kandy',
        type: 'Cultural Festival',

        // Date support (both formats)
        startDate: '2026-07-29',       // specific date (nullable)
        endDate: '2026-08-12',         // specific date (nullable)
        season: 'July - August',       // seasonal fallback

        duration: '10 nights',
        image: '/perahera_banner.jpg',
        description: 'The Esala Perahera draws more than a million pilgrims...',
        featured: true,

        // Article write-up (the editorial content)
        article: {
          title: 'THE FIRE OF KANDY.',
          subtitle: 'We walked through the smoke of a thousand copra torches...',
          category: 'Culture',
          tags: ['Festival', 'Heritage', 'Buddhist', 'Kandy'],
          issue: 'Issue 04: The Relic',
          author: { name: 'Sanath Weerasuriya', role: 'Field Correspondent', ... },
          readTime: 8,
          publishedDate: '2026-01-15',
          content: { introduction: '...', sections: [...] }
        },

        // Things to do during THIS event
        thingsToDo: [
          { name: 'Kandyan Dance Show', category: 'Culture', duration: '1 hour', ... },
          { name: 'Tea Plantation Visit', category: 'Experience', duration: 'Half day', ... },
        ],

        // Where to stay for this event
        accommodations: [
          { name: "Queen's Hotel", type: 'Heritage Listed', price: '$80-$150', ... },
          { name: "The Grand Kandian", type: 'Modern Luxury', price: '$150-$250', ... },
        ],

        // Where to eat during this event
        restaurants: [
          { name: 'White House Restaurant', type: 'Traditional Sri Lankan', ... },
          { name: 'The Empire Café', type: 'Colonial Tea Room', ... },
        ]
      },
      // ... more events
    ]
  },
  // ... more destinations
};
```

### Helper Functions

```js
import { isWithinInterval, addDays, parseISO, getMonth } from 'date-fns';

// Get events happening within next 30 days across all destinations
export const getUpcomingEvents = () => { ... };

// Get events currently happening right now
export const getHappeningNowEvents = () => { ... };

// Get seasonal events matching current month
export const getInSeasonEvents = () => { ... };

// Combined: all "featured" events for homepage
export const getFeaturedTimelyEvents = () => { ... };

// Get events for a destination, sorted: happening now > upcoming > in season > rest
export const getEventsForDestination = (slug) => { ... };

// Get single event by slug (searches across all destinations)
export const getEventBySlug = (slug) => { ... };
```

---

## 8. Database Schema (Hostinger PostgreSQL)

```sql
-- Destinations
destinations (
  id uuid PK,
  slug text UNIQUE,
  name text,
  tagline text,
  description text,
  hero_image text,
  coordinates float8[],
  region text,
  highlights text[],
  stats jsonb,
  created_at timestamptz,
  updated_at timestamptz
)

-- Events (belong to a destination)
events (
  id uuid PK,
  destination_id uuid FK -> destinations,
  slug text UNIQUE,
  name text,
  type text,
  start_date date NULLABLE,        -- specific date
  end_date date NULLABLE,          -- specific date
  season text NULLABLE,            -- "July - August" or "Year-round"
  duration text,
  image text,
  description text,
  is_featured boolean,
  created_at timestamptz,
  updated_at timestamptz
)

-- Articles (editorial write-up for an event)
articles (
  id uuid PK,
  event_id uuid FK -> events UNIQUE,
  title text,
  subtitle text,
  category text,
  tags text[],
  issue text,
  author_id uuid FK -> authors,
  read_time int,
  published_date timestamptz,
  status text CHECK (status IN ('draft','review','published','archived')),
  hero_image text,
  content jsonb,
  created_at timestamptz,
  updated_at timestamptz
)

-- Things to do (per event OR general per destination)
things_to_do (
  id uuid PK,
  event_id uuid FK -> events NULLABLE,
  destination_id uuid FK -> destinations NULLABLE,
  name text, category text, duration text,
  image text, description text, price text
)

-- Restaurants (per event)
restaurants (
  id uuid PK,
  event_id uuid FK -> events,
  name text, type text, price_range text, rating float,
  description text, image text, tags text[],
  coordinates float8[], specialty text, hours text
)

-- Accommodations (per event)
accommodations (
  id uuid PK,
  event_id uuid FK -> events,
  name text, type text, price_range text, rating float,
  description text, image text, tags text[],
  coordinates float8[]
)

-- Authors
authors (id uuid PK, name text, role text, bio text, avatar text)

-- Admin users (already exists)
admin_users (user_id uuid FK, role text, is_active boolean, created_at timestamptz)

-- Newsletter
newsletter_subscribers (id uuid PK, email text UNIQUE, subscribed_at timestamptz, is_active boolean)

-- Trip planner
saved_itineraries (id uuid PK, user_id uuid FK NULLABLE, name text,
                   trip_days int, interests text[], itinerary jsonb,
                   created_at timestamptz)
```

---

## 9. Route Structure

```
/                           → HomePage (Feature, Journal, Maps, Plan tabs)
/destinations               → DestinationsPage (grid of all destinations)
/destination/:slug          → DestinationDetailPage (events sorted by date)
/event/:slug                → EventDetailPage (Story → Do → Stay → Eat)
/gallery                    → GalleryPage
/about                      → AboutPage
/contact                    → ContactPage
/privacy                    → PrivacyPage
/terms                      → TermsPage
/admin/login                → AdminLogin
/admin                      → AdminDashboard (protected)
/admin/editor               → AdminArticleEditor (protected)
*                           → NotFoundPage (404)
```

---

## 10. File Structure (Proposed)

### Phase 1 (SPA with static data - ships first)
```
src/
├── App.jsx                          # React Router setup, layout shell
├── main.jsx                         # Entry point
├── index.css                        # Tailwind + custom animations
├── assets/images/
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── InfoBanner.jsx
│   │   └── SearchModal.jsx
│   ├── ui/
│   │   ├── SectionHeader.jsx
│   │   ├── MapMarker.jsx
│   │   ├── EventDateBadge.jsx       # "Happening Now" / "In 12 days" / "In Season"
│   │   └── UserProfile.jsx
│   ├── trip-planner/
│   │   ├── DaySelector.jsx
│   │   ├── InterestPicker.jsx
│   │   ├── ItineraryCard.jsx
│   │   └── RouteMap.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── data/
│   └── destinations.js              # Unified: destinations + events + articles
├── hooks/
│   └── useEventDates.js             # Date calculation helpers
├── lib/
│   └── supabase.js                  # Auth only
└── pages/
    ├── HomePage.jsx
    ├── EventDetailPage.jsx           # Was ArticlePage
    ├── DestinationsPage.jsx
    ├── DestinationDetailPage.jsx
    ├── GalleryPage.jsx
    ├── AboutPage.jsx
    ├── ContactPage.jsx
    ├── PrivacyPage.jsx
    ├── TermsPage.jsx
    ├── NotFoundPage.jsx
    ├── admin/
    │   ├── AdminLogin.jsx
    │   ├── AdminDashboard.jsx
    │   └── AdminArticleEditor.jsx
    └── tabs/
        ├── JournalTab.jsx
        ├── MapsTab.jsx
        └── TripPlannerTab.jsx
```

### Phase 2 (Full-stack with Node.js API + PostgreSQL)
```
travel-times-srilanka/
├── client/                          # React SPA (src/ moves here)
│   ├── src/                         # Same structure as above
│   ├── public/
│   ├── index.html
│   └── vite.config.js
├── server/                          # Node.js REST API
│   ├── index.js                     # Express entry point
│   ├── routes/
│   │   ├── destinations.js          # GET /api/destinations
│   │   ├── events.js                # GET /api/events, /api/events/upcoming
│   │   ├── newsletter.js            # POST /api/newsletter
│   │   ├── contact.js               # POST /api/contact
│   │   └── admin.js                 # CRUD (protected)
│   ├── middleware/
│   │   └── auth.js                  # Verify Supabase JWT + admin role
│   ├── db/
│   │   ├── connection.js            # pg connection to Hostinger Postgres
│   │   ├── schema.sql               # Table definitions
│   │   └── seed.js                  # Import from static data files
│   └── package.json
├── uploads/                         # Self-hosted images
└── package.json                     # Root workspace config
```

---

## 11. Success Metrics

| Metric | v1 Target (Week 2) | v2 Target (Week 6) |
|--------|---------------------|---------------------|
| All UI elements functional | 100% | 100% |
| Destinations | 12+ | 15+ |
| Events with write-ups | 3 (existing) + 3 new | 10+ |
| "Happening Soon" working | Yes | Yes (real-time) |
| Proper URL routing | Yes | Yes (SSR) |
| Event detail page flow (Story→Do→Stay→Eat) | Yes | Yes |
| Interactive island map | Yes | Yes |
| Trip planner | Basic (client-side) | Full (saved, shareable) |
| Admin can publish events | No (Phase 2) | Yes |
| Page load (LCP) | < 3s | < 2.5s |
| Mobile Lighthouse score | > 80 | > 90 |
| Mobile-responsive pages | 100% | 100% |
| PWA installable | No | Yes |
| Native app (Capacitor) | No | Planned (Phase 3) |

---

## 12. Immediate Next Steps (Subagent-Ready Tasks)

### Batch 1 (Parallel - no dependencies)

| Task | Scope | Size |
|------|-------|------|
| **Restructure data model** | Merge articles into destinations as event write-ups, add date fields, create helper functions | Medium |
| **Migrate to react-router-dom** | Replace hash routing, set up all routes, update all navigation calls | Medium |
| **Add new destinations** | Add 6-8 new destinations with events, activities, coordinates | Small |
| **Create static pages** | About, Contact, Privacy, Terms, 404 pages matching design system | Small |
| **Clean tech debt** | Remove console.logs, unused deps, fix imports | Small |

### Batch 2 (After Batch 1)

| Task | Scope | Size |
|------|-------|------|
| **Add "Happening Soon" to homepage** | New section featuring time-aware events | Medium |
| **Restructure EventDetailPage** | Reorder: Story → Do → Stay → Eat, add date badges | Medium |
| **Restructure DestinationDetailPage** | Pin upcoming events, add date badges, sort by proximity | Small |
| **Build Journal tab** | Chronological event feed with filters | Small |
| **Build Maps tab** | Full island map with destination markers | Medium |
| **Build Trip Planner tab** | Date + interest selector → generated itinerary | Large |
| **Fix dead UI elements** | Footer links, dead buttons, newsletter form | Small |
| **Build Gallery page** | Photo grid with lightbox | Medium |

### Batch 3: Mobile & Deploy
| Task | Scope | Size |
|------|-------|------|
| **Mobile-first audit** | Test all pages at 375px/390px/768px, fix overflow, tap targets, font sizes | Medium |
| **Mobile navigation** | Bottom tab bar for mobile, hamburger menu, responsive header | Medium |
| **Integration testing** | Test all routes, flows, responsive on real devices | Small |
| **Deploy to Hostinger** | Build, configure, SSL, domain | Small |

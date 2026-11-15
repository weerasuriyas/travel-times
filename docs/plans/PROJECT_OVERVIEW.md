# Travel Times Sri Lanka - Project Overview

## Project Overview

**Travel Times Sri Lanka** is a modern, editorial-style travel blog built with cutting-edge web technologies. It showcases immersive storytelling about Sri Lankan destinations and experiences.

## Tech Stack & Framework

### Core Framework
- **Next.js 16** (App Router, JavaScript) — pages, layouts, and SSR served by a custom Express+Next server
- **React 19.2** with React-DOM 19.2
- **Express 4** mounted as a custom server inside `app.js` for the `/api/*` surface

### Build & Development Tools
- **Next.js dev server** (`npm run dev`) — same `node app.js` entrypoint in dev and prod, NODE_ENV switches the mode
- **Node.js (ES Modules)** — project is `"type": "module"` for native ESM support

### Styling & CSS
- **Tailwind CSS 4** with the `@tailwindcss/postcss` plugin
- **PostCSS 8** wires the Tailwind plugin

### Mapping & Interactive Elements
- **Leaflet 1.9.4** + **React-Leaflet 5** — loaded via `next/dynamic({ ssr: false })` from `'use client'` page entries because Leaflet touches `window` at module load

### Icons & UI Components
- **Lucide React** — SVG icon library

### Development & Code Quality
- **ESLint** with `eslint-config-next` and `eslint-plugin-react-hooks`
- **@types/react / @types/react-dom** for editor IntelliSense (codebase is JS, not TS)

## Project Structure

```
travel-times-srilanka/
├── app/                             # Next.js App Router routes
│   ├── layout.jsx                   # Root layout: html/body, Providers, fonts, theme init
│   ├── globals.css                  # Tailwind v4 entry + global styles
│   ├── providers.jsx                # 'use client' wrapper for Theme + Auth contexts
│   ├── loading.jsx                  # Default Suspense fallback
│   ├── not-found.jsx                # 404 page
│   ├── (public)/                    # Route group — wraps public pages with Layout (header/footer)
│   │   ├── layout.jsx
│   │   ├── page.jsx                 # /  → HomePage (dynamic ssr:false for Leaflet)
│   │   ├── destinations/page.jsx
│   │   ├── destination/[slug]/page.jsx
│   │   ├── articles/page.jsx
│   │   ├── article/[slug]/page.jsx
│   │   ├── about/, contact/, privacy/, terms/page.jsx
│   └── admin/
│       ├── login/page.jsx           # /admin/login (no protection)
│       ├── articles/[id]/page.jsx   # protected, no admin chrome
│       ├── articles/[id]/preview/page.jsx
│       └── (sidebar)/               # Route group — ProtectedRoute + AdminLayout
│           ├── layout.jsx
│           ├── page.jsx             # /admin → Dashboard
│           ├── write/, staging/, ingest/page.jsx
│           ├── destinations/page.jsx + new/ + [id]/
│           ├── settings/, about/, users/page.jsx
│
├── src/                             # Shared React code (imported by app/ entries)
│   ├── components/                  # Layout, AdminLayout, AdminSidebar, UI, RichTextEditor, etc.
│   ├── views/                       # Page bodies — re-exported by app/**/page.jsx (renamed from src/pages so Next doesn't treat it as Pages Router)
│   ├── contexts/                    # AuthContext, ThemeContext (both 'use client')
│   ├── hooks/
│   ├── lib/                         # supabase.js, api.js
│   └── assets/images/
│
├── server/                          # Express API (mounted by app.js)
│   ├── db.js                        # MySQL pool
│   └── routes/                      # articles, destinations, events, images, staging, settings, unsplash, admin-users
│
├── public/                          # Static assets served at /
├── app.js                           # Custom Next server: helmet + rate-limit + /api routes + nextHandler('*')
├── next.config.js                   # Next config
├── jsconfig.json                    # @/* alias → src/*
├── postcss.config.js                # @tailwindcss/postcss
├── eslint.config.js
└── package.json                     # scripts: dev/start = node app.js, build = next build
```

## Key Components

### app/ — Next.js App Router
- Route tree expressed as directory structure under `app/`
- Two route groups:
  - `(public)` wraps Home, Destinations, Articles, About, Contact, Privacy, Terms in the public `Layout` (header + footer)
  - `admin/(sidebar)` wraps the admin Dashboard / Write / Staging / Ingest / Destinations / Settings / About / Users pages in `ProtectedRoute` + `AdminLayout`
- Standalone admin routes: `/admin/login` (no protection), `/admin/articles/[id]` and `/admin/articles/[id]/preview` (protected but no admin chrome)
- Page bodies live in `src/views/*` and are re-exported by the matching `app/**/page.jsx` entry; Leaflet pages use `'use client' + next/dynamic({ ssr: false })`
- Theme + Auth contexts are mounted once in `app/providers.jsx` and consumed throughout

### HomePage.jsx - Landing Page
- **Feature Article Section**: Large clickable banner with "The Fire of Kandy" article
- **Insider's Pulse**: Editorial section with featured story highlights
- **Visual Stories Gallery**: Instagram-style photo grid with lazy loading
- **Top Destinations**: Card-based destination showcase (Galle, Yala, Ancient Kingdoms)
- **Experiences**: Immersive adventure cards (Surfing, Culinary Journey)

### ArticlePage.jsx - Full Article Experience
- **Hero Section**: Large banner with article metadata
- **Author Metadata**: Author, location, read time display
- **Visual Plates Section**: Three-column layout showcasing key visuals
- **Article Content**: Full article text with drop caps and blockquotes
- **Tusker Spotlight**: Featured elephant "Sinha Raja" with styling
- **Where to Stay Section**: Interactive accommodation selector with:
  - **Map Component**: Leaflet-based interactive map showing hotel locations and Perahera route
  - **Hotel Listing**: Multiple layout modes (scroll, expanded, slide, grid)
  - **Custom Markers**: Color-coded SVG markers (selected hotels in green, temples in gold)
  - **Perahera Route**: Visualization of the sacred procession route

### UI.jsx - Shared Component Library
- **SectionHeader**: Reusable section title with colored accent line
- **InfoBanner**: Top banner with location dispatch and local time
- **LiveBanner**: Minimal accent line separator
- **SharedHeader**: Fixed navigation header with:
  - Logo/brand click-to-home
  - Tab navigation (Feature, Journal, Maps, Gear)
  - Search icon
  - Dynamic styling based on scroll position

## Sample Article: "THE FIRE OF KANDY"

**Article Details:**
- **Title**: "THE FIRE OF KANDY" (Issue 04: The Relic)
- **Location**: src/pages/ArticlePage.jsx
- **Subject**: Esala Perahera festival in Kandy, Sri Lanka
- **Author**: Sanath Weerasuriya
- **Location**: Kandy, Sri Lanka
- **Read Time**: 8 minutes

**Content Sections:**
- Historical context of the 1500-year-old tradition
- Details about the Esala Perahera procession
- Featured elephant "Sinha Raja" and its role
- Accommodation recommendations in Kandy with interactive map
- Local attractions and route visualization

## Styling Approach

### Tailwind CSS 4.1 Implementation
- Utility-first CSS approach with responsive design
- Custom color palette:
  - **Primary Green**: `#00E676` (accent, success)
  - **Orange**: `#FF3D00` (secondary action)
  - **Yellow**: `#FFD600` (highlights)
  - **Stone Scale**: `#1a1a1a` to `#FDFDFB` (grayscale)

### Custom Animations (defined in index.css)
- **marquee**: Sliding text effect
- **dynamicColor**: Color-cycling animation
- **shimmer**: Light sweep effect
- **glow**: Glowing shadow effect
- **float**: Subtle vertical floating
- **pulse-glow**: Pulsing red glow
- **marker-bounce**: Hotel marker animation
- **card-shine**: Hover shine effect on cards
- **pulse-border**: Border glow animation
- **route-flow**: SVG stroke animation for map routes
- **slideDown**: Header initial appearance

### Custom CSS Classes
- **hover-glow**: Green shadow on hover
- **hover-lift**: Elevation + shadow on hover
- **reveal-on-scroll**: Scroll animation with fade-in/up
- **gradient-text**: Text gradient effect
- **glass-effect**: Backdrop blur + saturation
- **hover-brightness**: Image brightness adjustment
- **parallax-image**: Performance-optimized parallax
- **preserve-rounded**: Maintain rounded corners during transforms
- **smooth-header**: Smooth transition header
- **hide-scrollbar**: Scrollable but hidden scrollbar

### Responsive Design
- Mobile-first approach with `md:`, `lg:`, `xl:`, `2xl:` breakpoints
- Clamp functions for fluid typography:
  - `.hero-title`: `clamp(1.5rem, 6vw, 12rem)`
  - `.hero-subtitle`: `clamp(0.875rem, 2.5vw, 3.5rem)`
  - `.fluid-headline-home`: `clamp(3.5rem, 12vw, 14rem)`

## Architecture Highlights

### Routing Strategy
- Next.js App Router file-based routing under `app/`
- Public routes wrapped by the `(public)` group layout, admin sidebar routes by `admin/(sidebar)` layout
- Dynamic segments: `[slug]` for destinations and articles, `[id]` for admin article/destination editors
- Client-side navigation via `next/link` and `useRouter` from `next/navigation`
- A single Node process serves both Next.js (rendering + static) and the Express `/api/*` surface — see `app.js`

### State Management
- React hooks (useState, useRef, useMemo, useEffect)
- No Redux or context API for global state
- Local component state for page selection, scrolling, layout modes

### Performance Features
- RequestAnimationFrame for scroll handling (prevents jank)
- Lazy image loading strategy
- Responsive image URLs from Unsplash CDN
- Preloading critical banner image in HTML head
- Memoized HomePage component to prevent unnecessary re-renders

### Interactive Features
- Parallax scrolling with calculated offsets
- Interactive map with Leaflet and multiple layout modes
- Hotel selection sync between map and listings
- Custom marker icons with click handlers
- Perahera route visualization on map
- Layout mode switching (scroll, expanded, slide, grid)
- Search icon placeholder in header

### Accessibility Considerations
- Semantic HTML structure
- ARIA-compliant heading hierarchy
- Image alt text on all images
- Keyboard navigation support in tabs and buttons
- Sufficient color contrast with accent colors

## Development Scripts

- `npm run dev` — `node app.js` (custom Next server in dev mode, with Express `/api/*` mounted)
- `npm run build` — `next build`
- `npm start` — `NODE_ENV=production node app.js` (what Hostinger runs)
- `npm run lint` — `next lint`
- `postinstall` — runs `next build` so Hostinger has a built `.next/` after `npm install`

## Overall Assessment

This is a **production-ready, high-quality editorial website** with:
- ✅ Modern tech stack and best practices
- ✅ Engaging visual storytelling
- ✅ Smooth UX with thoughtful animations
- ✅ Clean, maintainable code structure
- ✅ Performance optimizations in place
- ✅ Interactive geospatial features
- ✅ Responsive design across all devices

The Kandy Perahera article demonstrates the platform's capability for immersive, long-form editorial content with rich media integration and interactive elements.

# Travel Times Sri Lanka - Progress Tracker

**Last Updated:** 2026-05-01

---

## 2026-04-29: Next.js Migration

Migrated the frontend from Vite + react-router-dom to **Next.js 16 (App Router, JS)**.

| Change | Detail |
|---|---|
| Build tool | `vite` removed; `next build` is the build, `next` powers dev |
| Routing | `react-router-dom` removed; route tree now under `app/` with `(public)` and `admin/(sidebar)` route groups |
| Server | `app.js` is now a **custom Next server** that mounts the existing Express `/api/*` routers (helmet, rate-limit, CORS preserved) and hands every other request to `nextApp.getRequestHandler()` — single Node process, single port for Hostinger |
| Pages | `src/pages/` renamed to `src/views/` (so Next doesn't mistake it for Pages Router); `app/**/page.jsx` re-exports the view modules |
| Client-only | Leaflet pages loaded via `next/dynamic({ ssr: false })` from `'use client'` page entries |
| Env vars | `VITE_*` → `NEXT_PUBLIC_*` (`VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, etc.); `import.meta.env` → `process.env` |
| Scripts | `npm run dev` and `npm start` both run `node app.js`; `postinstall` runs `next build` so Hostinger has a built `.next/` after `npm install` |
| Smoke tested | `/`, `/destinations`, `/articles`, `/about`, `/admin/login` render correctly under the new server |

---

## Current Health

- `npm run lint`: PASS
- `npm run build`: PASS
- `npm test`: Not configured (`package.json` has no test script)

---

## Phase 1: Restructure & Ship v1

| Item | Status | Notes |
|---|---|---|
| 1.1 Restructure Data Model | DONE | Unified event/destination model in `src/data/destinations.js` with date-aware helpers. |
| 1.2 Migrate Routing | DONE | First moved hash-routing → react-router-dom; on 2026-04-29 migrated again to Next.js App Router. Route tree now under `app/`, protected admin routes in place via `admin/(sidebar)/layout.jsx`. |
| 1.3 Restructure EventDetailPage | DONE | `EventDetailPage` reads unified event data and destination context. |
| 1.4 Restructure DestinationDetailPage | DONE | Destination page reads event data with timeliness sorting and badges. |
| 1.5 Add "Happening Soon" to Homepage | DONE | Homepage pulls timely events and links into event detail. |
| 1.6 Build Homepage Tabs | DONE | Feature, Journal, Maps, and Plan tabs implemented. |
| 1.7 Fix Dead UI | DONE | Footer links/pages and CTA/navigation wiring completed. |
| 1.8 Mobile-First Audit & Fixes | NOT STARTED | Needs a formal viewport-by-viewport audit checklist and fixes. |
| 1.9 Add More Destinations | NOT STARTED | Still at initial destination set; target remains 12+. |
| 1.10 Deploy to Hostinger | NOT STARTED | Frontend + API deployment + env verification still pending. |

---

## Ingestion/API Track (2026-02-15 plan)

| Item | Status | Notes |
|---|---|---|
| PHP API scaffold (`api/`) | DONE (local) | Core files and route files are present in repo. |
| Frontend API client (`src/lib/api.js`) | DONE | CRUD/upload helpers wired for ingestion flow. |
| Admin ingestion UI (`/admin/ingest`) | DONE | Folder drop + markdown parsing + image upload + article submit flow exists. |
| Hostinger API deployment | NOT STARTED | API now lives in `app.js` alongside Next.js (single Node process). `NEXT_PUBLIC_API_URL` defaults to `/api` (same origin); set explicitly only if the frontend ever splits from the API origin. |
| Admin dashboard live data | NOT STARTED | Dashboard still uses mock article rows. |

---

## Known Gaps / Risks

| Issue | Severity | Notes |
|---|---|---|
| Google Maps API key is placeholder | Medium | `.env` still contains `YOUR_GOOGLE_MAPS_API_KEY_HERE`; maps degrade gracefully but stay in fallback mode. |
| API URL default | Low | After the Next migration, frontend and `/api/*` share an origin (`app.js` serves both). `NEXT_PUBLIC_API_URL` defaults to `/api`; only override it for split deployments. |
| Admin Dashboard is mock-backed | Medium | `src/pages/AdminDashboard.jsx` is not yet reading live API data. |
| No automated test suite | Medium | Build/lint gates are present; behavior regressions rely on manual QA. |

---

## Next Implementation Plan (Priority Order)

1. **Deploy API to Hostinger and set real env values**
   - Deploy `api/` to hosting.
   - Set real DB/JWT config in Hostinger.
   - Update `NEXT_PUBLIC_API_URL` to production API URL.
2. **Replace dashboard mock data with live API reads/writes**
   - Load article list from API.
   - Support status changes and delete/archive actions against real endpoints.
3. **Run Phase 1.8 mobile-first audit**
   - Audit key routes on common breakpoints and fix layout/interaction issues.
4. **Expand destination coverage (Phase 1.9)**
   - Add at least 6 more destinations/events to reach minimum launch content depth.
5. **Complete production deployment hardening (Phase 1.10)**
   - Smoke tests, auth checks, ingestion smoke run, and rollback plan.

---

## Definition of "Next"

The immediate next implementation item is **Step 1: deploy the API and wire real production environment variables**. Without this, the ingestion workflow cannot be used end-to-end in production.

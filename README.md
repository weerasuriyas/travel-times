# Travel Times Sri Lanka

A curated travel journalism hub for Sri Lanka, featuring immersive stories, hotel guides, and cultural experiences.

## Overview

Travel Times is a digital platform dedicated to the "slow travel" movement in Sri Lanka. It serves as a travel hub connecting visitors with authentic experiences, from the Kandy Esala Perahera to the southern coasts.

### Key Features
- **Immersive Journalism**: In-depth stories about culture, heritage, and lifestyle.
- **Interactive Maps**: Curated guides to hotels, temples, and points of interest.
- **Visual Stories**: High-quality photography galleries.
- **Top Destinations**: Guides for Kandy, Galle, Yala, and more.

## Stack

- **Next.js 16** (App Router, JavaScript) on **React 19** with **Tailwind CSS 4**
- **Express** mounted as a custom Next server in `app.js` for `/api/*` routes
- **MySQL** (Hostinger) via `mysql2`; **Supabase** for admin auth (Google OAuth)
- **Leaflet + React-Leaflet** for maps (loaded via `next/dynamic({ ssr: false })`)
- **TipTap** rich-text editor in the admin

Single Node process serves both the Next.js app and `/api/*` — designed for Hostinger Node hosting (one entrypoint per app).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | `node app.js` in dev mode (Next + Express on the same port) |
| `npm start` | `NODE_ENV=production node app.js` — what Hostinger runs |
| `npm run build` | `next build` |
| `npm run lint` | `next lint` |

## Project layout

- `app/` — Next.js App Router routes; `(public)` and `admin/(sidebar)` route groups apply the public and admin chrome respectively
- `src/views/` — page bodies, re-exported by `app/**/page.jsx`
- `src/components/` — shared UI (Layout, AdminLayout, RichTextEditor, …)
- `src/contexts/` — Auth + Theme contexts (`'use client'`)
- `src/lib/` — `supabase.js`, `api.js`
- `server/` — Express routers mounted by `app.js` under `/api/*`

## Environment

Frontend-public values use the `NEXT_PUBLIC_` prefix (formerly `VITE_`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=/api    # same-origin; override only for split deploys
```

Server-side values (DB, JWT secret, upload paths) keep the `API_*` prefix and are read by `app.js` and `server/*` only.

# CMS Editor UX + Destination Manager + Site Settings — Design Spec

## Goal

Overhaul the article editor layout so body and photos are always co-visible; add a full destination CRUD manager with click-to-pin map and free Unsplash photo suggestions; add a homepage pin feature; auto-calculate read time; and add a site settings page.

---

## 1. Article Editor Layout Overhaul

### Problem
The article editor's left pane stacks Article Info → Body → Photos vertically. When working with photos the user must scroll back up to reach the textarea, breaking flow.

### Solution
Split the editor's left pane into two side-by-side columns within the existing 50% editor area:

- **Left column (~60%)** — Article Info fields (title, subtitle, category, author, tags, status, destination) stacked above the Body textarea. Textarea uses `flex-1 min-h-0` to fill remaining vertical space, `resize-none`.
- **Right column (~40%)** — Photos panel: drag-and-drop upload zone + photo grid. Independently scrollable, always visible.

Both columns share the same scrollable container height. The right preview pane is unchanged.

### Read-time auto-calculation
- Count words in `fields.body` on every body change: `Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200)`, minimum 1
- Display as "~N min read" label next to the Story Body section header (read-only display)
- Add `read_time` to the `fields` state object and `fieldsRef` so it is included in the existing `apiPatch` autosave call
- Add `read_time` to the PATCH allow-list in `server/routes/articles.js` (same dynamic SET clause pattern as other fields)

### Pin to Homepage toggle
- Add `is_featured` boolean to the `fields` state object (loaded from article data). `loadArticle` must explicitly map `is_featured: !!data.is_featured` from the API response alongside the other fields.
- Render as a prominent toggle in the Article Info section: "📌 Pin to homepage hero"
- Add `is_featured` to the PATCH allow-list in `server/routes/articles.js`
- Pin logic (atomic un-pin) is handled by a dedicated server endpoint (see Section 3)

---

## 2. Destination Manager

### New frontend routes
| Path | Component | Purpose |
|------|-----------|---------|
| `/admin/destinations` | `AdminDestinationsList` | List all destinations, link to create/edit |
| `/admin/destinations/new` | `AdminDestinationEditor` | Create new destination |
| `/admin/destinations/:id` | `AdminDestinationEditor` | Edit existing destination |

### Backend routes
`server/routes/destinations.js` already has `GET /:id?`, `POST /` (auth), and `PUT /:id` (auth). Two changes needed:
- Add `DELETE /:id` (auth) — see cascade behavior below
- Add `slug` to the `PUT /:id` SET clause (currently omitted); add `ER_DUP_ENTRY` → 409 handling to both `POST` and `PUT`

### AdminDestinationsList
- Dark header matching article editor style, with a "New Destination" button
- Table rows: name, region, status, lat/lng indicator (✓/—), hero image thumbnail (32×32)
- Click row → `/admin/destinations/:id`
- Delete button per row: `window.confirm` → `DELETE /api/destinations/:id`. On server error (e.g. unexpected failure), show an inline error banner. The server nulls out `destination_id` on associated articles before deleting the destination (see cascade below).

### AdminDestinationEditor — Fields
| Field | Input | Notes |
|-------|-------|-------|
| name | text | required |
| slug | text | auto-generated from name on create (`name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`), editable; see slug uniqueness below |
| region | select | Western / Central / Southern / Uva / North Central / Eastern / Northern (stored as VARCHAR) |
| tagline | text | short descriptor |
| description | textarea | longer text, min-h ~120px |
| status | select | draft / published |
| lat, lng | read-only number inputs | populated by map interaction |

**Slug field behavior:** Slug input uses **save-on-blur** (not the 800ms debounce) to avoid saving partial slugs mid-type. When the slug input loses focus, call `PUT /api/destinations/:id` with the new slug. If the server returns 409, show an inline red error beneath the field: "This slug is already taken — please choose a different one." The backend `POST /` and `PUT /:id` handlers must catch MySQL's `ER_DUP_ENTRY` error and return `{ error: 'Slug already in use' }` with HTTP 409.

### AdminDestinationEditor — Create vs Edit mode
- **Create mode** (`/admin/destinations/new`): No autosave. All fields are local state. A "Create Destination" button at the bottom calls `POST /api/destinations` with all field values. On success, navigate to `/admin/destinations/:newId` (edit mode). The hero image upload zone is **disabled with a tooltip** "Save the destination first to upload images."
- **Edit mode** (`/admin/destinations/:id`): Autosave on field change with 800ms debounce calling `PUT /api/destinations/:id`. Hero image upload + Unsplash panel are fully active.

### AdminDestinationEditor — Click-to-Pin Map
- Leaflet `MapContainer` (already installed: `leaflet`, `react-leaflet` are in the project)
- Centered on Sri Lanka (7.87, 80.77), zoom 7
- Existing marker shown at current lat/lng if set; marker is **draggable** — drag also updates lat/lng fields
- Click anywhere on map → drops/moves marker, updates lat/lng state fields (which trigger autosave in edit mode)
- "Clear pin" button below map: sets lat/lng to `null`/`null`

### AdminDestinationEditor — Hero Image
Two tabs within a card section:

**Upload tab:** Drag-and-drop or click to upload. Calls `POST /api/images` with `entity_type=destination`, `entity_id=<id>`. Sets `hero_image` field to the uploaded image's URL (triggers autosave). Only available in edit mode.

**Suggest tab (Unsplash):**
- Text field pre-populated with `"<destination name> Sri Lanka"`, editable
- "Search" button calls `GET /api/unsplash/search?q=<query>` (proxied, keeps API key server-side)
- Server handler: calls `https://api.unsplash.com/search/photos?query=<q>&per_page=9&orientation=landscape&client_id=<UNSPLASH_ACCESS_KEY>`
- Server returns a mapped JSON array to the client (not the raw Unsplash response):
  ```json
  [
    {
      "id": "abc123",
      "thumb_url": "https://images.unsplash.com/photo-abc?w=400",
      "regular_url": "https://images.unsplash.com/photo-abc?w=1080",
      "photographer_name": "Jane Doe",
      "photographer_url": "https://unsplash.com/@janedoe"
    }
  ]
  ```
- Frontend renders 3×3 grid of thumbnails with photographer credit overlay
- On photo click: call `POST /api/unsplash/download` with `{ id, regular_url, photographer_name, photographer_url, destination_id }`. Server:
  1. Derives save path: `API_UPLOAD_DIR + '/destination/'` (same pattern as `images.js` non-article uploads). Creates dir with `mkdir({ recursive: true })`.
  2. Fetches `regular_url` via HTTP GET, writes to `unsplash-<id>.jpg` in that dir.
  3. Derives public URL: `API_UPLOAD_URL + '/destination/unsplash-<id>.jpg'`
  4. Inserts `images` record: `{ filename: 'unsplash-<id>.jpg', url, alt_text: 'Photo by <photographer_name> (<photographer_url>) on Unsplash', role: 'hero', entity_type: 'destination', entity_id: destination_id }`
  5. Updates `destinations.hero_image` to the new URL
  6. Returns `{ url }`
  **On any failure (network, disk, or DB):** delete the partially-written file if it exists, then return 500 with `{ error: '...' }`. Requires `API_UPLOAD_DIR` and `API_UPLOAD_URL` env vars (same vars already used by `images.js` for non-article uploads).
- If `UNSPLASH_ACCESS_KEY` env var is missing: tab shows "Add your Unsplash API key in Site Settings to use this feature."
- Server reads `UNSPLASH_ACCESS_KEY` from `process.env` (set via Hostinger env vars panel or `.env` file). The settings table stores it for the UI but the server always reads from env.

---

## 3. Homepage Pin (Atomic Feature Toggle)

### New dedicated endpoint
`POST /api/articles/:id/feature` (auth required)

- Accepts `{ featured: true|false }`
- If `featured: true`: runs two queries in a transaction:
  1. `UPDATE articles SET is_featured = 0` (clear all)
  2. `UPDATE articles SET is_featured = 1 WHERE id = ?`
- If `featured: false`: `UPDATE articles SET is_featured = 0 WHERE id = ?`
- Returns `{ ok: true }`

### Frontend (AdminArticleEditor)
- Toggle calls `POST /api/articles/:id/feature` directly (not the debounce autosave)
- Local `is_featured` state updated optimistically on toggle
- `is_featured` is NOT included in the debounce autosave fields (it has its own endpoint)

### Homepage hero query (backend)
The existing `GET /api/articles` endpoint already orders by `published_at DESC`. Add `is_featured DESC` as the first sort key when `status=published` filter is active:
```sql
SELECT * FROM articles WHERE status = 'published'
ORDER BY is_featured DESC, published_at DESC
```
Confirmed: `HomePage.jsx` calls `apiGet('articles?status=published')` (line 35) and takes `data[0]`. No frontend change needed beyond the DB column existing and the sort order update.

---

## 4. Site Settings

### Backend
- New `settings` table: `key VARCHAR(100) PRIMARY KEY, value TEXT, updated_at TIMESTAMP`
- `GET /api/settings` — public, returns all key/value pairs as a flat JSON object: `{ site_name: "...", tagline: "...", ... }`
- `PUT /api/settings` — auth required; accepts a flat JSON object, upserts each key via `INSERT ... ON DUPLICATE KEY UPDATE value = VALUES(value)`
- New router at `server/routes/settings.js`, mounted at `/api/settings` in `app.js`

### Frontend — AdminSettingsPage (`/admin/settings`)
- On mount: `GET /api/settings` to pre-fill all fields
- Fields (all text inputs):
  - `site_name` — Site name
  - `site_tagline` — Tagline
  - `contact_email` — Contact email
  - `social_instagram` — Instagram URL
  - `social_facebook` — Facebook URL
  - `social_twitter` — X / Twitter URL
  - `unsplash_access_key` — password input with show/hide toggle; displayed for convenience but server reads this from the `UNSPLASH_ACCESS_KEY` env var, not the DB. Saving this field stores it in the `settings` table as a reference; the user still needs to set it as an env var on Hostinger for the server to use it. A note in the UI clarifies: "Also set this as UNSPLASH_ACCESS_KEY in your Hostinger environment variables."
- "Save Settings" button (no autosave) — calls `PUT /api/settings` with all field values, shows success/error feedback

### AdminDashboard nav update
Add two new buttons to the existing toolbar in `AdminDashboard.jsx` (alongside Ingest / Review Queue):
- "Destinations" → `navigate('/admin/destinations')`
- "Settings" → `navigate('/admin/settings')`

---

## 5. Database Migrations (run on server startup in app.js)

```sql
-- articles: add is_featured
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0;

-- destinations: add description
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description TEXT;

-- settings table
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

MySQL does not support `ADD COLUMN IF NOT EXISTS` in older versions — wrap each `ALTER TABLE` in a try/catch that ignores error code `ER_DUP_FIELDNAME` (duplicate column).

Note: `description` may already exist on the `destinations` table (the existing `PUT /:id` handler already references it); the migration try/catch handles this safely.

### DELETE /api/destinations/:id cascade
Before deleting, null out `destination_id` on all articles that reference the destination:
```sql
UPDATE articles SET destination_id = NULL WHERE destination_id = ?;
DELETE FROM destinations WHERE id = ?;
```
Both run in sequence (no transaction needed — the null-out is safe to retry). Return `{ deleted: true }` on success.

---

## 6. File Summary

### New files
| File | Purpose |
|------|---------|
| `src/pages/AdminDestinationsList.jsx` | Destinations list page |
| `src/pages/AdminDestinationEditor.jsx` | Destination create/edit page |
| `src/pages/AdminSettingsPage.jsx` | Site settings page |
| `server/routes/settings.js` | Settings GET/PUT API |
| `server/routes/unsplash.js` | Proxied Unsplash search + download-to-server |

### Modified files
| File | Change |
|------|--------|
| `src/pages/AdminArticleEditor.jsx` | Split left pane into 2-column layout; add read_time display + autosave; add is_featured toggle calling `/feature` endpoint |
| `src/pages/AdminDashboard.jsx` | Add Destinations + Settings nav buttons to toolbar |
| `src/App.jsx` | Add routes: `/admin/destinations`, `/admin/destinations/new`, `/admin/destinations/:id`, `/admin/settings` |
| `server/routes/articles.js` | Add `is_featured` and `read_time` to PATCH allow-list; add `POST /:id/feature` endpoint with transaction |
| `server/routes/destinations.js` | Add `DELETE /:id` with requireAuth; add 409 error handling for slug conflicts on POST and PUT |
| `app.js` | Mount `/api/settings` and `/api/unsplash` routers; run DB migrations on startup |

---

## 7. Out of Scope (for now)
- Navigation editor (tab label reordering)
- Article-level location pins
- SEO meta fields
- Related articles curation
- Article cover image focal point cropping
- Footer consuming site settings (separate task once settings are in place)

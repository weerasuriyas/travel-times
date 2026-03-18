# CMS Editor UX + Destination Manager + Site Settings — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the article editor into a side-by-side body/photos layout, add a full destination CRUD manager with click-to-pin map and free Unsplash photo suggestions, add a homepage pin feature, auto-calculated read time, and a site settings page.

**Architecture:** Express backend with new `/api/settings` and `/api/unsplash` routes; MySQL migrations run on startup; React admin pages follow the existing `AdminArticleEditor` patterns (dark header, `useAuth`, debounce autosave, `apiPut`/`apiPost`/`apiDelete` from `src/lib/api.js`). No test framework exists — each task ends with a manual verification checklist.

**Tech Stack:** React 19, Vite, Tailwind CSS v4 (no `prose` class), Express, MySQL2, react-leaflet v5, lucide-react icons, Supabase JWT auth via `requireAuth` middleware.

**Spec:** `docs/superpowers/specs/2026-03-17-cms-editor-destinations-settings-design.md`

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `server/routes/settings.js` | GET/PUT settings key-value store |
| `server/routes/unsplash.js` | Proxied Unsplash search + download-to-server |
| `src/pages/AdminDestinationsList.jsx` | Destinations list/delete admin page |
| `src/pages/AdminDestinationEditor.jsx` | Destination create/edit with map + image |
| `src/pages/AdminSettingsPage.jsx` | Site settings form |

### Modified files
| File | What changes |
|------|-------------|
| `app.js` | Mount settings + unsplash routers; add DB migrations for `is_featured`, `description`, `settings` table |
| `server/routes/articles.js` | Add `is_featured`+`read_time` to PATCH; add `is_featured DESC` to list sort; add `POST /:id/feature` |
| `server/routes/destinations.js` | Add `slug` to PUT; 409 on ER_DUP_ENTRY in POST+PUT; add DELETE with cascade |
| `src/pages/AdminArticleEditor.jsx` | Split left pane 3/5 body + 2/5 photos; add read_time display; add is_featured toggle |
| `src/pages/AdminDashboard.jsx` | Add Destinations + Settings nav buttons |
| `src/App.jsx` | Add admin routes for destinations + settings |

---

## Task 1 — Backend: Articles route changes + DB migrations in app.js

**Files:**
- Modify: `server/routes/articles.js`
- Modify: `app.js`

### What to do

- [ ] **Step 1: Add `read_time` to the PATCH allow-list in `server/routes/articles.js`**

  Open `server/routes/articles.js`. Inside `router.patch('/:id', ...)`, after line 126 (`if ('destination_id' in data)`), add:
  ```js
  if (data.read_time != null) { setClauses.push('read_time = ?'); params.push(Number(data.read_time)) }
  ```

  Note: `is_featured` is NOT added to PATCH — it has its own dedicated `/feature` endpoint and must not be overwritten by autosave.

- [ ] **Step 2: Update the article list query to sort by `is_featured DESC` first — only when `status=published`**

  In `router.get('/:id?', ...)`, replace:
  ```js
  // BEFORE (line ~20-26):
  const { status, destination_id } = req.query
  let sql = 'SELECT * FROM articles WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (destination_id) { sql += ' AND destination_id = ?'; params.push(destination_id) }
  sql += ' ORDER BY created_at DESC'
  ```
  with:
  ```js
  const { status, destination_id } = req.query
  let sql = 'SELECT * FROM articles WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (destination_id) { sql += ' AND destination_id = ?'; params.push(destination_id) }
  if (status === 'published') {
    sql += ' ORDER BY is_featured DESC, created_at DESC'
  } else {
    sql += ' ORDER BY created_at DESC'
  }
  ```

- [ ] **Step 3: Add `POST /:id/feature` endpoint for atomic homepage pin**

  Add this new route to `server/routes/articles.js` **before** the `router.delete` at line 141:
  ```js
  router.post('/:id/feature', requireAuth, async (req, res) => {
    const db = getDb()
    const { id } = req.params
    const featured = !!req.body.featured
    try {
      const conn = await db.getConnection()
      try {
        await conn.beginTransaction()
        await conn.query('UPDATE articles SET is_featured = 0')
        if (featured) {
          await conn.query('UPDATE articles SET is_featured = 1 WHERE id = ?', [id])
        }
        await conn.commit()
      } catch (err) {
        await conn.rollback()
        throw err
      } finally {
        conn.release()
      }
      res.json({ ok: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
  ```

- [ ] **Step 4: Add DB migrations to `app.js`**

  Add a new `async function runMigrations()` in `app.js` after the existing seed functions (around line 208), then call it from the `app.listen` callback:

  ```js
  async function runMigrations() {
    const db = getDb()
    const migrations = [
      `ALTER TABLE articles ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0`,
      `ALTER TABLE destinations ADD COLUMN description TEXT`,
      `CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`value\` TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    ]
    for (const sql of migrations) {
      try {
        await db.query(sql)
      } catch (err) {
        // Ignore "Duplicate column name" — migration already applied
        if (err.code !== 'ER_DUP_FIELDNAME') console.error('Migration error:', err.message)
      }
    }
    console.log('DB migrations done')
  }
  ```

  Change the `app.listen` callback at line 209 to chain migrations before seeds (ensures columns exist before insert):
  ```js
  app.listen(PORT, () => {
    runMigrations()
      .then(() => seedDestinations())
      .then(() => seedKandyPerahera())
      .catch(err => console.error('Startup error:', err.message))
  })
  ```

- [ ] **Step 5: Manual verification**

  Start the server: `node app.js`
  - Confirm "DB migrations done" appears in the console with no errors
  - Hit `GET /api/health` — should return 200 with no crash
  - Confirm the `is_featured` column exists: connect to MySQL and run `DESCRIBE articles` — should show `is_featured` column

- [ ] **Step 6: Commit**
  ```bash
  git add server/routes/articles.js app.js
  git commit -m "feat: add is_featured/read_time to articles, feature endpoint, DB migrations"
  ```

---

## Task 2 — Backend: Destinations route changes

**Files:**
- Modify: `server/routes/destinations.js`

### What to do

- [ ] **Step 1: Add 409 error handling + slug to POST**

  In `router.post('/', ...)`, wrap the catch:
  ```js
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already in use' })
    res.status(500).json({ error: err.message })
  }
  ```

- [ ] **Step 2: Add `slug` to the PUT query + 409 handling**

  Replace the entire `router.put('/:id', ...)` with:
  ```js
  router.put('/:id', requireAuth, async (req, res) => {
    const db = getDb()
    const { id } = req.params
    const data = req.body
    try {
      await db.query(
        `UPDATE destinations SET
          slug=?, name=?, tagline=?, description=?, hero_image=?, lat=?, lng=?,
          region=?, highlights=?, stats=?, status=?
         WHERE id=?`,
        [
          data.slug, data.name, data.tagline ?? null, data.description ?? null,
          data.hero_image ?? null, data.lat ?? null, data.lng ?? null,
          data.region ?? null, JSON.stringify(data.highlights ?? []),
          JSON.stringify(data.stats ?? null), data.status ?? 'published',
          id,
        ]
      )
      res.json({ updated: true })
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug already in use' })
      res.status(500).json({ error: err.message })
    }
  })
  ```

- [ ] **Step 3: Add DELETE with cascade**

  Add this route after the `router.put`:
  ```js
  router.delete('/:id', requireAuth, async (req, res) => {
    const db = getDb()
    const { id } = req.params
    try {
      await db.query('UPDATE articles SET destination_id = NULL WHERE destination_id = ?', [id])
      await db.query('DELETE FROM destinations WHERE id = ?', [id])
      res.json({ deleted: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
  ```

- [ ] **Step 4: Manual verification**

  With the server running, use curl or the browser:
  - `curl -X POST /api/destinations` (no auth) → should return 401
  - `curl /api/destinations` → should return array of destinations

- [ ] **Step 5: Commit**
  ```bash
  git add server/routes/destinations.js
  git commit -m "feat: add slug to destinations PUT, DELETE cascade, 409 slug conflict"
  ```

---

## Task 3 — Backend: Settings API + Unsplash proxy + app.js mounts

**Files:**
- Create: `server/routes/settings.js`
- Create: `server/routes/unsplash.js`
- Modify: `app.js`

### What to do

- [ ] **Step 1: Create `server/routes/settings.js`**

  ```js
  import { Router } from 'express'
  import { getDb } from '../db.js'
  import { requireAuth } from '../auth.js'

  const router = Router()

  router.get('/', async (_req, res) => {
    const db = getDb()
    try {
      const [rows] = await db.query('SELECT `key`, value FROM settings')
      const obj = Object.fromEntries(rows.map(r => [r.key, r.value]))
      res.json(obj)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/', requireAuth, async (req, res) => {
    const db = getDb()
    const data = req.body
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Invalid body' })
    try {
      for (const [key, value] of Object.entries(data)) {
        await db.query(
          'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
          [key, value ?? null]
        )
      }
      res.json({ ok: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  export default router
  ```

- [ ] **Step 2: Create `server/routes/unsplash.js`**

  ```js
  import { Router } from 'express'
  import { requireAuth } from '../auth.js'
  import { getDb } from '../db.js'
  import { writeFile, unlink, mkdir } from 'fs/promises'
  import { join } from 'path'

  const router = Router()

  router.get('/search', requireAuth, async (req, res) => {
    const key = process.env.UNSPLASH_ACCESS_KEY
    if (!key) return res.status(503).json({ error: 'UNSPLASH_ACCESS_KEY not configured' })
    const q = req.query.q || 'Sri Lanka'
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=9&orientation=landscape&client_id=${key}`
      const r = await fetch(url)
      if (!r.ok) throw new Error(`Unsplash API error: ${r.status}`)
      const data = await r.json()
      const results = (data.results || []).map(p => ({
        id: p.id,
        thumb_url: p.urls.small,
        regular_url: p.urls.regular,
        photographer_name: p.user.name,
        photographer_url: p.user.links.html,
      }))
      res.json(results)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/download', requireAuth, async (req, res) => {
    const { id, regular_url, photographer_name, photographer_url, destination_id } = req.body
    if (!id || !regular_url || !destination_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const uploadDir = (process.env.API_UPLOAD_DIR || '').replace(/\/$/, '')
    const uploadUrl = (process.env.API_UPLOAD_URL || '').replace(/\/$/, '')
    if (!uploadDir || !uploadUrl) {
      return res.status(503).json({ error: 'Upload directory not configured' })
    }

    const destDir = join(uploadDir, 'destination')
    const filename = `unsplash-${id}.jpg`
    const filepath = join(destDir, filename)
    const publicUrl = `${uploadUrl}/destination/${filename}`

    try {
      await mkdir(destDir, { recursive: true })

      // Download image
      const imgRes = await fetch(regular_url)
      if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`)
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      await writeFile(filepath, buffer)

      // Insert image record
      const db = getDb()
      const altText = `Photo by ${photographer_name} (${photographer_url}) on Unsplash`
      const [result] = await db.query(
        'INSERT INTO images (filename, url, alt_text, role, entity_type, entity_id) VALUES (?,?,?,?,?,?)',
        [filename, publicUrl, altText, 'hero', 'destination', destination_id]
      )

      // Update destination hero_image
      await db.query('UPDATE destinations SET hero_image = ? WHERE id = ?', [publicUrl, destination_id])

      res.json({ url: publicUrl, image_id: result.insertId })
    } catch (err) {
      // Clean up partial file on failure
      unlink(filepath).catch(() => {})
      res.status(500).json({ error: err.message })
    }
  })

  export default router
  ```
  _(make sure `export default router` is the last line inside the code block above)_

- [ ] **Step 3: Mount new routers in `app.js`**

  Add these imports near the top of `app.js` (alongside the existing router imports):
  ```js
  import settingsRouter from './server/routes/settings.js'
  import unsplashRouter from './server/routes/unsplash.js'
  ```

  Add the mounts after the existing `app.use('/api/staging', stagingRouter)` line:
  ```js
  app.use('/api/settings', settingsRouter)
  app.use('/api/unsplash', unsplashRouter)
  ```

- [ ] **Step 4: Manual verification**

  Start the server. Test:
  - `curl http://localhost:3000/api/settings` → returns `{}`  (empty, no rows yet)
  - `curl -X PUT http://localhost:3000/api/settings -H "Content-Type: application/json" -d '{"site_name":"Test"}' -H "Authorization: Bearer <token>"` → returns `{ ok: true }`
  - `curl http://localhost:3000/api/settings` → returns `{ "site_name": "Test" }`
  - `curl http://localhost:3000/api/unsplash/search?q=Kandy` (no auth) → returns 401

- [ ] **Step 5: Commit**
  ```bash
  git add server/routes/settings.js server/routes/unsplash.js app.js
  git commit -m "feat: add settings API, Unsplash proxy, mount routers in app.js"
  ```

---

## Task 4 — Frontend: Article editor layout overhaul

**Files:**
- Modify: `src/pages/AdminArticleEditor.jsx`

### What to do

This task restructures the left editor pane from a single scrollable column into two side-by-side columns: left column (fields + body) and right column (photos). Also adds read_time display and is_featured toggle.

- [ ] **Step 1: Add `read_time` to the `fields` state; add `isFeatured` as separate state**

  `is_featured` must NOT be in `fields`/`fieldsRef` (autosave must never overwrite it). Track it separately.

  In `AdminArticleEditor.jsx`, change the `fields` state initializer (line 39–42):
  ```js
  const [fields, setFields] = useState({
    title: '', subtitle: '', body: '', category: '', tags: '',
    author_name: '', status: 'draft', destination_id: '', cover_image: '',
    read_time: 1,
  })
  ```

  Add a separate state for the pin (after the `fields` useState line):
  ```js
  const [isFeatured, setIsFeatured] = useState(false)
  ```

  In `loadArticle`, add to the `loaded` object (after `cover_image`):
  ```js
  read_time: Number(data.read_time) || 1,
  ```

  Also in `loadArticle`, after `setFields(loaded)` and `fieldsRef.current = loaded`, add:
  ```js
  setIsFeatured(!!data.is_featured)
  ```

- [ ] **Step 2: Add computed read_time update to `updateField`**

  In `updateField`, after `const next = { ...fieldsRef.current, [key]: value }`, add:
  ```js
  if (key === 'body') {
    const words = value.trim().split(/\s+/).filter(Boolean).length
    next.read_time = Math.max(1, Math.ceil(words / 200))
  }
  ```

- [ ] **Step 3: Add is_featured toggle handler**

  Add `apiPost` to the import at the top:
  ```js
  import { apiDelete, apiGet, apiGetAuth, apiPatch, apiPost, apiUploadImage } from '../lib/api'
  ```

  Add a new function after `handleSignOut`:
  ```js
  const handleFeatureToggle = async () => {
    const newVal = !isFeatured
    setIsFeatured(newVal)  // optimistic
    try {
      await apiPost(`articles/${id}/feature`, { featured: newVal })
    } catch (err) {
      setIsFeatured(!newVal)  // revert on failure
      setError(err.message || 'Failed to update featured status')
    }
  }
  ```

- [ ] **Step 4: Restructure the editor pane JSX**

  Find the editor pane div starting at line 244:
  ```jsx
  {/* ── Editor pane ─────────────────────────────────────────── */}
  <div className="w-full md:w-1/2 overflow-y-auto bg-[#F5F5F3]">
    <div className="p-5 flex flex-col gap-4 max-w-2xl mx-auto pb-16">
  ```

  Replace the entire editor pane (everything from that div down to the closing `</div>` before `{/* ── Preview pane */}`) with:

  ```jsx
  {/* ── Editor pane ─────────────────────────────────────────── */}
  <div className="w-full md:w-1/2 flex overflow-hidden bg-[#F5F5F3]">

    {/* Left column — fields + body */}
    <div className="flex-[3] overflow-y-auto p-5 flex flex-col gap-4 min-w-0">

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <X size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Article info ─────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-50">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Article Info</p>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Field label="Title">
            <input
              value={fields.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="Give this story a title…"
              className={inputCls + " text-base font-semibold"}
            />
          </Field>

          <Field label="Subtitle">
            <input
              value={fields.subtitle}
              onChange={e => updateField('subtitle', e.target.value)}
              placeholder="A short teaser or opening deck…"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input
                value={fields.category}
                onChange={e => updateField('category', e.target.value)}
                placeholder="Travel, Culture…"
                className={inputCls}
              />
            </Field>
            <Field label="Author">
              <input
                value={fields.author_name}
                onChange={e => updateField('author_name', e.target.value)}
                placeholder="Editorial Team"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Tags" hint="comma separated">
            <input
              value={fields.tags}
              onChange={e => updateField('tags', e.target.value)}
              placeholder="kandy, history, festival"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={fields.status}
                onChange={e => updateField('status', e.target.value)}
                className={inputCls}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Destination">
              <select
                value={fields.destination_id}
                onChange={e => updateField('destination_id', e.target.value || null)}
                className={inputCls}
              >
                <option value="">— None —</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* is_featured toggle */}
          <button
            type="button"
            onClick={handleFeatureToggle}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
              isFeatured
                ? 'border-[#FFD600] bg-[#FFD600]/10 text-stone-900'
                : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300'
            }`}
          >
            <span className="text-lg">{isFeatured ? '📌' : '📍'}</span>
            <div className="text-left">
              <p>{isFeatured ? 'Pinned to homepage hero' : 'Pin to homepage hero'}</p>
              {isFeatured && <p className="text-xs font-normal text-stone-500 mt-0.5">This article appears first on the homepage</p>}
            </div>
          </button>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-5 py-3 border-b border-stone-50 flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Story Body</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-stone-400">~{fields.read_time} min read</span>
            <p className="text-[10px] text-stone-400">
              Start a line with <code className="bg-stone-100 px-1 rounded">"quote"</code> for pull quotes
            </p>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1 min-h-0">
          <textarea
            ref={bodyRef}
            value={fields.body}
            onChange={e => updateField('body', e.target.value)}
            onBlur={e => { cursorPosRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd } }}
            placeholder="Write your story here…&#10;&#10;Double-line break creates a new paragraph."
            className="w-full flex-1 min-h-[400px] bg-stone-50 border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-mono leading-[1.8] text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] resize-none transition-colors"
          />
        </div>
      </section>

    </div>

    {/* Right column — photos */}
    <div className="flex-[2] overflow-y-auto border-l border-stone-200 p-5 flex flex-col gap-4 min-w-0">
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Photos</p>
          {articleImages.length > 0 && (
            <span className="text-[10px] text-stone-400">
              {articleImages.length} photo{articleImages.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col gap-4">

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragEnter={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-7 transition-all cursor-pointer select-none ${
              isDragOver
                ? 'border-[#00E676] bg-[#00E676]/5'
                : uploading
                ? 'border-stone-200 bg-stone-50 cursor-default'
                : 'border-stone-200 hover:border-[#00E676]/50 bg-stone-50 hover:bg-[#00E676]/[0.03]'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 size={22} className="animate-spin text-[#00E676]" />
                <p className="text-xs font-semibold text-stone-500">Uploading…</p>
              </>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-[#00E676]/20' : 'bg-stone-100'}`}>
                  <CloudUpload size={18} className={isDragOver ? 'text-[#00E676]' : 'text-stone-400'} />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${isDragOver ? 'text-[#00E676]' : 'text-stone-600'}`}>
                    {isDragOver ? 'Release to upload' : 'Drag & drop or click'}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">JPG, PNG, WEBP · 10 MB max</p>
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            />
          </div>

          {/* Photo grid */}
          {articleImages.length > 0 && (
            <div>
              <p className="text-[10px] text-stone-400 mb-2">
                Hover to set cover, insert, or delete
              </p>
              <div className="grid grid-cols-2 gap-2">
                {articleImages.map(img => {
                  const placed = fields.body.includes(`[[image:${img.id}]]`)
                  const isCover = fields.cover_image === img.url
                  return (
                    <div
                      key={img.id}
                      className={`group relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all ${
                        isCover
                          ? 'border-[#FFD600] shadow-lg shadow-[#FFD600]/20'
                          : placed
                          ? 'border-[#00E676] shadow-md shadow-[#00E676]/15'
                          : 'border-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-cover" loading="lazy" />

                      {isCover && (
                        <div className="absolute top-1 left-1 flex items-center gap-1 bg-[#FFD600] rounded-full px-1.5 py-0.5">
                          <Star size={7} className="text-stone-900 fill-stone-900" />
                          <span className="text-[7px] font-black text-stone-900">COVER</span>
                        </div>
                      )}
                      {placed && !isCover && (
                        <div className="absolute top-1 left-1 bg-[#00E676] rounded-full px-1.5 py-0.5">
                          <span className="text-[7px] font-black text-stone-900">IN BODY</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                        <button
                          type="button"
                          onClick={() => updateField('cover_image', isCover ? '' : img.url)}
                          className={`w-full py-1 rounded-lg text-[9px] font-bold transition-colors ${
                            isCover
                              ? 'bg-[#FFD600] text-stone-900'
                              : 'bg-white/10 text-white hover:bg-[#FFD600] hover:text-stone-900 border border-white/20'
                          }`}
                        >
                          {isCover ? '★ Cover set' : '★ Set cover'}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertImageAtCursor(img.id)}
                          className="w-full py-1 rounded-lg text-[9px] font-bold bg-white/10 text-white hover:bg-white hover:text-stone-900 border border-white/20 transition-colors"
                        >
                          + Insert in body
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition-colors border border-white/20"
                        >
                          <Trash2 size={9} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>

  </div>
  ```

- [ ] **Step 5: Manual verification**

  Open the article editor (`/admin/articles/:id`). Verify:
  - Left pane is split: fields+body on the left, photos on the right, both visible simultaneously
  - Typing in the body shows "~N min read" updating in the section header
  - The "Pin to homepage hero" toggle appears in Article Info; clicking it changes state immediately
  - Uploading a photo shows in the right-side grid without needing to scroll

- [ ] **Step 6: Commit**
  ```bash
  git add src/pages/AdminArticleEditor.jsx
  git commit -m "feat: split article editor into side-by-side body+photos, add read_time and pin toggle"
  ```

---

## Task 5 — Frontend: AdminDestinationsList + App.jsx + Dashboard nav

**Files:**
- Create: `src/pages/AdminDestinationsList.jsx`
- Modify: `src/App.jsx`
- Modify: `src/pages/AdminDashboard.jsx`

### What to do

- [ ] **Step 1: Create `src/pages/AdminDestinationsList.jsx`**

  ```jsx
  import { useCallback, useEffect, useState } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { Plus, Edit, Trash2, MapPin, LogOut, Loader2, ArrowLeft } from 'lucide-react'
  import { useAuth } from '../contexts/AuthContext'
  import { apiGet, apiDelete } from '../lib/api'

  export default function AdminDestinationsList() {
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const [destinations, setDestinations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const load = useCallback(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await apiGet('destinations')
        setDestinations(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Failed to load destinations')
      } finally {
        setLoading(false)
      }
    }, [])

    useEffect(() => { load() }, [load])

    const handleDelete = async (dest) => {
      if (!window.confirm(`Delete "${dest.name}"? This cannot be undone.`)) return
      try {
        await apiDelete(`destinations/${dest.id}`)
        setDestinations(prev => prev.filter(d => d.id !== dest.id))
      } catch (err) {
        setError(err.message || 'Delete failed')
      }
    }

    const handleSignOut = async () => {
      try { await signOut(); navigate('/') } catch (err) { console.error(err) }
    }

    return (
      <div className="min-h-screen flex flex-col bg-[#111111]">
        <header className="flex-shrink-0 h-13 px-5 flex items-center justify-between border-b border-white/[0.07] bg-[#111111]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-300 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Admin</span>
            </button>
            <span className="text-stone-700 text-xs">/</span>
            <span className="text-sm text-stone-200 font-medium">Destinations</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/destinations/new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
            >
              <Plus size={14} />
              New Destination
            </button>
            <button onClick={handleSignOut} className="text-stone-600 hover:text-red-400 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-6">
          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-[#00E676]" size={28} />
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Destination</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Region</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Map Pin</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Hero Image</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {destinations.map(dest => (
                    <tr key={dest.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-100">{dest.name}</p>
                          <p className="text-[11px] text-stone-500">{dest.slug}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-stone-400">{dest.region || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          dest.status === 'published' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-stone-700 text-stone-400'
                        }`}>
                          {dest.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {dest.lat && dest.lng
                          ? <span className="flex items-center gap-1 text-[#00E676] text-xs"><MapPin size={11} /> Set</span>
                          : <span className="text-stone-600 text-xs">—</span>
                        }
                      </td>
                      <td className="px-5 py-3">
                        {dest.hero_image
                          ? <img src={dest.hero_image} alt="" className="w-8 h-8 rounded object-cover" />
                          : <span className="text-stone-600 text-xs">—</span>
                        }
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/destinations/${dest.id}`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-500 hover:text-stone-200 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(dest)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-stone-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && destinations.length === 0 && (
                <p className="text-center py-12 text-stone-500 text-sm">No destinations yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Add new routes to `src/App.jsx`**

  Add lazy imports after the existing admin imports (around line 23):
  ```js
  const AdminDestinationsList = lazy(() => import('./pages/AdminDestinationsList'))
  const AdminDestinationEditor = lazy(() => import('./pages/AdminDestinationEditor'))
  const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'))
  ```

  Add routes inside the admin `<Routes>` section (after the existing staging route):
  ```jsx
  <Route path="/admin/destinations" element={
    <ProtectedRoute>
      <AdminDestinationsList />
    </ProtectedRoute>
  } />
  <Route path="/admin/destinations/new" element={
    <ProtectedRoute>
      <AdminDestinationEditor />
    </ProtectedRoute>
  } />
  <Route path="/admin/destinations/:id" element={
    <ProtectedRoute>
      <AdminDestinationEditor />
    </ProtectedRoute>
  } />
  <Route path="/admin/settings" element={
    <ProtectedRoute>
      <AdminSettingsPage />
    </ProtectedRoute>
  } />
  ```

- [ ] **Step 3: Add nav buttons to `AdminDashboard.jsx`**

  In `AdminDashboard.jsx`, find the toolbar button row (around line 211 with the existing Ingest and Review Queue buttons). Add two new buttons **before** the Ingest button:
  ```jsx
  <button
    onClick={() => navigate('/admin/destinations')}
    className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-all text-sm"
  >
    <MapPin size={16} />
    Destinations
  </button>
  <button
    onClick={() => navigate('/admin/settings')}
    className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-all text-sm"
  >
    <Settings size={16} />
    Settings
  </button>
  ```

  Add `MapPin, Settings` to the lucide-react import at line 3 of `AdminDashboard.jsx`.

- [ ] **Step 4: Manual verification**

  - Navigate to `/admin` — confirm Destinations and Settings buttons appear in toolbar
  - Click Destinations → loads `/admin/destinations`, shows list of seeded destinations
  - Click edit icon on a destination → navigates to `/admin/destinations/:id` (page will 404 until Task 6 is done, but the route should not crash)

- [ ] **Step 5: Commit**
  ```bash
  git add src/pages/AdminDestinationsList.jsx src/App.jsx src/pages/AdminDashboard.jsx
  git commit -m "feat: add AdminDestinationsList, register admin routes, add nav buttons"
  ```

---

## Task 6 — Frontend: AdminDestinationEditor

**Files:**
- Create: `src/pages/AdminDestinationEditor.jsx`

This is the largest component. It handles create/edit mode, click-to-pin Leaflet map, image upload, and Unsplash suggestions.

### What to do

- [ ] **Step 1: Create `src/pages/AdminDestinationEditor.jsx`**

  ```jsx
  import 'leaflet/dist/leaflet.css'
  import { useCallback, useEffect, useRef, useState } from 'react'
  import { useNavigate, useParams } from 'react-router-dom'
  import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
  import L from 'leaflet'
  import { ArrowLeft, CloudUpload, Loader2, LogOut, X, Search, CheckCircle2 } from 'lucide-react'
  import { useAuth } from '../contexts/AuthContext'
  import { apiGet, apiGetAuth, apiPost, apiPut, apiUploadImage } from '../lib/api'

  const REGIONS = ['Western', 'Central', 'Southern', 'Uva', 'North Central', 'Eastern', 'Northern']

  const EMPTY = {
    name: '', slug: '', region: '', tagline: '', description: '',
    status: 'published', lat: null, lng: null, hero_image: null,
    highlights: [], stats: null,
  }

  const markerIcon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:#00E676;border:3px solid white;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  })

  function MapClickHandler({ onMapClick }) {
    useMapEvents({ click: (e) => onMapClick(e.latlng) })
    return null
  }

  const inputCls = "w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors"

  function Field({ label, hint, error, children }) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</label>
          {hint && <span className="text-[10px] text-stone-600 normal-case">{hint}</span>}
        </div>
        {children}
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>
    )
  }

  export default function AdminDestinationEditor() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const isNew = !id || id === 'new'

    const [fields, setFields] = useState(EMPTY)
    const [slugError, setSlugError] = useState('')
    const [saveStatus, setSaveStatus] = useState('saved')
    const [loading, setLoading] = useState(!isNew)
    const [error, setError] = useState('')
    const [heroTab, setHeroTab] = useState('upload')
    const [unsplashQuery, setUnsplashQuery] = useState('')
    const [unsplashResults, setUnsplashResults] = useState([])
    const [unsplashLoading, setUnsplashLoading] = useState(false)
    const [unsplashError, setUnsplashError] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)

    const debounceRef = useRef(null)
    const fieldsRef = useRef(fields)
    const fileInputRef = useRef(null)

    // Load existing destination
    const loadDest = useCallback(async () => {
      if (isNew) return
      setLoading(true)
      try {
        const data = await apiGetAuth(`destinations/${id}`)
        if (data?.error) { setError(data.error); return }
        const loaded = {
          name: data.name || '',
          slug: data.slug || '',
          region: data.region || '',
          tagline: data.tagline || '',
          description: data.description || '',
          status: data.status || 'published',
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          hero_image: data.hero_image ?? null,
          highlights: data.highlights ?? [],
          stats: data.stats ?? null,
        }
        setFields(loaded)
        fieldsRef.current = loaded
        setUnsplashQuery(`${data.name} Sri Lanka`)
      } catch (err) {
        setError(err.message || 'Failed to load destination')
      } finally {
        setLoading(false)
      }
    }, [id, isNew])

    useEffect(() => { loadDest() }, [loadDest])

    // Autosave (edit mode only)
    const updateField = (key, value) => {
      const next = { ...fieldsRef.current, [key]: value }
      setFields(next)
      fieldsRef.current = next
      if (isNew) return
      setSaveStatus('saving')
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          await apiPut(`destinations/${id}`, fieldsRef.current)
          setSaveStatus('saved')
        } catch (err) {
          setSaveStatus('error')
          setError(err.message || 'Save failed')
        }
      }, 800)
    }

    // Slug blur save (edit mode only — avoids autosave mid-type)
    const handleSlugBlur = async (slug) => {
      if (isNew) return
      setSlugError('')
      try {
        await apiPut(`destinations/${id}`, { ...fieldsRef.current, slug })
        setSaveStatus('saved')
      } catch (err) {
        if (err.message.includes('Slug already in use')) {
          setSlugError('This slug is already taken — please choose a different one.')
        } else {
          setError(err.message || 'Save failed')
        }
        setSaveStatus('error')
      }
    }

    // Map click — update both lat+lng atomically to avoid partial state
    const handleMapClick = ({ lat, lng }) => {
      const next = { ...fieldsRef.current, lat, lng }
      setFields(next)
      fieldsRef.current = next
      if (!isNew) {
        setSaveStatus('saving')
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
          try {
            await apiPut(`destinations/${id}`, fieldsRef.current)
            setSaveStatus('saved')
          } catch (err) {
            setSaveStatus('error')
          }
        }, 800)
      }
    }

    // Image upload
    const handleFiles = async (files) => {
      if (isNew) return
      const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
      if (!arr.length) return
      setUploading(true)
      setError('')
      try {
        const result = await apiUploadImage(arr[0], 'destination', id, 'hero', '')
        updateField('hero_image', result.url)
      } catch (err) {
        setError(err.message || 'Upload failed')
      } finally {
        setUploading(false)
      }
    }

    // Unsplash search
    const handleUnsplashSearch = async () => {
      if (!unsplashQuery.trim()) return
      setUnsplashLoading(true)
      setUnsplashError('')
      setUnsplashResults([])
      try {
        const data = await apiGetAuth(`unsplash/search?q=${encodeURIComponent(unsplashQuery)}`)
        if (data?.error) throw new Error(data.error)
        setUnsplashResults(Array.isArray(data) ? data : [])
      } catch (err) {
        setUnsplashError(err.message || 'Search failed')
      } finally {
        setUnsplashLoading(false)
      }
    }

    // Unsplash download + set as hero
    const handleUnsplashSelect = async (photo) => {
      setUploading(true)
      setError('')
      try {
        const result = await apiPost('unsplash/download', {
          id: photo.id,
          regular_url: photo.regular_url,
          photographer_name: photo.photographer_name,
          photographer_url: photo.photographer_url,
          destination_id: id,
        })
        updateField('hero_image', result.url)
      } catch (err) {
        setError(err.message || 'Failed to download photo')
      } finally {
        setUploading(false)
      }
    }

    // Create destination (new mode)
    const handleCreate = async () => {
      if (!fields.name.trim()) { setError('Name is required'); return }
      setError('')
      try {
        const result = await apiPost('destinations', {
          ...fields,
          slug: fields.slug || fields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        })
        navigate(`/admin/destinations/${result.id}`)
      } catch (err) {
        if (err.message.includes('Slug already in use')) {
          setSlugError('This slug is already taken — please choose a different one.')
        } else {
          setError(err.message || 'Create failed')
        }
      }
    }

    const handleSignOut = async () => {
      try { await signOut(); navigate('/') } catch (err) { console.error(err) }
    }

    const statusBadgeCls = fields.status === 'published'
      ? 'bg-[#00E676]/10 text-[#00C853] border-[#00E676]/30'
      : 'bg-stone-800 text-stone-400 border-stone-700'

    const hasPin = fields.lat != null && fields.lng != null
    const mapCenter = hasPin ? [fields.lat, fields.lng] : [7.8731, 80.7718]

    if (loading) return (
      <div className="h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#00E676]" size={28} />
      </div>
    )

    return (
      <div className="min-h-screen flex flex-col bg-[#111111]">
        {/* Header */}
        <header className="flex-shrink-0 h-13 px-5 flex items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/admin/destinations')}
              className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-300 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Destinations</span>
            </button>
            <span className="text-stone-700 text-xs">/</span>
            <span className="text-sm text-stone-200 font-medium truncate max-w-[220px]">
              {isNew ? 'New Destination' : (fields.name || 'Untitled')}
            </span>
            {!isNew && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeCls}`}>
                {fields.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-5">
            {!isNew && saveStatus === 'saving' && <span className="flex items-center gap-1.5 text-xs text-stone-500"><Loader2 size={11} className="animate-spin" /> Saving…</span>}
            {!isNew && saveStatus === 'saved' && <span className="flex items-center gap-1.5 text-xs text-[#00E676]/70"><CheckCircle2 size={11} /> Saved</span>}
            {!isNew && saveStatus === 'error' && <span className="flex items-center gap-1.5 text-xs text-red-400"><X size={11} /> Save error</span>}
            <button onClick={handleSignOut} className="text-stone-600 hover:text-red-400 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 flex flex-col gap-5 pb-16">

            {error && (
              <div className="flex items-start gap-2.5 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
                <X size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Basic fields */}
            <section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Destination Info</p>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <Field label="Name">
                  <input
                    value={fields.name}
                    onChange={e => {
                      const name = e.target.value
                      if (isNew) {
                        const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                        setFields(f => ({ ...f, name, slug: autoSlug }))
                        fieldsRef.current = { ...fieldsRef.current, name, slug: autoSlug }
                      } else {
                        updateField('name', name)
                      }
                    }}
                    placeholder="Kandy"
                    className={inputCls}
                  />
                </Field>

                <Field label="Slug" error={slugError}>
                  <input
                    value={fields.slug}
                    onChange={e => {
                      // Update local state only — DO NOT call updateField (would autosave mid-type)
                      setSlugError('')
                      const next = { ...fieldsRef.current, slug: e.target.value }
                      setFields(next)
                      fieldsRef.current = next
                    }}
                    onBlur={e => handleSlugBlur(e.target.value)}
                    placeholder="kandy"
                    className={inputCls + (slugError ? ' border-red-500' : '')}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Region">
                    <select value={fields.region} onChange={e => updateField('region', e.target.value)} className={inputCls}>
                      <option value="">— Select —</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select value={fields.status} onChange={e => updateField('status', e.target.value)} className={inputCls}>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </Field>
                </div>

                <Field label="Tagline" hint="short descriptor">
                  <input
                    value={fields.tagline}
                    onChange={e => updateField('tagline', e.target.value)}
                    placeholder="City of the Sacred Tooth Relic"
                    className={inputCls}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={fields.description}
                    onChange={e => updateField('description', e.target.value)}
                    placeholder="Longer description of this destination…"
                    rows={4}
                    className={inputCls + " resize-none leading-relaxed"}
                  />
                </Field>
              </div>
            </section>

            {/* Map */}
            <section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Map Location</p>
                {hasPin && (
                  <button
                    onClick={() => {
                      const next = { ...fieldsRef.current, lat: null, lng: null }
                      setFields(next); fieldsRef.current = next
                      if (!isNew) apiPut(`destinations/${id}`, next).catch(() => {})
                    }}
                    className="text-[10px] text-stone-500 hover:text-red-400 transition-colors"
                  >
                    Clear pin
                  </button>
                )}
              </div>
              <div className="p-0 overflow-hidden rounded-b-2xl" style={{ height: 320 }}>
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                  center={mapCenter}
                  zoom={hasPin ? 10 : 7}
                  style={{ width: '100%', height: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    subdomains="abcd"
                    maxZoom={19}
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {hasPin && (
                    <Marker
                      position={[fields.lat, fields.lng]}
                      icon={markerIcon}
                      draggable
                      eventHandlers={{ dragend: (e) => handleMapClick(e.target.getLatLng()) }}
                    />
                  )}
                </MapContainer>
              </div>
              {hasPin ? (
                <div className="px-5 py-2 flex items-center gap-2 text-xs text-stone-400 border-t border-white/5">
                  <span className="text-[#00E676]">●</span>
                  Lat {fields.lat?.toFixed(4)}, Lng {fields.lng?.toFixed(4)}
                  <span className="text-stone-600 ml-1">— click map or drag marker to reposition</span>
                </div>
              ) : (
                <div className="px-5 py-2 text-xs text-stone-500 border-t border-white/5">
                  Click anywhere on the map to drop a pin
                </div>
              )}
            </section>

            {/* Hero image */}
            <section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Hero Image</p>
              </div>
              <div className="p-5">
                {/* Current hero preview */}
                {fields.hero_image && (
                  <div className="mb-4 relative rounded-xl overflow-hidden aspect-[16/7]">
                    <img src={fields.hero_image} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => updateField('hero_image', null)}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  {['upload', 'suggest'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setHeroTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                        heroTab === tab
                          ? 'bg-[#00E676] text-stone-950'
                          : 'bg-white/5 text-stone-500 hover:bg-white/10 hover:text-stone-300'
                      }`}
                    >
                      {tab === 'upload' ? 'Upload' : 'Suggest (Free)'}
                    </button>
                  ))}
                </div>

                {heroTab === 'upload' && (
                  isNew ? (
                    <p className="text-xs text-stone-500 py-4 text-center">Save the destination first to upload images.</p>
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                      onDragEnter={e => { e.preventDefault(); setIsDragOver(true) }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-8 transition-all cursor-pointer ${
                        isDragOver ? 'border-[#00E676] bg-[#00E676]/5' : 'border-white/10 hover:border-[#00E676]/40 bg-white/[0.02]'
                      }`}
                    >
                      {uploading
                        ? <><Loader2 size={22} className="animate-spin text-[#00E676]" /><p className="text-xs text-stone-500">Uploading…</p></>
                        : <><CloudUpload size={22} className="text-stone-500" /><p className="text-sm text-stone-400">Drag & drop or click to upload</p></>
                      }
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
                    </div>
                  )
                )}

                {heroTab === 'suggest' && (
                  isNew ? (
                    <p className="text-xs text-stone-500 py-4 text-center">Save the destination first to use photo suggestions.</p>
                  ) : (
                    <div>
                      <div className="flex gap-2 mb-4">
                        <input
                          value={unsplashQuery}
                          onChange={e => setUnsplashQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleUnsplashSearch()}
                          placeholder="e.g. Kandy Sri Lanka"
                          className={inputCls + " flex-1"}
                        />
                        <button
                          onClick={handleUnsplashSearch}
                          disabled={unsplashLoading}
                          className="px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          {unsplashLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        </button>
                      </div>

                      {unsplashError && (
                        <p className="text-xs text-red-400 mb-3">
                          {unsplashError.includes('not configured')
                            ? 'Add your Unsplash API key in Site Settings to use this feature.'
                            : unsplashError}
                        </p>
                      )}

                      {uploading && (
                        <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
                          <Loader2 size={12} className="animate-spin" /> Downloading photo to server…
                        </div>
                      )}

                      {unsplashResults.length > 0 && (
                        <div>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {unsplashResults.map(photo => (
                              <button
                                key={photo.id}
                                onClick={() => handleUnsplashSelect(photo)}
                                disabled={uploading}
                                className="relative group aspect-[4/3] rounded-xl overflow-hidden border-2 border-transparent hover:border-[#00E676] transition-all disabled:opacity-50"
                              >
                                <img src={photo.thumb_url} alt={`Photo by ${photo.photographer_name}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                  <span className="text-[9px] text-white/80 leading-tight">{photo.photographer_name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-stone-600">Photos from Unsplash — free to use with attribution</p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Create button (new mode only) */}
            {isNew && (
              <button
                onClick={handleCreate}
                className="w-full py-4 bg-[#00E676] hover:bg-[#00C853] text-stone-950 rounded-2xl font-black uppercase tracking-widest text-sm transition-colors shadow-xl"
              >
                Create Destination
              </button>
            )}

          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Manual verification**

  - Navigate to `/admin/destinations/new` — form appears, map centered on Sri Lanka, "Create Destination" button visible
  - Fill in name → slug auto-fills
  - Click map → pin drops, lat/lng show beneath map
  - Click "Create Destination" → navigates to `/admin/destinations/:id` (edit mode)
  - In edit mode: change tagline → "Saving…" → "Saved" in header
  - In edit mode: drag map pin → coordinates update, autosave fires
  - In edit mode: upload a photo → hero image preview appears
  - In edit mode (if UNSPLASH_ACCESS_KEY set): switch to "Suggest (Free)" tab, search "Kandy Sri Lanka" → 9 photos appear, click one → hero image updates

- [ ] **Step 3: Commit**
  ```bash
  git add src/pages/AdminDestinationEditor.jsx
  git commit -m "feat: add AdminDestinationEditor with map pin, image upload, Unsplash suggestions"
  ```

---

## Task 7 — Frontend: AdminSettingsPage

**Files:**
- Create: `src/pages/AdminSettingsPage.jsx`

### What to do

- [ ] **Step 1: Create `src/pages/AdminSettingsPage.jsx`**

  ```jsx
  import { useEffect, useState } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { ArrowLeft, LogOut, Eye, EyeOff, CheckCircle2, Loader2, X } from 'lucide-react'
  import { useAuth } from '../contexts/AuthContext'
  import { apiGet, apiPut } from '../lib/api'

  const FIELDS = [
    { key: 'site_name',        label: 'Site Name',        placeholder: 'Travel Times Sri Lanka' },
    { key: 'site_tagline',     label: 'Tagline',          placeholder: 'Stories from the island' },
    { key: 'contact_email',    label: 'Contact Email',    placeholder: 'hello@example.com', type: 'email' },
    { key: 'social_instagram', label: 'Instagram URL',    placeholder: 'https://instagram.com/...' },
    { key: 'social_facebook',  label: 'Facebook URL',     placeholder: 'https://facebook.com/...' },
    { key: 'social_twitter',   label: 'X / Twitter URL',  placeholder: 'https://x.com/...' },
  ]

  const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#00E676]/40 focus:border-[#00E676] transition-colors"

  export default function AdminSettingsPage() {
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const [values, setValues] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const [showKey, setShowKey] = useState(false)

    useEffect(() => {
      apiGet('settings')
        .then(data => setValues(data || {}))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
      setSaving(true)
      setError('')
      setSaved(false)
      try {
        await apiPut('settings', values)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err.message || 'Save failed')
      } finally {
        setSaving(false)
      }
    }

    const handleSignOut = async () => {
      try { await signOut(); navigate('/') } catch (err) { console.error(err) }
    }

    return (
      <div className="min-h-screen bg-[#F5F5F3]">
        <header className="h-13 px-5 flex items-center justify-between border-b border-stone-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Admin</span>
            </button>
            <span className="text-stone-400 text-xs">/</span>
            <span className="text-sm text-stone-700 font-medium">Site Settings</span>
          </div>
          <button onClick={handleSignOut} className="text-stone-400 hover:text-red-400 transition-colors">
            <LogOut size={15} />
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-[#00E676]" size={28} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-6 flex flex-col gap-5 pb-16">

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                <X size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* General settings */}
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">General</p>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {FIELDS.map(f => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={values[f.key] || ''}
                      onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Unsplash */}
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Unsplash Integration</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Unsplash Access Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={values.unsplash_access_key || ''}
                      onChange={e => setValues(v => ({ ...v, unsplash_access_key: e.target.value }))}
                      placeholder="Your Unsplash API access key"
                      className={inputCls + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-4 py-3 leading-relaxed">
                  Get a free key at <strong>unsplash.com/developers</strong> → "New Application".
                  Also set <code className="bg-stone-100 px-1 rounded text-[11px]">UNSPLASH_ACCESS_KEY</code> in your
                  Hostinger environment variables for the server to use it.
                </p>
              </div>
            </section>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-4 bg-stone-950 hover:bg-stone-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-colors shadow-xl disabled:opacity-60"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : saved
                ? <><CheckCircle2 size={16} className="text-[#00E676]" /> Settings Saved</>
                : 'Save Settings'
              }
            </button>
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Manual verification**

  - Navigate to `/admin/settings`
  - Fields load with any previously saved values
  - Type in Site Name and click Save Settings → shows "Settings Saved" briefly
  - `GET /api/settings` returns the updated values
  - Enter an Unsplash key and save → note about env var is visible

- [ ] **Step 3: Commit**
  ```bash
  git add src/pages/AdminSettingsPage.jsx
  git commit -m "feat: add AdminSettingsPage with general settings and Unsplash key config"
  ```

---

## Task 8 — Final wiring + build verification

**Files:**
- None new — just verify the build and check for any integration issues

### What to do

- [ ] **Step 1: Run a full dev build to catch any import/lint errors**
  ```bash
  cd /Users/shanew/Documents/stuff/travel-times/travel-times-srilanka
  npm run build 2>&1 | tail -30
  ```
  Expected: "built in X.Xs" with no errors. If there are errors, fix them before continuing.

- [ ] **Step 2: Smoke test the full admin flow**

  With `node app.js` running locally:
  1. `/admin` → Dashboard shows Destinations + Settings buttons
  2. Click Destinations → list loads with seeded destinations
  3. Click any destination → editor loads, map shows pin, fields populated
  4. Click Settings → form loads, save works
  5. Open any article editor → split layout (body left, photos right), pin toggle visible, "~N min read" shown
  6. Toggle "Pin to homepage" → fires `/api/articles/:id/feature`
  7. Visit `/` → hero shows the pinned article (if published)

- [ ] **Step 3: Final commit**
  ```bash
  git add -A
  git commit -m "feat: CMS editor overhaul, destination manager, site settings, Unsplash integration"
  ```

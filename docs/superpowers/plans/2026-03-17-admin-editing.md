# Admin Editing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline editing to the staging queue and a full split-pane article editor with live preview for published/draft articles.

**Architecture:** Backend gets three new endpoints (PATCH staging, DELETE staging-image by path, PATCH article). Frontend gets a new `ArticlePreview` component, an enhanced `AdminStagingQueue` with autosave, a new `AdminArticlesList` page, and a rewritten `AdminArticleEditor` with split-pane editor+preview layout.

**Tech Stack:** Express.js (Node.js), React 19, Tailwind CSS v4, `fs/promises` for staging JSON, MySQL via `mysql2/promise`, Supabase JWT auth.

**Spec:** `docs/superpowers/specs/2026-03-17-admin-editing-design.md`

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `app.js` | Add PATCH to CORS allowed methods |
| Modify | `src/lib/api.js` | Add `apiPatch` helper |
| Modify | `src/App.jsx` | Add new routes, remove old `/admin/editor` |
| Modify | `server/routes/staging.js` | Add `PATCH /:folder` endpoint |
| Modify | `server/routes/staging-images.js` | Add `DELETE /:folder/:filename` path-param route |
| Modify | `server/routes/articles.js` | Add `PATCH /:id` endpoint |
| Create | `src/components/ArticlePreview.jsx` | Prop-driven article preview component |
| Modify | `src/pages/AdminStagingQueue.jsx` | Editable fields + autosave + image deletion |
| Create | `src/pages/AdminArticlesList.jsx` | List all published/draft articles |
| Replace | `src/pages/AdminArticleEditor.jsx` | Split-pane editor + live preview |

---

## Task 1: Infrastructure — CORS, apiPatch, route cleanup

**Files:**
- Modify: `app.js:23`
- Modify: `src/lib/api.js`
- Modify: `src/App.jsx:57-61`
- Modify: `src/pages/AdminDashboard.jsx:106-116`

- [ ] **Step 1: Add PATCH to CORS allowed methods in `app.js`**

Find line 23:
```js
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
```
Replace with:
```js
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
```

- [ ] **Step 2: Add `apiPatch` to `src/lib/api.js`**

After the `apiPut` export (line 50), add:
```js
export async function apiPatch(path, data) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}
```

- [ ] **Step 3: Update `src/App.jsx` — remove old editor route, add new routes**

At the top, add a new lazy import immediately before the existing `AdminArticleEditor` line (line 18). Do NOT remove the existing `AdminArticleEditor` import:
```js
// Add this line before the existing AdminArticleEditor lazy import:
const AdminArticlesList = lazy(() => import('./pages/AdminArticlesList'))
// Keep this line as-is:
const AdminArticleEditor = lazy(() => import('./pages/AdminArticleEditor'))
```

Replace the `/admin/editor` route block (lines 57–61):
```js
// Remove:
<Route path="/admin/editor" element={
  <ProtectedRoute>
    <AdminArticleEditor />
  </ProtectedRoute>
} />

// Add in its place:
<Route path="/admin/articles" element={
  <ProtectedRoute>
    <AdminArticlesList />
  </ProtectedRoute>
} />
<Route path="/admin/articles/:id" element={
  <ProtectedRoute>
    <AdminArticleEditor />
  </ProtectedRoute>
} />
```

- [ ] **Step 4: Update `AdminDashboard.jsx` — fix broken `/admin/editor` links**

In `AdminDashboard.jsx`, find the `openRecord` function (around line 104–116). The `navigate('/admin/editor')` calls should redirect to the articles list since we don't know the ID from the dashboard row:
```js
const openRecord = (article) => {
  if (article.source === 'staging') {
    navigate('/admin/staging')
    return
  }
  if (article.source === 'article' && article.recordId) {
    navigate(`/admin/articles/${article.recordId}`)
    return
  }
  navigate('/admin/articles')
}
```

Also find the "New Article" button (around line 246) — it navigates to `/admin/editor`. Change to `/admin/articles`. And the Edit button (around line 327):
```js
onClick={() => navigate(
  article.source === 'staging'
    ? '/admin/staging'
    : `/admin/articles/${article.recordId}`
)}
```

- [ ] **Step 5: Verify — run dev server and check no console errors**

```bash
npm run dev
```
Open http://localhost:5173/admin — check no broken route errors in the console. The Edit buttons on existing articles should now navigate to `/admin/articles/<id>`.

- [ ] **Step 6: Commit**

```bash
git add app.js src/lib/api.js src/App.jsx src/pages/AdminDashboard.jsx
git commit -m "feat: add PATCH to CORS, apiPatch helper, update admin routes"
```

---

## Task 2: Backend — PATCH /api/staging/:folder

**Files:**
- Modify: `server/routes/staging.js`

- [ ] **Step 1: Add PATCH /:folder route to `server/routes/staging.js`**

Add this block immediately before `export default router` at the bottom of the file. There is no ordering conflict — `PATCH` is a different HTTP method from `GET` so Express will never confuse these routes:

```js
// PATCH /:folder — update staging article fields (pending only)
router.patch('/:folder', requireAuth, async (req, res) => {
  const { folder } = req.params
  const stagingDir = getStagingDir()
  const staged = await readStagingJson(stagingDir, folder)

  if (!staged) return res.status(404).json({ error: 'Not found' })
  if (staged.review_status !== 'pending') {
    return res.status(409).json({ error: 'Only pending staging records can be edited' })
  }

  const allowed = ['title', 'subtitle', 'body', 'category', 'tags', 'author_name', 'destination_slug', 'event_slug', 'read_time']
  const updates = req.body || {}

  for (const key of allowed) {
    if (key in updates) {
      staged[key] = updates[key]
    }
  }

  await writeStagingJson(stagingDir, folder, staged)
  res.json({ updated: true })
})
```

- [ ] **Step 2: Verify — test the endpoint manually**

Start the server locally (`npm start` or `node app.js`), then curl or use a REST client:
```bash
# Should return 401 without token
curl -X PATCH http://localhost:3000/api/staging/some-folder \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'
# Expected: {"error":"No token provided"}
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/staging.js
git commit -m "feat: add PATCH /api/staging/:folder for inline editing"
```

---

## Task 3: Backend — DELETE /api/staging-images/:folder/:filename

**Files:**
- Modify: `server/routes/staging-images.js`

The existing `DELETE /` route uses query params. Add a new route using path params so the frontend can call `apiDelete('staging-images/folder/filename')`.

- [ ] **Step 1: Add `DELETE /:folder/:filename` to `server/routes/staging-images.js`**

Add before `export default router` (after line 121):

```js
router.delete('/:folder/:filename', requireAuth, async (req, res) => {
  const stagingFolder = sanitizeFolder(req.params.folder || '')
  const filename = (req.params.filename || '').replace(/[^a-zA-Z0-9._\-]/g, '')

  if (!stagingFolder || !filename) {
    return res.status(400).json({ error: 'folder and filename are required' })
  }

  const baseDir = getStagingDir()
  const staged = await readStagingJson(baseDir, stagingFolder)
  if (staged) {
    staged.images = (staged.images || []).filter(img => img.stored_filename !== filename)
    await writeStagingJson(baseDir, stagingFolder, staged)
  }

  await unlink(join(baseDir, stagingFolder, filename)).catch(() => {})
  res.json({ deleted: true })
})
```

- [ ] **Step 2: Verify — check route doesn't conflict with existing `DELETE /`**

The existing `DELETE /` matches `DELETE /api/staging-images` (no path segments). The new `DELETE /:folder/:filename` matches `DELETE /api/staging-images/folder/file.jpg` (two path segments). No conflict.

- [ ] **Step 3: Commit**

```bash
git add server/routes/staging-images.js
git commit -m "feat: add DELETE /api/staging-images/:folder/:filename path-param route"
```

---

## Task 4: Backend — PATCH /api/articles/:id

**Files:**
- Modify: `server/routes/articles.js`

> Note: The existing `PUT /:id` route unconditionally overwrites `published_at` whenever `status === 'published'`. The new `PATCH` handler must preserve the existing `published_at` if one is already set — only set it on first publish.

- [ ] **Step 1: Add `PATCH /:id` route to `server/routes/articles.js`**

Add after the `PUT /:id` route (after line 92), before `DELETE /:id`:

```js
router.patch('/:id', requireAuth, async (req, res) => {
  const db = getDb()
  const { id } = req.params
  const data = req.body

  try {
    // Fetch current article to preserve published_at on first-publish logic
    const [rows] = await db.query('SELECT published_at, status FROM articles WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const current = rows[0]

    const newStatus = data.status ?? current.status
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    // Only set published_at if transitioning to published for the first time
    const publishedAt = newStatus === 'published' && !current.published_at ? now : current.published_at

    const tags = data.tags != null
      ? JSON.stringify(Array.isArray(data.tags) ? data.tags : String(data.tags).split(',').map(t => t.trim()).filter(Boolean))
      : undefined

    // Build dynamic SET clause with only provided fields
    const setClauses = []
    const params = []

    if (data.title != null)       { setClauses.push('title = ?');       params.push(data.title) }
    if (data.subtitle != null)    { setClauses.push('subtitle = ?');    params.push(data.subtitle) }
    if (data.body != null)        { setClauses.push('body = ?');        params.push(data.body) }
    if (data.category != null)    { setClauses.push('category = ?');    params.push(data.category) }
    if (tags != null)             { setClauses.push('tags = ?');        params.push(tags) }
    if (data.author_name != null) { setClauses.push('author_name = ?'); params.push(data.author_name) }
    if (data.status != null)      { setClauses.push('status = ?');      params.push(newStatus) }
    // Always sync published_at with status logic
    setClauses.push('published_at = ?')
    params.push(publishedAt)

    params.push(id)
    await db.query(`UPDATE articles SET ${setClauses.join(', ')} WHERE id = ?`, params)

    const [updated] = await db.query('SELECT * FROM articles WHERE id = ?', [id])
    res.json(updated[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

- [ ] **Step 2: Verify — start server and check no syntax errors**

```bash
node app.js
# Should start without errors. Check: GET /api/articles/1 still works
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/articles.js
git commit -m "feat: add PATCH /api/articles/:id with safe published_at handling"
```

---

## Task 5: ArticlePreview component

**Files:**
- Create: `src/components/ArticlePreview.jsx`

This component accepts an article object as props and renders a representative preview of how the article looks on the site. It is intentionally simple — title, subtitle, meta line, body text, cover image. No maps, no tabs.

- [ ] **Step 1: Create `src/components/ArticlePreview.jsx`**

```jsx
import { useMemo } from 'react'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  return String(tags).split(',').map(t => t.trim()).filter(Boolean)
}

export default function ArticlePreview({ article }) {
  const tags = useMemo(() => parseTags(article?.tags), [article?.tags])

  if (!article) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 text-sm">
        No article loaded
      </div>
    )
  }

  return (
    <div className="bg-white h-full overflow-y-auto">
      {/* Hero image */}
      {article.cover_image && (
        <div className="w-full aspect-[16/7] overflow-hidden bg-stone-200">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Category + tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {article.category && (
            <span className="text-xs font-black uppercase tracking-widest text-[#00E676]">
              {article.category}
            </span>
          )}
          {tags.map(tag => (
            <span key={tag} className="text-xs text-stone-400 uppercase tracking-wider">#{tag}</span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic leading-tight mb-4 text-stone-950">
          {article.title || <span className="text-stone-300">Untitled</span>}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-lg text-stone-600 leading-relaxed mb-6 font-serif italic">
            {article.subtitle}
          </p>
        )}

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 uppercase tracking-widest border-t border-b border-stone-200 py-3 mb-8">
          {article.author_name && <span>{article.author_name}</span>}
          {article.published_at && <span>{formatDate(article.published_at)}</span>}
          {article.read_time && <span>{article.read_time} min read</span>}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            article.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {article.status || 'draft'}
          </span>
        </div>

        {/* Body */}
        <div className="text-base leading-relaxed text-stone-800 whitespace-pre-wrap font-serif">
          {article.body || <span className="text-stone-300 italic">Article body will appear here…</span>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify — import in a page temporarily to check it renders**

In `AdminDashboard.jsx`, temporarily add a quick smoke test import — or just run `npm run build` and ensure no import errors:
```bash
npm run build
# Should complete without errors
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ArticlePreview.jsx
git commit -m "feat: add ArticlePreview component for article editor preview pane"
```

---

## Task 6: Staging editor — editable fields, autosave, image deletion

**Files:**
- Modify: `src/pages/AdminStagingQueue.jsx`

This is the largest frontend change. The detail panel for pending items becomes fully editable with autosave.

Key patterns to use:
- `useRef` for debounce timer
- `useEffect` for `beforeunload` guard
- Optimistic UI for image deletion (remove from local state immediately, restore on error)

- [ ] **Step 1: Replace `AdminStagingQueue.jsx` with the enhanced version**

```jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, LogOut, RefreshCw, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPatch, apiPost, apiDelete } from '../lib/api'

const REVIEW_FILTERS = ['pending', 'approved', 'rejected', 'all']
const SAVE_DEBOUNCE_MS = 800

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function EditField({ label, value, onChange, type = 'text', rows, readOnly }) {
  if (readOnly) {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase text-stone-500">{label}</p>
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {value || '—'}
        </p>
      </div>
    )
  }
  if (rows) {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-stone-500">{label}</label>
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
        />
      </div>
    )
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-stone-500">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )
}

export default function AdminStagingQueue() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [reviewFilter, setReviewFilter] = useState('pending')
  const [queue, setQueue] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [publishStatus, setPublishStatus] = useState('draft')
  const [reviewNotes, setReviewNotes] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  // Editing state
  const [editFields, setEditFields] = useState({})
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const [readOnly, setReadOnly] = useState(false)
  const debounceRef = useRef(null)
  const hasUnsavedRef = useRef(false)

  const selectedStaging = selected?.staging || null
  const selectedImages = selected?.images || []
  const isPending = selectedStaging?.review_status === 'pending'

  // beforeunload guard
  useEffect(() => {
    const handler = (e) => {
      if (saveStatus === 'error') {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes'
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveStatus])

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const loadQueue = useCallback(async () => {
    setLoadingList(true)
    setError('')
    try {
      const query = reviewFilter === 'all' ? 'staging' : `staging?review_status=${reviewFilter}`
      const data = await apiGetAuth(query)
      const rows = Array.isArray(data) ? data : []
      setQueue(rows)
      if (rows.length === 0) { setSelectedId(null); setSelected(null); return }
      if (!rows.some(row => row.folder === selectedId)) setSelectedId(rows[0].folder)
    } catch (err) {
      setError(err.message || 'Failed to load staging queue')
    } finally {
      setLoadingList(false)
    }
  }, [reviewFilter, selectedId])

  const loadDetail = useCallback(async (id) => {
    if (!id) return
    setLoadingDetail(true)
    setError('')
    try {
      const detail = await apiGetAuth(`staging/${id}`)
      setSelected(detail)
      const s = detail?.staging || {}
      setPublishStatus(s.desired_status || 'draft')
      setReviewNotes(s.review_notes || '')
      setReadOnly(s.review_status !== 'pending')
      setEditFields({
        title: s.title || '',
        subtitle: s.subtitle || '',
        body: s.body || '',
        category: s.category || '',
        tags: Array.isArray(s.tags) ? s.tags.join(', ') : (s.tags || ''),
        author_name: s.author_name || '',
        destination_slug: s.destination_slug || '',
      })
      setSaveStatus('saved')
    } catch (err) {
      setError(err.message || 'Failed to load staging details')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])
  useEffect(() => { if (selectedId) loadDetail(selectedId) }, [selectedId, loadDetail])

  const updateField = (key, value) => {
    if (readOnly) return
    setEditFields(prev => ({ ...prev, [key]: value }))
    setSaveStatus('saving')
    hasUnsavedRef.current = true
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await apiPatch(`staging/${selectedId}`, { [key]: value })
        setSaveStatus('saved')
        hasUnsavedRef.current = false
        // Sync title in queue list for immediate feedback
        if (key === 'title') {
          setQueue(prev => prev.map(r => r.folder === selectedId ? { ...r, title: value } : r))
        }
      } catch (err) {
        if (err.message?.includes('409')) {
          setReadOnly(true)
          setSaveStatus('saved')
          setError('This item has been reviewed and can no longer be edited.')
        } else {
          setSaveStatus('error')
        }
      }
    }, SAVE_DEBOUNCE_MS)
  }

  const deleteImage = async (img) => {
    // Optimistic: remove immediately
    setSelected(prev => ({
      ...prev,
      images: (prev?.images || []).filter(i => i.stored_filename !== img.stored_filename),
    }))
    try {
      await apiDelete(`staging-images/${selectedId}/${img.stored_filename}`)
    } catch {
      // Restore on failure
      setSelected(prev => ({ ...prev, images: [...(prev?.images || []), img] }))
      setError('Failed to delete image')
    }
  }

  const approveSelected = async () => {
    if (!selectedStaging || !isPending) return
    setActionLoading('approve')
    setError('')
    try {
      await apiPost(`staging/${selectedStaging.folder}/approve`, { status: publishStatus, review_notes: reviewNotes })
      await loadQueue()
      await loadDetail(selectedStaging.folder)
    } catch (err) {
      setError(err.message || 'Approval failed')
    } finally {
      setActionLoading('')
    }
  }

  const rejectSelected = async () => {
    if (!selectedStaging || !isPending) return
    setActionLoading('reject')
    setError('')
    try {
      await apiPost(`staging/${selectedStaging.folder}/reject`, { review_notes: reviewNotes })
      await loadQueue()
      await loadDetail(selectedStaging.folder)
    } catch (err) {
      setError(err.message || 'Rejection failed')
    } finally {
      setActionLoading('')
    }
  }

  const queueCountLabel = useMemo(() => `${queue.length} item${queue.length === 1 ? '' : 's'}`, [queue.length])

  const saveIndicator = saveStatus === 'saving'
    ? <span className="text-xs text-stone-400 animate-pulse">Saving…</span>
    : saveStatus === 'error'
    ? <span className="text-xs text-red-500">Save failed — check connection</span>
    : <span className="text-xs text-green-600">Saved</span>

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Staging Review Queue</h1>
              <p className="text-stone-400 text-sm mt-1">Review and edit staged article folders</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm">
                <ArrowLeft size={16} /> Dashboard
              </button>
              <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
            {error}
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-stone-700">Filter</label>
          <select value={reviewFilter} onChange={e => setReviewFilter(e.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {REVIEW_FILTERS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
          <button onClick={loadQueue} className="inline-flex items-center gap-2 rounded-lg bg-stone-200 px-3 py-2 text-sm font-medium hover:bg-stone-300">
            <RefreshCw size={16} /> Refresh
          </button>
          <span className="text-sm text-stone-500">{queueCountLabel}</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Queue list */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-1">
            {loadingList ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : queue.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500">No staging items for this filter.</p>
            ) : (
              <div className="space-y-3">
                {queue.map(row => (
                  <button key={row.folder} onClick={() => setSelectedId(row.folder)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${selectedId === row.folder ? 'border-[#00E676] bg-[#00E676]/10' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'}`}>
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-mono">{row.folder}</p>
                    <p className="font-semibold text-stone-900">{row.title}</p>
                    <p className="text-xs text-stone-600">/{row.slug}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                      <span>{row.image_count || 0} image(s)</span>
                      <span className="uppercase">{row.review_status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
            {loadingDetail ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone-500" /></div>
            ) : !selectedStaging ? (
              <p className="py-16 text-center text-sm text-stone-500">Select a staging item to review.</p>
            ) : (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
                      {selectedStaging.review_status}
                    </span>
                    {!readOnly && saveIndicator}
                    {readOnly && <span className="text-xs text-stone-400 italic">Read-only</span>}
                  </div>
                  <p className="text-xs text-stone-400 font-mono">{selectedStaging.folder}</p>
                </div>

                {readOnly && selectedStaging.review_status !== 'pending' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                    This item has been {selectedStaging.review_status} and can no longer be edited.
                  </div>
                )}

                {/* Editable fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EditField label="Title" value={editFields.title} onChange={v => updateField('title', v)} readOnly={readOnly} />
                  <EditField label="Category" value={editFields.category} onChange={v => updateField('category', v)} readOnly={readOnly} />
                  <EditField label="Author" value={editFields.author_name} onChange={v => updateField('author_name', v)} readOnly={readOnly} />
                  <EditField label="Tags (comma-separated)" value={editFields.tags} onChange={v => updateField('tags', v)} readOnly={readOnly} />
                  <div className="md:col-span-2">
                    <EditField label="Subtitle" value={editFields.subtitle} onChange={v => updateField('subtitle', v)} readOnly={readOnly} />
                  </div>
                  <EditField label="Destination slug" value={editFields.destination_slug} onChange={v => updateField('destination_slug', v)} readOnly={readOnly} />
                </div>

                {/* Body */}
                <EditField label="Body" value={editFields.body} onChange={v => updateField('body', v)} rows={10} readOnly={readOnly} />

                {/* Images */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-700">Staged Images ({selectedImages.length})</p>
                  {selectedImages.length === 0 ? (
                    <p className="text-sm text-stone-500">No images in staging.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {selectedImages.map(img => (
                        <div key={img.stored_filename} className="group relative rounded-lg border border-stone-200 bg-stone-50 p-2">
                          <img src={img.url} alt={img.original_filename} className="aspect-square w-full rounded object-cover" />
                          {isPending && (
                            <button
                              onClick={() => deleteImage(img)}
                              className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full shadow"
                              title="Delete image"
                            >
                              <X size={12} />
                            </button>
                          )}
                          <p className="mt-1 truncate text-[11px] text-stone-600">{img.original_filename}</p>
                          <p className="text-[10px] uppercase text-stone-500">{img.role}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved/rejected banner */}
                {!isPending && selectedStaging.final_article_id ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Published to article #{selectedStaging.final_article_id}
                    {selectedStaging.review_notes ? ` — ${selectedStaging.review_notes}` : ''}
                  </div>
                ) : null}

                {/* Approve/reject controls */}
                {isPending && (
                  <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-stone-700">Publish As</label>
                        <select value={publishStatus} onChange={e => setPublishStatus(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-stone-700">Reviewer Notes</label>
                        <input value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Optional notes" className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={approveSelected} disabled={actionLoading !== ''} className="inline-flex items-center gap-2 rounded-lg bg-[#00E676] px-5 py-2 text-sm font-semibold text-stone-950 hover:bg-[#00c853] disabled:opacity-60">
                        {actionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {`Approve (${publishStatus})`}
                      </button>
                      <button onClick={rejectSelected} disabled={actionLoading !== ''} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                        {actionLoading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in dev — open a pending staging item and edit the title**

```bash
npm run dev
```
1. Go to `/admin/staging`
2. Select a pending item
3. Change the title field — watch for `Saving…` → `Saved` indicator
4. Refresh the page — confirm the new title persists (was written to `article.json`)
5. Hover over an image — confirm the × delete button appears
6. Click × — confirm the image disappears immediately

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminStagingQueue.jsx
git commit -m "feat: editable staging fields with autosave and image deletion"
```

---

## Task 7: AdminArticlesList page

**Files:**
- Create: `src/pages/AdminArticlesList.jsx`

- [ ] **Step 1: Create `src/pages/AdminArticlesList.jsx`**

```jsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Loader2, LogOut, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGet } from '../lib/api'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export default function AdminArticlesList() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('articles')
      setArticles(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const filtered = useMemo(() => articles.filter(a => {
    const matchesSearch = !search ||
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.slug || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  }), [articles, search, statusFilter])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Articles</h1>
            <p className="text-stone-400 text-sm mt-1">Published &amp; draft articles</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-stone-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No articles found.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Title</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Author</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-700">Published</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-stone-700">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filtered.map(article => (
                  <tr key={article.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-950">{article.title || 'Untitled'}</div>
                      <div className="text-xs text-stone-500">/{article.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-medium">
                        {article.category || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {article.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-700">{article.author_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-stone-600">{formatDate(article.published_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/articles/${article.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-950 text-white rounded-lg text-xs font-semibold hover:bg-stone-700 transition-colors"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify — visit `/admin/articles` in dev**

```bash
npm run dev
```
Navigate to http://localhost:5173/admin/articles — should see the articles table. Clicking Edit should navigate to `/admin/articles/:id`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminArticlesList.jsx
git commit -m "feat: add AdminArticlesList page at /admin/articles"
```

---

## Task 8: AdminArticleEditor — split pane editor with live preview

**Files:**
- Replace: `src/pages/AdminArticleEditor.jsx`

> This completely replaces the existing empty shell. The new editor loads a real article by ID from the URL, shows editable fields on the left and `ArticlePreview` on the right, and autosaves via `PATCH /api/articles/:id`.

- [ ] **Step 1: Replace `src/pages/AdminArticleEditor.jsx`**

```jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiGet, apiPatch } from '../lib/api'
import ArticlePreview from '../components/ArticlePreview'

const SAVE_DEBOUNCE_MS = 800

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) return parsed } catch {}
  return String(tags).split(',').map(t => t.trim()).filter(Boolean)
}

export default function AdminArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [article, setArticle] = useState(null)
  const [fields, setFields] = useState({
    title: '', subtitle: '', body: '', category: '', tags: '', author_name: '', status: 'draft',
  })
  const [saveStatus, setSaveStatus] = useState('saved')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  // Always holds the latest fields so the debounced save doesn't use stale closure values
  const fieldsRef = useRef(fields)

  // beforeunload guard
  useEffect(() => {
    const handler = (e) => {
      if (saveStatus === 'error') { e.preventDefault(); e.returnValue = 'You have unsaved changes' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveStatus])

  const loadArticle = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await apiGet(`articles/${id}`)
      if (data?.error) { setError(data.error); return }
      setArticle(data)
      setFields({
        title: data.title || '',
        subtitle: data.subtitle || '',
        body: data.body || '',
        category: data.category || '',
        tags: parseTags(data.tags).join(', '),
        author_name: data.author_name || '',
        status: data.status || 'draft',
      })
    } catch (err) {
      setError(err.message || 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadArticle() }, [loadArticle])

  // Derived preview article — merges fields back for live preview
  const previewArticle = article ? {
    ...article,
    ...fields,
    tags: fields.tags,
  } : null

  const updateField = (key, value) => {
    const next = { ...fieldsRef.current, [key]: value }
    setFields(next)
    fieldsRef.current = next
    setSaveStatus('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        // Use fieldsRef.current so the save always sends the latest state,
        // not a stale closure value from when the timer was created
        await apiPatch(`articles/${id}`, fieldsRef.current)
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
        setError(err.message || 'Save failed')
      }
    }, SAVE_DEBOUNCE_MS)
  }

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const saveIndicator = saveStatus === 'saving'
    ? <span className="text-xs text-stone-400 animate-pulse">Saving…</span>
    : saveStatus === 'error'
    ? <span className="text-xs text-red-400">Save failed</span>
    : <span className="text-xs text-green-500">Saved</span>

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <div className="bg-stone-950 text-stone-50 shadow-lg flex-shrink-0">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/articles')} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm">
              <ArrowLeft size={16} /> Articles
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">{fields.title || 'Untitled Article'}</h1>
              <div className="flex items-center gap-2 mt-0.5">{saveIndicator}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-stone-400" size={32} />
        </div>
      ) : error && !article ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Editor pane */}
          <div className="w-1/2 flex flex-col overflow-y-auto border-r border-stone-200 bg-white p-6 gap-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Title</label>
              <input value={fields.title} onChange={e => updateField('title', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Subtitle</label>
              <input value={fields.subtitle} onChange={e => updateField('subtitle', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Category</label>
                <input value={fields.category} onChange={e => updateField('category', e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Author</label>
                <input value={fields.author_name} onChange={e => updateField('author_name', e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Tags (comma-separated)</label>
              <input value={fields.tags} onChange={e => updateField('tags', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Status</label>
              <select value={fields.status} onChange={e => updateField('status', e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Body</label>
              <textarea value={fields.body} onChange={e => updateField('body', e.target.value)}
                className="flex-1 min-h-[400px] w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
          </div>

          {/* Preview pane */}
          <div className="w-1/2 overflow-hidden">
            <ArticlePreview article={previewArticle} />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify — open an article in the editor**

```bash
npm run dev
```
1. Go to `/admin/articles` — click Edit on any article
2. Should see split pane: editor left, preview right
3. Edit the title — preview should update live, `Saving…` → `Saved`
4. Reload — changes should persist

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminArticleEditor.jsx
git commit -m "feat: replace AdminArticleEditor with split-pane editor + live preview"
```

---

## Task 9: Admin nav — add Articles link to Dashboard

**Files:**
- Modify: `src/pages/AdminDashboard.jsx`

The Dashboard header should have a quick link to the Articles list alongside "Review Queue".

- [ ] **Step 1: Add Articles button to `AdminDashboard.jsx` action bar**

Find the button group that has "Review Queue" and "Ingest Folder" buttons (around line 231–255). Add an Articles button:

```jsx
<button
  onClick={() => navigate('/admin/articles')}
  className="flex items-center gap-2 px-6 py-2 bg-stone-600 text-white rounded-lg font-medium transition-all shadow-sm whitespace-nowrap hover:bg-stone-500"
>
  <Edit size={20} />
  Articles
</button>
```

Also add `Edit` to the lucide-react import at line 3 if not already there.

- [ ] **Step 2: Verify**

```bash
npm run dev
```
Dashboard should show an "Articles" button. Clicking it navigates to `/admin/articles`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.jsx
git commit -m "feat: add Articles nav link to admin dashboard"
```

---

## Task 10: Build, push, deploy

- [ ] **Step 1: Full build check**

```bash
npm run build
# Should complete with no errors. Warnings about chunk sizes are OK.
```

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Restart Hostinger Node.js app**

Go to Hostinger panel → Node.js → Restart.

- [ ] **Step 4: Smoke test on production**

1. `/admin/staging` — edit a title, confirm autosave works
2. Delete a staged image — confirm it disappears
3. `/admin/articles` — confirm article list loads
4. `/admin/articles/:id` — confirm split pane loads, editing autosaves
5. Check preview updates live as you type

# Admin Editing — Design Spec
**Date:** 2026-03-17

## Overview

Extend the admin panel with inline editing for staged articles and a full editor for published/draft articles, so editors can correct and refine content at every stage of the workflow.

---

## 0. Infrastructure Changes (required before everything else)

### CORS — add PATCH verb
`app.js` line 23: add `PATCH` to `Access-Control-Allow-Methods`:
```
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### API helper — add `apiPatch`
`src/lib/api.js`: add `apiPatch(path, body)` helper mirroring `apiPost` but using `method: 'PATCH'`.

### Route cleanup
- Remove the existing `/admin/editor` route from `App.jsx` (empty shell, replaced by `/admin/articles/:id`)
- Update all existing links to `/admin/editor` inside `AdminDashboard` and other admin pages to point to `/admin/articles`

---

## 1. Staging Editor Enhancements

**Location:** `AdminStagingQueue` (`/admin/staging`)

### Editable Fields (pending items only)
- Title, subtitle, body (plain textarea), category, tags (comma-separated input), author name, destination slug
- Approved/rejected items remain read-only

### Autosave Behaviour
- 800ms debounce after any field change
- Calls `PATCH /api/staging/:folder` with only the changed fields
- Server checks `review_status === 'pending'` before writing; returns 409 if not
- UI handles 409 by switching the panel to read-only mode and showing a banner ("This item has been reviewed and can no longer be edited")
- Save indicator in detail panel header: `Saving…` / `Saved` / `Error`
- On save failure: show `Error` indicator and attach a `beforeunload` warning ("You have unsaved changes") to prevent accidental navigation until the user retries or explicitly discards

### Image Deletion
- Each image thumbnail shows a delete (×) button on hover
- Click → calls `DELETE /api/staging-images/:folder/:filename`
- Server deletes the physical file from disk and removes the entry from `article.json`
- UI removes the image immediately (optimistic update); on failure, restores the image and shows an inline error

---

## 2. Articles List Page

**New route:** `/admin/articles`
**New file:** `src/pages/AdminArticlesList.jsx`

- Linked from admin nav (alongside Dashboard / Staging Queue / Ingest)
- Fetches all articles via `GET /api/articles` (public endpoint, no auth required — consistent with existing behaviour)
- Table: title, category, status badge (published / draft), author, published date, Edit button
- Search + status filter
- Each row Edit button → navigates to `/admin/articles/:id`

---

## 3. Article Editor

**New route:** `/admin/articles/:id`
**New file:** `src/pages/AdminArticleEditor.jsx` (replaces the empty shell at the old `/admin/editor` route)

### Layout
Split pane (50/50 desktop, stacked on mobile):
- **Left — Editor panel**: form fields with autosave
- **Right — Preview panel**: `ArticlePreview` component (see below)

### Editor Fields
- Title (text input)
- Subtitle (text input)
- Body (plain textarea, full height)
- Category (text input)
- Tags (comma-separated text input)
- Author name (text input)
- Status toggle: Draft ↔ Published (sets `published_at = NOW()` on first publish)

### Autosave
- 800ms debounce on any field change
- Sends full article shape (all editable fields) via `PATCH /api/articles/:id`
- On failure: show `Error` indicator + `beforeunload` warning until retried or discarded
- Save indicator: `Saving…` / `Saved` / `Error`

### Preview Panel — `ArticlePreview` component
`EventDetailPage` cannot be reused as a prop-driven component (it loads data from static files, has hardcoded maps and image imports, and owns its own data fetching). Instead, create a new lightweight `src/components/ArticlePreview.jsx` that:
- Accepts an article object as props (`{ title, subtitle, body, category, tags, author_name, status, cover_image }`)
- Renders a representative article layout matching the site's visual style (typography, spacing, header treatment)
- Updates live from editor state — 300ms debounce on the body field to prevent jank
- Is intentionally simple: title, subtitle, meta line (author / category / date), body text, cover image if present — not a full-page replica with maps, tabs, or related events

---

## 4. Backend Changes

### `PATCH /api/staging/:folder`
- Auth required
- Body: partial fields (`title`, `subtitle`, `body`, `category`, `tags`, `author_name`, `destination_slug`, etc.)
- **Guard**: check `review_status === 'pending'`; return 409 if not
- Reads `article.json`, merges provided fields, writes back
- Returns `{ updated: true }`

### `DELETE /api/staging-images/:folder/:filename`
- Auth required
- Deletes the physical file from `API_STAGING_UPLOAD_DIR/:folder/:filename`
- Removes the matching entry from `article.json` images array
- Returns `{ deleted: true }`

### `PATCH /api/articles/:id`
- Auth required
- Body: full editable shape (`title`, `subtitle`, `body`, `category`, `tags`, `author_name`, `status`)
- On first publish (status changes to `published` and `published_at` is null): sets `published_at = NOW()`
- Returns updated article row

### `GET /api/articles/:id`
- Existing public endpoint (`GET /:id?`) — no change needed; reused by the article editor on mount

---

## 5. Routing (`App.jsx`)

```
/admin/articles          → AdminArticlesList   (new)
/admin/articles/:id      → AdminArticleEditor  (new, replaces /admin/editor)
```

Remove: `/admin/editor`

---

## 6. Out of Scope (this iteration)
- Image upload/replacement in the article editor
- Rich text / WYSIWYG formatting
- Reordering images
- Article deletion from the editor
- Concurrent edit conflict detection for articles (single-admin assumption)

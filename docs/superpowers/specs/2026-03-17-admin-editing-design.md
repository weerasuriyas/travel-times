# Admin Editing — Design Spec
**Date:** 2026-03-17

## Overview

Extend the admin panel with inline editing for staged articles and a full editor for published/draft articles, so editors can correct and refine content at every stage of the workflow.

---

## 1. Staging Editor Enhancements

**Location:** `AdminStagingQueue` (`/admin/staging`)

### Editable Fields (pending items only)
- Title, subtitle, body (plain textarea), category, tags (comma-separated), author name, destination slug

### Autosave Behaviour
- 800ms debounce after any field change
- Calls `PATCH /api/staging/:folder` with changed fields
- Server merges changes into `article.json` on disk (partial update — only provided fields are overwritten)
- Save indicator in detail panel header: `Saving…` / `Saved` / `Error`
- Approved/rejected items are read-only (no editing)

### Image Deletion
- Each image thumbnail in the staged images grid shows a delete button (×) on hover
- Click → calls `DELETE /api/staging-images/:folder/:filename`
- Server deletes the file from disk and removes the entry from `article.json`
- UI removes the image immediately (optimistic update)

---

## 2. Articles List Page

**New route:** `/admin/articles`
**New file:** `src/pages/AdminArticlesList.jsx`

- Linked from admin nav (alongside Dashboard / Staging / Ingest)
- Fetches all articles via `GET /api/articles` (already exists)
- Table: title, category, status badge (published / draft), author, published date, actions
- Search + status filter (reuse pattern from AdminDashboard)
- Each row → click Edit → navigates to `/admin/articles/:id`

---

## 3. Article Editor

**New route:** `/admin/articles/:id`
**New file:** `src/pages/AdminArticleEditor.jsx` (replaces the empty shell that exists)

### Layout
Split pane (50/50, stacked on mobile):
- **Left — Editor panel**: form fields with autosave
- **Right — Preview panel**: live render of how the article looks to readers

### Editor Fields
- Title (text input)
- Subtitle (text input)
- Body (plain textarea, full height)
- Category (text input)
- Tags (text input, comma-separated)
- Author name (text input)
- Status toggle: Draft ↔ Published (updates `published_at` on first publish)
- Cover image display (read-only in this version)

### Autosave
- 800ms debounce on any field change
- Calls `PATCH /api/articles/:id`
- Save indicator: `Saving…` / `Saved` / `Error`

### Preview Panel
- Renders the article using the same component/layout readers see
- Fed directly from editor state (no network round-trip for preview)
- Updates live as the user types (debounced 300ms for body to avoid jank)

---

## 4. Backend Changes

### `PATCH /api/staging/:folder`
- Auth required
- Body: partial fields (`title`, `subtitle`, `body`, `category`, `tags`, `author_name`, `destination_slug`, etc.)
- Reads `article.json`, merges provided fields, writes back
- Returns `{ updated: true }`

### `DELETE /api/staging-images/:folder/:filename`
- Auth required
- Deletes the physical file from `API_STAGING_UPLOAD_DIR/:folder/:filename`
- Removes the matching entry from `article.json` images array
- Returns `{ deleted: true }`

### `PATCH /api/articles/:id`
- Auth required
- Body: partial fields (`title`, `subtitle`, `body`, `category`, `tags`, `author_name`, `status`)
- On first publish (status changes to `published` and `published_at` is null): sets `published_at = NOW()`
- Returns updated article row

### `GET /api/articles/:id`
- Auth required
- Returns single article row by id

---

## 5. Routing

Add to `src/App.jsx` (or wherever routes are defined):
```
/admin/articles          → AdminArticlesList
/admin/articles/:id      → AdminArticleEditor
```

---

## 6. Out of Scope (this iteration)
- Image upload/replacement in the article editor
- Rich text / WYSIWYG formatting
- Reordering images
- Article deletion from the editor

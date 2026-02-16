# Article Ingestion Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an admin panel ingestion page where the user drops a folder containing a document and images, the system parses the document, uploads images to Supabase Storage, saves structured data to Supabase PostgreSQL, and eventually replaces the hardcoded `src/data/destinations.js`.

**Architecture:** Use **Supabase PostgreSQL** (not Hostinger MySQL) for content storage — Supabase is already wired for auth, provides a free JS client, Row-Level Security, and built-in Storage for images. All ingestion happens client-side via the File System Access API (folder drop → parse in browser → upload to Supabase Storage → insert rows). No backend server needed. A Node migration script migrates the existing hardcoded data. The frontend switches from `destinations.js` to live Supabase queries via a `useContent` hook.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Supabase JS v2, Supabase Storage, Supabase PostgreSQL, File System Access API / `<input webkitdirectory>` fallback, date-fns (already installed)

---

## Architecture Decision: Supabase vs Hostinger MySQL

### Why Supabase PostgreSQL (chosen)

| Factor | Supabase PostgreSQL | Hostinger MySQL |
|---|---|---|
| Auth integration | Already connected, zero config | Requires separate auth bridge or JWT layer |
| JS client | `@supabase/supabase-js` already installed | Need `mysql2` or REST API on a separate server |
| Image storage | Supabase Storage (same dashboard) | Need Hostinger File Manager or separate CDN |
| Backend server required | No — RLS handles access control | Yes — can't expose MySQL creds client-side |
| Free tier | Generous (500MB DB, 1GB storage) | Paid (already paying) |
| Deployment complexity | SPA only | SPA + Node/PHP API server |
| Dev speed | 1 day | 3–5 days |

**Recommendation: Use Supabase PostgreSQL.** The user already has Hostinger for web hosting (fine, keep it for that), but use Supabase for all data. MySQL would require standing up a separate API server, which is a significant scope increase with no benefit.

---

## Database Schema

Run this SQL in the Supabase SQL Editor:

```sql
-- Destinations (e.g., Kandy, Ella, Galle)
create table destinations (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  hero_image_url text,
  region text,
  highlights jsonb default '[]',
  stats jsonb default '{}',          -- { elevation, temperature, bestTime }
  coordinates jsonb,                 -- [lat, lng]
  general_things_to_do jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Events (festivals, specific happenings tied to a destination)
create table events (
  id uuid default gen_random_uuid() primary key,
  destination_id uuid references destinations(id) on delete cascade,
  slug text unique not null,
  name text not null,
  type text,                         -- 'Cultural Festival', 'Nature', etc.
  season text,
  duration text,
  start_date date,
  end_date date,
  featured boolean default false,
  hero_image_url text,
  description text,
  things_to_do jsonb default '[]',
  accommodations jsonb default '[]',
  restaurants jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Articles (rich editorial content attached to an event)
create table articles (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  slug text unique not null,
  title text not null,
  subtitle text,
  category text,
  tags text[] default '{}',
  issue text,
  author_name text,
  author_role text,
  author_bio text,
  author_avatar_url text,
  read_time int,
  published_date date,
  status text default 'draft',       -- 'draft' | 'published'
  is_featured boolean default false,
  hero_image_url text,
  content jsonb not null default '{}', -- full structured content blob
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Images (uploaded images associated with articles or events)
create table images (
  id uuid default gen_random_uuid() primary key,
  article_id uuid references articles(id) on delete cascade,
  filename text not null,
  storage_path text not null,        -- path in Supabase Storage bucket
  public_url text not null,
  width int,
  height int,
  alt_text text,
  created_at timestamptz default now()
);

-- Row Level Security: admin can do everything, public can read published
alter table destinations enable row level security;
alter table events enable row level security;
alter table articles enable row level security;
alter table images enable row level security;

-- Public read for published content
create policy "Public read destinations" on destinations for select using (true);
create policy "Public read events" on events for select using (true);
create policy "Public read published articles" on articles for select using (status = 'published');
create policy "Public read images" on images for select using (true);

-- Authenticated admin write (checks admin_users table)
create policy "Admin write destinations" on destinations for all
  using (exists (select 1 from admin_users where user_id = auth.uid() and is_active = true));
create policy "Admin write events" on events for all
  using (exists (select 1 from admin_users where user_id = auth.uid() and is_active = true));
create policy "Admin write articles" on articles for all
  using (exists (select 1 from admin_users where user_id = auth.uid() and is_active = true));
create policy "Admin write images" on images for all
  using (exists (select 1 from admin_users where user_id = auth.uid() and is_active = true));
```

**Supabase Storage bucket** (create in dashboard: Storage → New bucket):
- Name: `article-images`
- Public: Yes (images served via CDN URL)

---

## Article Folder Format

The user drops a folder with this structure:

```
kandy-perahera/
├── article.md          ← Required. Document with frontmatter.
├── hero.jpg            ← Optional. Named 'hero.*' = hero image.
├── section-1.jpg
├── section-2.jpg
└── thumbnails/
    └── ...             ← Optional subdirectory, ignored for now.
```

**`article.md` frontmatter format:**

```markdown
---
title: THE FIRE OF KANDY.
subtitle: We walked through the smoke of a thousand copra torches...
slug: kandy-perahera
category: Culture
tags: Festival, Heritage, Buddhist, Kandy
issue: "Issue 04: The Relic"
author: Sanath Weerasuriya
authorRole: Field Correspondent
readTime: 8
destination: kandy
eventName: The Fire of Kandy
eventType: Cultural Festival
startDate: 2026-07-29
endDate: 2026-08-12
featured: true
status: draft
---

# Introduction

The historic 'Esala Perahera' in Kandy...

## The Procession

Heralded by thousands of Kandyan drummers...

## Ancient Tradition

The aged old tradition were never changed...
```

Parser rules:
- YAML frontmatter between `---` delimiters → metadata fields
- `# heading` at top level → article introduction (first paragraph if no heading)
- `## Section Heading` → creates a `sections[]` entry with `heading` + body
- Images referenced as `![alt](filename.jpg)` → matched to uploaded images by filename

---

## Folder / File Map

### New files to create:
```
src/
  pages/
    AdminIngestion.jsx          ← Main ingestion page
  components/
    ingestion/
      FolderDropZone.jsx        ← Drop zone UI + webkitdirectory input
      DocumentParser.jsx        ← Pure JS module: parse MD → structured data
      IngestionPreview.jsx      ← Preview parsed data before save
      IngestionProgress.jsx     ← Upload progress tracker
  hooks/
    useContent.js               ← Replaces destinations.js with Supabase queries
    useIngestion.js             ← Orchestrates parse → upload → save flow
  lib/
    markdownParser.js           ← Parse frontmatter + markdown sections
    supabaseStorage.js          ← Image upload helpers
scripts/
  migrateHardcodedContent.js    ← One-time: push destinations.js → Supabase
```

### Files to modify:
```
src/App.jsx                     ← Add /admin/ingest route
src/pages/AdminDashboard.jsx    ← Add "Import Content" button → /admin/ingest
src/pages/DestinationsPage.jsx  ← Switch from destinations.js to useContent hook
src/pages/DestinationDetailPage.jsx ← Same
src/pages/EventDetailPage.jsx   ← Same
src/pages/HomePage.jsx          ← Same
```

---

## Task 1: Supabase Database Setup

**Files:**
- Create: `docs/supabase-schema.sql`

**Step 1: Open Supabase SQL Editor**

Go to https://supabase.com → your project → SQL Editor → New Query.

**Step 2: Run the schema SQL**

Paste and run the full schema from the "Database Schema" section above.

Expected: All tables created, RLS policies applied, no errors.

**Step 3: Create the storage bucket**

Go to Storage → New bucket → Name: `article-images` → Public: Yes → Create.

**Step 4: Save the SQL as a reference file**

Create `docs/supabase-schema.sql` with the full schema SQL (for future reference / team members).

**Step 5: Commit**

```bash
git add docs/supabase-schema.sql
git commit -m "feat: add supabase schema for articles, events, destinations, images"
```

---

## Task 2: Markdown Parser Utility

**Files:**
- Create: `src/lib/markdownParser.js`

**Step 1: Write the parser**

Create `src/lib/markdownParser.js`:

```js
/**
 * Parse an article markdown file (string) into structured data.
 * Returns { meta, content } matching the DB schema.
 */
export function parseArticleMarkdown(text) {
  // Split frontmatter
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)/)
  if (!fmMatch) throw new Error('No frontmatter found in document')

  const meta = parseFrontmatter(fmMatch[1])
  const body = fmMatch[2].trim()

  // Parse body into sections
  const content = parseBody(body)

  return { meta, content }
}

function parseFrontmatter(raw) {
  const lines = raw.split('\n')
  const result = {}
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
    result[key] = value
  }
  // Normalize types
  if (result.readTime) result.readTime = parseInt(result.readTime)
  if (result.featured) result.featured = result.featured === 'true'
  if (result.tags) result.tags = result.tags.split(',').map(t => t.trim())
  return result
}

function parseBody(body) {
  const lines = body.split('\n')
  const sections = []
  let intro = []
  let currentSection = null
  let inIntro = true

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inIntro) {
        inIntro = false
      } else if (currentSection) {
        sections.push({
          id: `section-${sections.length + 1}`,
          heading: currentSection.heading,
          body: currentSection.body.join('\n').trim()
        })
      }
      currentSection = { heading: line.slice(3).trim(), body: [] }
    } else if (line.startsWith('# ')) {
      // Top-level heading: skip, treated as title
      inIntro = false
    } else if (inIntro) {
      intro.push(line)
    } else if (currentSection) {
      currentSection.body.push(line)
    }
  }

  if (currentSection) {
    sections.push({
      id: `section-${sections.length + 1}`,
      heading: currentSection.heading,
      body: currentSection.body.join('\n').trim()
    })
  }

  return {
    introduction: intro.join('\n').trim(),
    sections
  }
}
```

**Step 2: Manual smoke test**

In browser console or a quick Node script, call `parseArticleMarkdown` with a sample markdown string and confirm `meta` and `content.sections` are correct.

**Step 3: Commit**

```bash
git add src/lib/markdownParser.js
git commit -m "feat: add markdown frontmatter + section parser"
```

---

## Task 3: Supabase Storage Upload Helper

**Files:**
- Create: `src/lib/supabaseStorage.js`

**Step 1: Write the upload helper**

Create `src/lib/supabaseStorage.js`:

```js
import { supabase } from './supabase'

const BUCKET = 'article-images'

/**
 * Upload a File object to Supabase Storage.
 * @param {File} file - The image file
 * @param {string} articleSlug - Used as folder prefix
 * @returns {Promise<{ storagePath: string, publicUrl: string }>}
 */
export async function uploadArticleImage(file, articleSlug) {
  const ext = file.name.split('.').pop()
  const filename = `${articleSlug}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`)

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return {
    storagePath: data.path,
    publicUrl: urlData.publicUrl
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/supabaseStorage.js
git commit -m "feat: add supabase storage image upload helper"
```

---

## Task 4: useIngestion Hook

**Files:**
- Create: `src/hooks/useIngestion.js`

This hook orchestrates the full pipeline: receive files → parse document → upload images → save to DB.

**Step 1: Write the hook**

Create `src/hooks/useIngestion.js`:

```js
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { parseArticleMarkdown } from '../lib/markdownParser'
import { uploadArticleImage } from '../lib/supabaseStorage'

export function useIngestion() {
  const [status, setStatus] = useState('idle') // idle | parsing | uploading | saving | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  async function processFiles(files) {
    setStatus('parsing')
    setError(null)

    try {
      // 1. Find the document file
      const docFile = Array.from(files).find(f =>
        f.name.endsWith('.md') || f.name.endsWith('.txt')
      )
      if (!docFile) throw new Error('No .md or .txt document found in folder')

      const text = await docFile.text()
      const { meta, content } = parseArticleMarkdown(text)

      // 2. Identify image files
      const imageFiles = Array.from(files).filter(f =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
      )

      const heroFile = imageFiles.find(f => /^hero\./i.test(f.name))
      const sectionFiles = imageFiles.filter(f => !/^hero\./i.test(f.name))

      setPreview({ meta, content, heroFile, sectionFiles, imageFiles })
      setStatus('idle')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  async function saveToDatabase(preview) {
    setStatus('uploading')
    setError(null)

    try {
      const { meta, content, heroFile, imageFiles } = preview
      const slug = meta.slug

      setProgress({ current: 0, total: imageFiles.length + 2, message: 'Uploading images...' })

      // 1. Upload hero image
      let heroImageUrl = null
      if (heroFile) {
        const result = await uploadArticleImage(heroFile, slug)
        heroImageUrl = result.publicUrl
        setProgress(p => ({ ...p, current: p.current + 1, message: `Uploaded ${heroFile.name}` }))
      }

      // 2. Upload section images → build a filename→url map
      const imageMap = {}
      for (const file of imageFiles.filter(f => f !== heroFile)) {
        const result = await uploadArticleImage(file, slug)
        imageMap[file.name] = result.publicUrl
        setProgress(p => ({ ...p, current: p.current + 1, message: `Uploaded ${file.name}` }))
      }

      setStatus('saving')
      setProgress(p => ({ ...p, message: 'Saving to database...' }))

      // 3. Upsert destination (if destination slug provided in meta)
      let destinationId = null
      if (meta.destination) {
        const { data: destData, error: destError } = await supabase
          .from('destinations')
          .upsert({ slug: meta.destination, name: meta.destination }, { onConflict: 'slug' })
          .select('id')
          .single()
        if (destError) throw destError
        destinationId = destData.id
      }

      // 4. Upsert event
      let eventId = null
      if (meta.eventName) {
        const eventSlug = slug // article slug = event slug
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .upsert({
            slug: eventSlug,
            destination_id: destinationId,
            name: meta.eventName,
            type: meta.eventType || null,
            start_date: meta.startDate || null,
            end_date: meta.endDate || null,
            featured: meta.featured || false,
            hero_image_url: heroImageUrl
          }, { onConflict: 'slug' })
          .select('id')
          .single()
        if (eventError) throw eventError
        eventId = eventData.id
      }

      // 5. Upsert article
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .upsert({
          slug,
          event_id: eventId,
          title: meta.title,
          subtitle: meta.subtitle || null,
          category: meta.category || null,
          tags: meta.tags || [],
          issue: meta.issue || null,
          author_name: meta.author || null,
          author_role: meta.authorRole || null,
          read_time: meta.readTime || null,
          status: meta.status || 'draft',
          is_featured: meta.featured || false,
          hero_image_url: heroImageUrl,
          content
        }, { onConflict: 'slug' })
        .select('id')
        .single()
      if (articleError) throw articleError

      // 6. Insert image records
      const imageRecords = imageFiles.map(f => ({
        article_id: articleData.id,
        filename: f.name,
        storage_path: `${slug}/${f.name}`,
        public_url: f === heroFile ? heroImageUrl : (imageMap[f.name] || ''),
        alt_text: f.name.replace(/\.[^.]+$/, '').replace(/-/g, ' ')
      }))

      if (imageRecords.length > 0) {
        const { error: imgError } = await supabase.from('images').insert(imageRecords)
        if (imgError) throw imgError
      }

      setProgress(p => ({ ...p, current: p.total, message: 'Done!' }))
      setStatus('done')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setPreview(null)
    setError(null)
    setProgress({ current: 0, total: 0, message: '' })
  }

  return { status, progress, preview, error, processFiles, saveToDatabase, reset }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useIngestion.js
git commit -m "feat: add useIngestion hook for parse → upload → save pipeline"
```

---

## Task 5: AdminIngestion Page

**Files:**
- Create: `src/pages/AdminIngestion.jsx`

**Step 1: Write the page**

Create `src/pages/AdminIngestion.jsx`:

```jsx
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Image, CheckCircle, AlertCircle, ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useIngestion } from '../hooks/useIngestion'

export default function AdminIngestion() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { status, progress, preview, error, processFiles, saveToDatabase, reset } = useIngestion()

  const handleFolderInput = useCallback(async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFiles(files)
    }
  }, [processFiles])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    const items = e.dataTransfer.items
    const files = []
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) {
        await collectFiles(entry, files)
      }
    }
    if (files.length > 0) await processFiles(files)
  }, [processFiles])

  async function collectFiles(entry, files) {
    if (entry.isFile) {
      const file = await new Promise(res => entry.file(res))
      files.push(file)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await new Promise(res => reader.readEntries(res))
      for (const child of entries) await collectFiles(child, files)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-stone-950 text-stone-50 shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import Content</h1>
            <p className="text-stone-400 text-sm mt-1">Drop a folder to ingest an article</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Drop Zone */}
        {status === 'idle' && !preview && (
          <label
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-stone-300 rounded-2xl bg-white cursor-pointer hover:border-[#00E676] hover:bg-stone-50 transition-all"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <Upload size={48} className="text-stone-400 mb-4" />
            <p className="text-lg font-semibold text-stone-700">Drop article folder here</p>
            <p className="text-sm text-stone-500 mt-1">or click to browse — select the folder containing article.md + images</p>
            <input
              type="file"
              webkitdirectory="true"
              multiple
              className="hidden"
              onChange={handleFolderInput}
            />
          </label>
        )}

        {/* Folder format guide */}
        {status === 'idle' && !preview && (
          <div className="bg-stone-100 rounded-xl p-6 text-sm text-stone-600 font-mono">
            <p className="font-semibold text-stone-800 mb-3 font-sans text-base">Expected folder format:</p>
            <pre className="text-xs leading-relaxed">{`my-article-folder/
├── article.md     ← Required (frontmatter + body)
├── hero.jpg       ← Optional hero image
├── section-1.jpg  ← Other images
└── section-2.jpg`}</pre>
          </div>
        )}

        {/* Parsing / Uploading States */}
        {(status === 'parsing' || status === 'uploading' || status === 'saving') && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-stone-800">{progress.message || 'Processing...'}</p>
            {progress.total > 0 && (
              <div className="mt-4 w-full bg-stone-200 rounded-full h-2">
                <div
                  className="bg-[#00E676] h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Ingestion failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={reset}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && status === 'idle' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Preview</h2>
              <div className="flex gap-3">
                <button onClick={reset} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={() => saveToDatabase(preview)}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg"
                  style={{ backgroundColor: '#00E676', color: '#1a1a1a' }}
                >
                  <Send size={16} /> Save to Database
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Title" value={preview.meta.title} />
                <Field label="Slug" value={preview.meta.slug} />
                <Field label="Category" value={preview.meta.category} />
                <Field label="Status" value={preview.meta.status || 'draft'} />
                <Field label="Destination" value={preview.meta.destination} />
                <Field label="Event" value={preview.meta.eventName} />
                <Field label="Tags" value={(preview.meta.tags || []).join(', ')} />
                <Field label="Read Time" value={preview.meta.readTime ? `${preview.meta.readTime} min` : '—'} />
              </div>

              {/* Content preview */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Introduction</p>
                <p className="text-stone-700 text-sm line-clamp-3">{preview.content.introduction}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Sections ({preview.content.sections?.length || 0})</p>
                <div className="space-y-1">
                  {(preview.content.sections || []).map(s => (
                    <p key={s.id} className="text-sm text-stone-600">• {s.heading}</p>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Images ({preview.imageFiles?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {(preview.imageFiles || []).map(f => (
                    <span key={f.name} className="flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-xs text-stone-600">
                      <Image size={12} />
                      {f.name}
                      {preview.heroFile?.name === f.name && <span className="text-[#00E676] font-semibold ml-1">(hero)</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'done' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle size={48} className="text-[#00E676] mx-auto mb-4" />
            <p className="text-xl font-bold text-stone-900">Article saved!</p>
            <p className="text-stone-600 text-sm mt-2">Content is now in the database.</p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={reset}
                className="px-5 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50"
              >
                Import Another
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-5 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#00E676', color: '#1a1a1a' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="text-sm text-stone-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/AdminIngestion.jsx
git commit -m "feat: add admin ingestion page with drag-drop, preview, and save"
```

---

## Task 6: Wire Route + Dashboard Button

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/AdminDashboard.jsx`

**Step 1: Add route in App.jsx**

In `src/App.jsx`, after line 56 (existing `/admin/editor` route), add:

```jsx
const AdminIngestion = lazy(() => import('./pages/AdminIngestion'))
```

Add to routes (inside the admin block):

```jsx
<Route path="/admin/ingest" element={
  <ProtectedRoute>
    <AdminIngestion />
  </ProtectedRoute>
} />
```

**Step 2: Add "Import Content" button in AdminDashboard.jsx**

Find the existing header or action area in `AdminDashboard.jsx` where the "+ New Article" button lives. Add:

```jsx
import { Upload } from 'lucide-react'
// ...
<button
  onClick={() => navigate('/admin/ingest')}
  className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm text-stone-100 transition-colors"
>
  <Upload size={16} />
  Import Content
</button>
```

**Step 3: Commit**

```bash
git add src/App.jsx src/pages/AdminDashboard.jsx
git commit -m "feat: add /admin/ingest route and Import Content button in dashboard"
```

---

## Task 7: useContent Hook (replaces destinations.js)

**Files:**
- Create: `src/hooks/useContent.js`

This is a data-fetching hook that replaces the hardcoded `destinations.js` with live Supabase queries.

**Step 1: Write the hook**

Create `src/hooks/useContent.js`:

```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDestinations() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('destinations')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setDestinations(data || [])
        setLoading(false)
      })
  }, [])

  return { destinations, loading, error }
}

export function useDestination(slug) {
  const [destination, setDestination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('destinations')
      .select('*, events(*, articles(*))')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setDestination(data)
        setLoading(false)
      })
  }, [slug])

  return { destination, loading, error }
}

export function useEvent(slug) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('events')
      .select('*, articles(*), destinations(name, slug)')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setEvent(data)
        setLoading(false)
      })
  }, [slug])

  return { event, loading, error }
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('events')
      .select('*, destinations(name, slug), articles(title, subtitle, hero_image_url)')
      .eq('featured', true)
      .then(({ data }) => {
        setEvents(data || [])
        setLoading(false)
      })
  }, [])

  return { events, loading }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useContent.js
git commit -m "feat: add useContent hooks for live Supabase data fetching"
```

---

## Task 8: Migrate Pages to useContent (optional, after data is in DB)

> **Note:** Only do this task AFTER you have run the migration script (Task 9) and confirmed data is in Supabase. This prevents a blank site while the DB is empty.

**Files:**
- Modify: `src/pages/DestinationsPage.jsx`
- Modify: `src/pages/DestinationDetailPage.jsx`
- Modify: `src/pages/EventDetailPage.jsx`
- Modify: `src/pages/HomePage.jsx`

**Step 1: Replace destinations.js import in each page**

For `DestinationsPage.jsx`, replace:
```js
import { destinations } from '../data/destinations'
// const items = Object.values(destinations)
```
With:
```js
import { useDestinations } from '../hooks/useContent'
// const { destinations, loading } = useDestinations()
```

Repeat for other pages using the appropriate hook (`useDestination(slug)`, `useEvent(slug)`, `useFeaturedEvents()`).

Add loading states where needed:
```jsx
if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin" /></div>
```

**Step 2: Test all public pages render correctly**

Run `npm run dev` and verify:
- `/destinations` → shows destination cards
- `/destination/kandy` → shows full destination page
- `/event/kandy-perahera` → shows event + article
- `/` → shows featured events

**Step 3: Commit**

```bash
git add src/pages/DestinationsPage.jsx src/pages/DestinationDetailPage.jsx src/pages/EventDetailPage.jsx src/pages/HomePage.jsx
git commit -m "feat: migrate public pages from hardcoded data to live Supabase queries"
```

---

## Task 9: One-Time Migration Script

**Files:**
- Create: `scripts/migrateHardcodedContent.js`

This script reads `destinations.js` and pushes all destinations, events, and articles into Supabase.

**Step 1: Write the script**

Create `scripts/migrateHardcodedContent.js`:

```js
import { createClient } from '@supabase/supabase-js'
import { destinations } from '../src/data/destinations.js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // Use service key for migration (bypasses RLS)
)

async function run() {
  console.log('Starting migration of hardcoded data to Supabase...')

  for (const [slug, dest] of Object.entries(destinations)) {
    console.log(`\nProcessing destination: ${slug}`)

    // Upsert destination
    const { data: destData, error: destError } = await supabase
      .from('destinations')
      .upsert({
        slug,
        name: dest.name,
        tagline: dest.tagline,
        description: dest.description,
        hero_image_url: dest.heroImage,
        region: dest.region,
        highlights: dest.highlights || [],
        stats: dest.stats || {},
        coordinates: dest.coordinates,
        general_things_to_do: dest.generalThingsToDo || []
      }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (destError) { console.error(`Destination error for ${slug}:`, destError.message); continue }
    console.log(`  ✓ Destination upserted: ${destData.id}`)

    // Upsert events
    for (const event of (dest.events || [])) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .upsert({
          slug: event.slug,
          destination_id: destData.id,
          name: event.name,
          type: event.type,
          season: event.season,
          duration: event.duration,
          start_date: event.startDate || null,
          end_date: event.endDate || null,
          featured: event.featured || false,
          hero_image_url: event.image,
          description: event.description,
          things_to_do: event.thingsToDo || [],
          accommodations: event.accommodations || [],
          restaurants: event.restaurants || []
        }, { onConflict: 'slug' })
        .select('id')
        .single()

      if (eventError) { console.error(`  Event error for ${event.slug}:`, eventError.message); continue }
      console.log(`  ✓ Event upserted: ${event.slug}`)

      // Upsert article
      if (event.article) {
        const art = event.article
        const { error: artError } = await supabase
          .from('articles')
          .upsert({
            slug: event.slug,
            event_id: eventData.id,
            title: art.title,
            subtitle: art.subtitle,
            category: art.category,
            tags: art.tags || [],
            issue: art.issue,
            author_name: art.author?.name,
            author_role: art.author?.role,
            author_bio: art.author?.bio,
            author_avatar_url: art.author?.avatar,
            read_time: art.readTime,
            published_date: art.publishedDate || null,
            status: 'published',
            is_featured: event.featured || false,
            hero_image_url: event.image,
            content: art.content || {}
          }, { onConflict: 'slug' })

        if (artError) console.error(`    Article error:`, artError.message)
        else console.log(`    ✓ Article upserted`)
      }
    }
  }

  console.log('\n✅ Migration complete!')
}

run().catch(console.error)
```

**Step 2: Add the service key to .env**

In `.env`, add:
```
SUPABASE_SERVICE_KEY=your-service-role-key-from-supabase-dashboard
```
(Find it in Supabase → Settings → API → service_role secret)

**Step 3: Add script to package.json**

In `package.json` scripts, add:
```json
"migrate:hardcoded": "node scripts/migrateHardcodedContent.js"
```

**Step 4: Run it**

```bash
npm run migrate:hardcoded
```

Expected output: Each destination, event, and article logged with `✓`.

**Step 5: Verify in Supabase dashboard**

Go to Supabase → Table Editor → `destinations`, `events`, `articles` → confirm rows exist.

**Step 6: Commit**

```bash
git add scripts/migrateHardcodedContent.js package.json .env.example
git commit -m "feat: add one-time migration script for hardcoded content to Supabase"
```

---

## Execution Order

```
Task 1: Supabase DB Setup    (prerequisite for everything)
Task 2: Markdown Parser      (no deps)
Task 3: Storage Helper       (no deps)
Task 4: useIngestion Hook    (deps: 2, 3)
Task 5: AdminIngestion Page  (deps: 4)
Task 6: Route + Dashboard    (deps: 5)
Task 7: useContent Hook      (no deps, do in parallel with 2-6)
Task 9: Migration Script     (deps: 1, 7)
Task 8: Migrate Pages        (deps: 7, 9 - do LAST)
```

## Testing Checklist

After each task:
- [ ] `npm run dev` starts without errors
- [ ] No console errors in browser
- [ ] Admin routes still protected (redirect to login if not authed)

After Task 6 (ingestion page live):
- [ ] Navigate to `/admin/ingest` — drop zone renders
- [ ] Drop a folder with `article.md` + images — preview appears with correct metadata
- [ ] Click "Save to Database" — progress bar fills, success screen shows
- [ ] Check Supabase dashboard — row appears in `articles`, `events`, `images`
- [ ] Check Supabase Storage — images appear in `article-images` bucket

After Task 8 (pages migrated):
- [ ] `/` loads with featured events from DB
- [ ] `/destinations` shows destination cards from DB
- [ ] `/destination/kandy` loads full page
- [ ] `/event/kandy-perahera` shows article content

---

## Environment Variables Required

```bash
# Already in .env:
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Add for migration script only:
SUPABASE_SERVICE_KEY=eyJ...  # service_role key, never expose to browser
```

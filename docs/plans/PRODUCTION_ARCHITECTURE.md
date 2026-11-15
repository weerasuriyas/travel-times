# Production Architecture Plan: Multi-Article System with Supabase

## Overview
Transform the travel blog from a single hardcoded article to a scalable multi-article system with:
- **Supabase** (Postgres + API + Storage) for backend
- **Custom admin panel** for content management (✅ UI mockup complete)
- **Dynamic routing** for multiple articles
- **Archive system** for preserving article history
- **Image management** with S3/Cloudinary URLs stored in database

---

## Database Schema (Supabase/Postgres)

### 1. Articles Table
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT,
  tags TEXT[],
  issue TEXT,
  published_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ DEFAULT NOW(),

  -- Author info
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_bio TEXT,
  author_avatar_url TEXT,

  -- Reading metadata
  read_time INTEGER, -- minutes
  word_count INTEGER,
  featured_type TEXT,

  -- Location
  location_name TEXT,
  location_coordinates POINT,
  location_region TEXT,
  location_country TEXT,

  -- Images
  hero_image_url TEXT NOT NULL,
  hero_image_alt TEXT,
  hero_image_caption TEXT,

  -- Content (stored as JSONB for flexibility)
  content JSONB NOT NULL,
  -- Structure: { introduction, sections, featured }

  -- Visual plates
  plates JSONB,
  -- Structure: [{ id, image, label, description, backgroundColor, icon }]

  -- Map data
  map_data JSONB,
  -- Structure: { center, zoom, routes, landmarks }

  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  social_image_url TEXT,

  -- Status & visibility
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_featured BOOLEAN DEFAULT false,

  -- Layout preferences
  layout_preferences JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_date ON articles(published_date DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
```

### 2. Accommodations Table
```sql
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  price_range TEXT,
  rating DECIMAL(2,1),
  description TEXT,
  image_url TEXT,
  tags TEXT[],
  coordinates POINT NOT NULL,
  amenities TEXT[],
  booking_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accommodations_article ON accommodations(article_id);
```

### 3. Article Archive Table (Optional - for version history)
```sql
CREATE TABLE article_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  archived_data JSONB NOT NULL, -- Full snapshot of article
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  archived_by TEXT -- user email or ID
);

CREATE INDEX idx_archive_article ON article_archive(article_id, version DESC);
```

### 4. Images Table (Optional - track all uploaded images)
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Admin Users Table (Role-based access control)
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'editor', -- 'super_admin', 'admin', 'editor'
  permissions JSONB, -- Custom permissions if needed
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;

-- Row Level Security Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own admin record
CREATE POLICY "Users can view their own admin record"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Only super admins can create new admin users
CREATE POLICY "Super admins can create admin users"
  ON admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌─────────────────────────┐    │
│  │   Public Site   │         │     Admin Panel         │    │
│  ├─────────────────┤         ├─────────────────────────┤    │
│  │ - HomePage      │         │ - Dashboard ✅          │    │
│  │ - ArticlePage   │         │ - Article Editor ✅     │    │
│  │ - ArchivePage   │         │ - Image Manager         │    │
│  │ - Navigation    │         │ - Preview               │    │
│  └────────┬────────┘         └──────────┬──────────────┘    │
│           │                             │                    │
│           └──────────────┬──────────────┘                    │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    ┌──────▼─────────┐
                    │  Supabase API  │
                    └──────┬─────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼─────┐    ┌──────▼────────┐  ┌────▼─────────┐
    │ Postgres │    │   Supabase    │  │ Supabase RLS │
    │ Database │    │    Storage    │  │   Auth       │
    └──────────┘    └───────────────┘  └──────────────┘
         │                 │
         │                 │
    ┌────▼─────┐    ┌──────▼────────┐
    │ Articles │    │ Image Files   │
    │   Data   │    │  (CDN/S3)     │
    └──────────┘    └───────────────┘
```

---

## Implementation Plan

### Phase 1: Supabase Setup & Schema ⏳

1. **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project
   - Get API URL and anon key
   - Enable Storage bucket for images

2. **Create Database Tables**
   - Run SQL migrations to create tables
   - Set up Row Level Security (RLS) policies
   - Create indexes for performance

3. **Configure Storage**
   - Create `article-images` bucket
   - Set public read access
   - Configure upload policies

4. **Setup Environment Variables**
   - Create `.env` file with Supabase credentials
   - Add to `.gitignore`

### Phase 2: Frontend Data Layer ⏳

**Files to Create:**
- `src/lib/supabase.js` - Supabase client setup
- `src/hooks/useArticles.js` - React hook for fetching articles
- `src/hooks/useArticle.js` - Hook for single article
- `src/utils/articleMapper.js` - Map DB data to component props
- `src/services/api.js` - API service functions

**Files to Modify:**
- `src/App.jsx` - Update routing to support article slugs
- `src/pages/ArticlePage.jsx` - Load data from Supabase
- `src/pages/HomePage.jsx` - Fetch article list from Supabase

**Key Changes:**

**src/lib/supabase.js** (NEW)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**src/hooks/useArticles.js** (NEW)
```javascript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useArticles(filters = {}) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchArticles() {
      let query = supabase
        .from('articles')
        .select('*')
        .order('published_date', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.featured) {
        query = query.eq('is_featured', true)
      }

      const { data, error } = await query

      if (error) {
        setError(error)
      } else {
        setArticles(data)
      }
      setLoading(false)
    }

    fetchArticles()
  }, [filters])

  return { articles, loading, error }
}
```

**src/App.jsx** (MODIFY)
```javascript
// Current: #article → single article
// Updated: #article/:slug → dynamic article

function getPageAndSlugFromHash() {
  const hash = window.location.hash.slice(1) || ''
  const [page, slug] = hash.split('/')
  return { page: page || 'home', slug }
}

// In component:
const [currentPage, setCurrentPage] = useState('home')
const [articleSlug, setArticleSlug] = useState(null)

useEffect(() => {
  const { page, slug } = getPageAndSlugFromHash()
  setCurrentPage(page)
  setArticleSlug(slug)
}, [])

// Render:
{currentPage === 'article' && (
  <ArticlePage
    slug={articleSlug}
    setCurrentPage={setCurrentPage}
    // ... other props
  />
)}
```

**src/pages/ArticlePage.jsx** (MODIFY)
```javascript
// Add at top:
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ArticlePage({ slug, ...otherProps }) {
  const [article, setArticle] = useState(null)
  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArticle() {
      // Fetch article
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (articleError) {
        console.error('Article not found:', articleError)
        setLoading(false)
        return
      }

      // Fetch accommodations
      const { data: accomData } = await supabase
        .from('accommodations')
        .select('*')
        .eq('article_id', articleData.id)
        .order('display_order')

      setArticle(articleData)
      setAccommodations(accomData || [])
      setLoading(false)
    }

    if (slug) {
      fetchArticle()
    }
  }, [slug])

  if (loading) return <div>Loading...</div>
  if (!article) return <div>Article not found</div>

  // Use article data instead of hardcoded values:
  // article.title, article.subtitle, article.content, etc.
  // accommodations array from DB
  // article.map_data for map routes
}
```

### Phase 3: Admin Panel ✅ (UI Complete)

**Files Created:**
- ✅ `src/pages/AdminDashboard.jsx` - Admin home (complete)
- ✅ `src/pages/AdminArticleEditor.jsx` - Create/edit articles (complete)

**Still Needed:**
- `src/components/admin/ImageUploader.jsx` - Actual image upload to Supabase
- `src/components/admin/RichTextEditor.jsx` - Rich text content editor
- `src/components/admin/MapEditor.jsx` - Visual map route editor
- `src/utils/imageUpload.js` - Handle image uploads to Supabase Storage

**Admin Panel Features (Implemented):**
- ✅ Dashboard with stats overview
- ✅ Article listing with search and filters
- ✅ Status management (draft/published/archived)
- ✅ Article editor with 5 tabs (Basic, Content, Images, Map, Accommodations)
- ✅ Form validation and state management
- ✅ Preview and save functionality (UI only)
- ✅ Responsive design matching site aesthetics

**Next Steps for Admin:**
1. Connect form submissions to Supabase API
2. Implement actual image upload to Supabase Storage
3. Integrate rich text editor (React Quill or similar)
4. Build visual map editor with Leaflet
5. Add authentication (Supabase Auth)

### Phase 4: Routing ✅ (Done — Next.js App Router as of 2026-04-29)

The routing went through two migrations:
1. Hash-based → `react-router-dom` (early 2026)
2. `react-router-dom` → **Next.js App Router** (2026-04-29)

**Current Implementation** (file-based under `app/`):

```
app/
├── (public)/                    ← Layout (header/footer)
│   ├── page.jsx                 → /
│   ├── destinations/page.jsx    → /destinations
│   ├── destination/[slug]/page.jsx
│   ├── articles/page.jsx
│   ├── article/[slug]/page.jsx
│   └── about|contact|privacy|terms/page.jsx
└── admin/
    ├── login/page.jsx           → /admin/login (no protection)
    ├── articles/[id]/page.jsx   → protected, no sidebar
    └── (sidebar)/               ← ProtectedRoute + AdminLayout
        ├── page.jsx             → /admin
        ├── write/, staging/, ingest/, settings/, about/, users/page.jsx
        └── destinations/page.jsx + new/ + [id]/
```

Page bodies live in `src/views/*` and are re-exported by the matching `app/**/page.jsx`. Pages that touch `window` (Leaflet, Google Maps wrappers) use `'use client' + next/dynamic({ ssr: false })`. See `app.js` for how the Next handler is composed with the Express `/api/*` surface.

### Phase 5: Archive System ⏳

**Files to Create:**
- `src/pages/ArchivePage.jsx` - Archive listing

**Archive Features:**
1. List all published articles by date
2. Filter by category/tag/year
3. Search functionality
4. Click to read archived articles

**Version History (Optional):**
- Store article snapshots in `article_archive` table
- Show version history in admin panel
- Restore previous versions
- Track who made changes

### Phase 6: Migration ⏳

**Migrate Existing Article:**

Create migration script: `scripts/migrateKandyArticle.js`

```javascript
import { supabase } from '../src/lib/supabase.js'

const kandyArticle = {
  slug: 'kandy-perahera',
  title: 'THE FIRE OF KANDY.',
  subtitle: 'We walked through the smoke of a thousand copra torches...',
  category: 'Culture',
  tags: ['Festival', 'Heritage', 'Buddhist', 'Kandy'],
  issue: 'Issue 04: The Relic',
  author_name: 'Sanath Weerasuriya',
  author_role: 'Field Correspondent',
  read_time: 8,
  location_name: 'Kandy, Sri Lanka',
  location_coordinates: '(7.2906, 80.6337)',
  hero_image_url: '/perahera_banner.jpg',
  content: {
    introduction: 'First paragraph text...',
    sections: [
      {
        id: 'section-1',
        body: 'Full article text...',
        highlight: {
          type: 'quote',
          content: 'The Esala Perahera draws more than a million...'
        }
      }
    ],
    featured: {
      heading: 'The Top Attraction',
      items: [{
        name: 'SINHA RAJA',
        label: 'Lead Tusker',
        description: 'Carrying the golden Karanduwa...',
        details: {
          flankedBy: ['Myan Raja', 'Buruma Raja']
        }
      }]
    }
  },
  plates: [
    {
      id: 'plate-01',
      image: '/src/assets/images/plate_emblems.jpg',
      label: 'Plate 01: Emblems',
      backgroundColor: '#FFFFFF',
      icon: 'layers'
    },
    // ... other plates
  ],
  map_data: {
    center: [7.2936, 80.6413],
    zoom: 15,
    routes: [{
      id: 'perahera-route',
      name: 'Esala Perahera Procession Route',
      coordinates: [[7.2936,80.6413], [7.2944,80.6398], ...],
      color: '#FF3D00',
      dashArray: '10, 10',
      weight: 3
    }],
    landmarks: [{
      name: 'Sri Dalada Maligawa',
      coordinates: [7.2936, 80.6413],
      type: 'temple'
    }]
  },
  status: 'published',
  is_featured: true,
  published_date: '2026-01-15'
}

// Insert article
const { data: article, error } = await supabase
  .from('articles')
  .insert(kandyArticle)
  .select()
  .single()

// Insert accommodations
const accommodations = [
  {
    article_id: article.id,
    name: "Queen's Hotel",
    type: "Heritage Listed",
    price_range: "$80 - $150",
    rating: 4.2,
    description: "A colonial gem...",
    image_url: "https://images.unsplash.com/...",
    tags: ["Historic", "Central", "Colonial"],
    coordinates: '(7.2928, 80.6405)',
    display_order: 1
  },
  // ... more hotels
]

await supabase.from('accommodations').insert(accommodations)
```

---

## Image Handling Strategy

### Upload Flow:
1. User uploads image in admin panel
2. Image uploaded to Supabase Storage
3. URL returned and stored in database
4. Use URL in article rendering

### Supabase Storage Setup:
```javascript
// Upload image
async function uploadImage(file, bucket = 'article-images') {
  const filename = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file)

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename)

  return publicUrl
}
```

### Alternative: Upload to S3/Cloudinary
```javascript
// Use aws-sdk or cloudinary SDK
// Store returned URL in Supabase database
```

---

## Dependencies

### Installed ✅
- `next` ✅ (App Router; replaced react-router-dom on 2026-04-29)
- `@supabase/supabase-js` ✅
- `date-fns` ✅
- `@tiptap/*` ✅ (rich-text editor — already in admin)

### Still Possibly Needed
```bash
npm install @tanstack/react-query # For better data fetching/caching
npm install react-hook-form # Form management
npm install zod # Schema validation
```
(TipTap is already in use; no need for `react-quill`.)

---

## Current Status

### ✅ Completed
1. Project analysis and architecture design
2. Admin panel UI mockup (Dashboard + Editor)
3. Dependencies installed (@supabase, next, date-fns, @tiptap)
4. Routing setup for admin pages (Next.js App Router under `app/admin/(sidebar)/*`)

### ⏳ In Progress
- Supabase project setup
- Database schema creation
- Frontend data layer integration

### 📋 To Do
1. Create Supabase project and configure
2. Set up database tables with SQL migrations
3. Integrate Supabase client in frontend
4. Update ArticlePage to fetch from database
5. Update HomePage to fetch article list
6. Connect admin panel forms to Supabase API
7. Implement image upload functionality
8. Add rich text editor
9. Create visual map editor
10. Build archive page
11. Migrate existing Kandy article to database
12. Add authentication for admin panel
13. Deploy to production

---

## Verification Checklist

### 1. Database Verification
- [ ] Supabase project created
- [ ] Tables created with correct schema
- [ ] RLS policies configured
- [ ] Storage bucket created
- [ ] Sample article migrated successfully
- [ ] Query articles via Supabase dashboard

### 2. Frontend Verification
- [ ] Homepage loads article list from Supabase
- [ ] Click article navigates to correct slug
- [ ] ArticlePage loads data dynamically
- [ ] Map renders with database coordinates
- [ ] Accommodations display from database
- [ ] Images load from Supabase Storage

### 3. Admin Panel Verification
- [x] Navigate to /#admin (UI works)
- [x] View article listing (mock data)
- [x] Open article editor (UI works)
- [ ] Create new article via form (connect to DB)
- [ ] Upload images successfully
- [ ] Save article to database
- [ ] Preview article before publishing
- [ ] Publish article and verify on public site
- [ ] Edit existing article
- [ ] Archive article

### 4. Archive Verification
- [ ] Navigate to /archive
- [ ] List all published articles
- [ ] Filter by category
- [ ] Search functionality works
- [ ] Click archived article opens correctly

### 5. Production Readiness
- [ ] Environment variables configured
- [ ] Image optimization implemented
- [ ] SEO meta tags dynamic per article
- [ ] Performance tested (Lighthouse score)
- [ ] Mobile responsive verified
- [ ] Error handling for missing articles
- [ ] Loading states implemented
- [ ] Authentication for admin panel

---

## Architecture Benefits

✅ **Scalability**: Unlimited articles without code changes
✅ **Maintainability**: Content separate from code
✅ **Version Control**: Track article changes over time
✅ **Collaboration**: Multiple authors can contribute
✅ **Performance**: Database indexing, lazy loading
✅ **SEO**: Dynamic meta tags per article
✅ **Archive**: Historical article preservation
✅ **Admin UX**: Visual editors, minimal code required
✅ **Flexibility**: Easy to add new article types/features
✅ **Cost-Effective**: Supabase free tier generous (500MB DB, 1GB storage, 2GB bandwidth)

---

## Next Steps

When ready to implement the backend:

1. **Set up Supabase account** at https://supabase.com
2. **Create new project** and note credentials
3. **Run database migrations** from this document
4. **Update `.env`** with your Supabase URL and anon key
5. **Implement data fetching hooks** in frontend
6. **Connect admin forms** to Supabase API
7. **Test end-to-end** article creation and publishing

For questions or assistance, refer to:
- Supabase Documentation: https://supabase.com/docs
- React Query Documentation: https://tanstack.com/query/latest/docs/react/overview
- This architecture document

# Content Preservation & Migration Guide

This guide explains how to safely migrate your content from hardcoded JavaScript files to a Supabase database while ensuring **zero data loss**.

## 📋 Overview

Currently, your content is hardcoded in:
- `src/data/articles.js` - All articles
- `src/data/destinations.js` - All destinations

**Goal**: Move this content to a Supabase database so it can be:
- ✅ Edited via admin panel
- ✅ Version controlled (automatic backups of every change)
- ✅ Scalable (add unlimited articles without code changes)
- ✅ Preserved (multiple layers of backup protection)

## 🔄 Migration Process (Step-by-Step)

### Phase 1: Backup Your Current Content

**Before doing ANYTHING**, create a backup:

```bash
npm run backup
```

This creates a timestamped JSON file in `backups/` with all your current content. **Keep this file safe** - it's your insurance policy.

Output:
```
✅ Backup created successfully!
📁 File: content-backup-2026-01-28T10-30-00-000Z.json
📊 Articles: 3
📍 Destinations: 6
```

### Phase 2: Set Up Supabase

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Create a new organization and project
   - Choose a region (closest to your users)

2. **Get Your Credentials**
   - In your Supabase project dashboard, go to Settings → API
   - Copy:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - Anon/Public Key (starts with `eyJ...`)

3. **Configure Environment Variables**

   Create `.env` file in project root:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxx...
   ```

   **IMPORTANT**: Make sure `.env` is in your `.gitignore` (it already is)!

4. **Run Database Migration**

   In Supabase dashboard:
   - Go to SQL Editor
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"

   You should see success messages confirming tables were created.

### Phase 3: Test Connection

Before migrating, verify your setup works:

```bash
# This will test your Supabase connection
npm run migrate
```

If you see connection errors:
- Check your `.env` file has correct credentials
- Verify tables were created in Supabase (go to Table Editor)
- Ensure your API key is correct

### Phase 4: Migrate Content

Once connection is confirmed:

```bash
npm run migrate
```

The script will:
1. ✅ Test Supabase connection
2. ✅ Check if content already exists (prevents duplicates)
3. ✅ Migrate all articles
4. ✅ Migrate all destinations
5. ✅ Migrate accommodations linked to articles
6. ✅ Migrate restaurants linked to articles
7. ✅ Create a migration report

Output:
```
🔍 Starting safe migration to Supabase...
✅ Connected to Supabase

📦 Starting content migration...
Migrating article: THE FIRE OF KANDY...
  ✅ Migrated: THE FIRE OF KANDY.
Migrating article: ELLA TO KANDY...
  ✅ Migrated: ELLA TO KANDY.
...

📊 Migration Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Articles: 3 migrated
✅ Destinations: 6 migrated
✅ Accommodations: 9 migrated
✅ Restaurants: 15 migrated

✨ Migration complete!
```

### Phase 5: Verify in Supabase

1. Go to Supabase Dashboard → Table Editor
2. Check each table has data:
   - `articles` - should have 3 rows
   - `destinations` - should have 6 rows
   - `accommodations` - should have 9 rows
   - `restaurants` - should have 15 rows

3. Click into a row to verify content looks correct

### Phase 6: Update Your App

Now your app needs to fetch from the database instead of hardcoded files.

**Files that need updates** (see PRODUCTION_ARCHITECTURE.md for details):
- `src/pages/ArticlePage.jsx` - Fetch article from Supabase
- `src/pages/HomePage.jsx` - Fetch article list from Supabase
- `src/pages/DestinationsPage.jsx` - Fetch destinations from Supabase

Example (ArticlePage.jsx):
```javascript
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function ArticlePage({ slug }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (data) setArticle(data);
      setLoading(false);
    }

    fetchArticle();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;

  // Use article.title, article.content, etc.
}
```

## 🛡️ Content Protection Layers

Your content is now protected by **5 layers**:

### Layer 1: Git Version Control
```bash
git add .
git commit -m "Pre-migration backup"
git tag v1.0-static
git push origin v1.0-static
```
You can always `git checkout v1.0-static` to go back to hardcoded version.

### Layer 2: JSON Backups
```bash
npm run backup  # Backup from JavaScript files
npm run backup:supabase  # Backup from database
```
Creates timestamped `.json` files you can restore from.

### Layer 3: Supabase Automatic Backups
Supabase automatically backs up your database:
- **Free plan**: Daily backups (7 days retention)
- **Pro plan**: Point-in-time recovery (7-30 days)

### Layer 4: Article Version History
Every time you edit an article, a snapshot is saved to `article_archive` table. You can restore any previous version.

### Layer 5: Keep Static Files (Temporary)
Don't delete `src/data/articles.js` and `src/data/destinations.js` for 30 days. They're your fallback if something goes wrong.

## 🔄 Regular Backups

**Set up a backup schedule**:

```bash
# Weekly backup from Supabase
npm run backup:supabase
```

Or automate with GitHub Actions (create `.github/workflows/backup.yml`):

```yaml
name: Weekly Database Backup
on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday at midnight
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run backup:supabase
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/*.json
          retention-days: 90
```

## 🔙 Rollback Procedures

### Rollback Option 1: Restore from Backup File

```bash
npm run restore backups/content-backup-2026-01-28T10-30-00-000Z.json
```

This will:
- ⚠️  Delete all current database content
- ✅ Restore content from the backup file
- ✅ Recreate all articles, destinations, etc.

### Rollback Option 2: Git Checkout

```bash
# Go back to hardcoded version
git checkout v1.0-static
npm install
npm run dev
```

Your static site is back instantly.

### Rollback Option 3: Restore Specific Article Version

From Supabase SQL Editor:

```sql
-- View all versions of an article
SELECT version, archived_at, archived_by
FROM article_archive
WHERE article_id = 'your-article-uuid'
ORDER BY version DESC;

-- Restore specific version
UPDATE articles
SET
  title = (SELECT archived_data->>'title' FROM article_archive WHERE id = 'archive-uuid'),
  content = (SELECT archived_data->'content' FROM article_archive WHERE id = 'archive-uuid')
  -- ... restore other fields
WHERE id = 'your-article-uuid';
```

## ✅ Verification Checklist

After migration, verify everything works:

- [ ] Run `npm run dev` - site loads without errors
- [ ] Navigate to homepage - articles display correctly
- [ ] Click an article - full content loads from database
- [ ] Check destinations page - all destinations visible
- [ ] Open Supabase dashboard - verify data in tables
- [ ] Test admin panel - can create/edit articles
- [ ] Check version history - old versions are saved
- [ ] Run `npm run backup:supabase` - backups work
- [ ] Images load correctly (URLs in database)

## 📊 Monitoring

Check your Supabase dashboard regularly:
- **Database**: Table Editor → View all content
- **Storage**: Check image uploads
- **Auth**: Monitor admin user logins
- **Logs**: Review API requests and errors
- **Usage**: Track bandwidth and storage

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Check `.env` file has correct URL and key
- Verify internet connection
- Check Supabase project is active (not paused)

### "Duplicate key value violates unique constraint"
- Articles with same slug already exist in database
- Either delete existing articles or change slugs

### "Article not found after migration"
- Check article status is 'published' not 'draft'
- Verify slug matches exactly (case-sensitive)
- Check RLS policies allow public read access

### "Images not loading"
- Image URLs in database must be absolute paths
- Local images (like `/perahera_banner.jpg`) need to be uploaded to Supabase Storage
- Update URLs in database after uploading

## 🚀 Next Steps

After successful migration:

1. **Test thoroughly** - Click through every page
2. **Create first article via admin** - Test the full workflow
3. **Set up automated backups** - GitHub Actions or cron job
4. **Deploy to production** - Vercel, Netlify, etc.
5. **Monitor for 1 week** - Keep static files as backup
6. **Remove static files** - After 30 days of stable operation

## 📞 Support

If you encounter issues:
1. Check the migration report in `backups/migration-report-*.json`
2. Review Supabase logs in dashboard
3. Restore from backup if needed
4. Refer to PRODUCTION_ARCHITECTURE.md for detailed architecture

---

**Remember**: With proper backups, you **cannot lose data**. Every step is reversible!

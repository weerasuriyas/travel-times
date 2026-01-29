# Hostinger + Supabase Backup Strategy

## 🎯 Understanding What Gets Backed Up Where

### What Hostinger Backs Up ✅
- Your React build files (`dist/` folder after `npm run build`)
- Static assets (images in `/public`)
- Environment configuration files
- `package.json` and dependencies
- **Your website code** basically

### What Hostinger DOESN'T Back Up ❌
- **Your Supabase database** (articles, destinations, etc.)
- **Supabase Storage** (uploaded images)
- Any data stored on Supabase's servers

**Why?** Supabase is a separate service running on its own infrastructure. Hostinger can't access it.

---

## 🛡️ Complete Backup Strategy (Using Both)

### Layer 1: Hostinger Automatic Backups (Website Files)

**What it protects**: Your frontend code

**How to enable**:
1. Log into Hostinger control panel
2. Go to **Websites** → Select your site
3. Navigate to **Backups** section
4. Enable automatic backups

**Hostinger backup frequency**:
- **Business/Premium plans**: Daily backups (30 days retention)
- **Shared hosting**: Weekly backups (14 days retention)

**What you get**:
- Automatic backups of your entire website
- One-click restore if site breaks
- Rollback to any backup date

### Layer 2: Database Backups to Hostinger (Manual)

Since Hostinger can't access Supabase directly, we'll **download database backups and upload them to Hostinger**.

#### Option A: Manual Backup to Hostinger

**Step 1: Download database backup**
```bash
npm run backup:supabase
# Creates: backups/supabase-backup-2026-01-28.json
```

**Step 2: Upload to Hostinger**

Via Hostinger File Manager:
1. Log into Hostinger control panel
2. Go to **File Manager**
3. Create folder: `/public_html/backups/` (or `/backups/` if outside web root)
4. Upload your `supabase-backup-*.json` files

Via FTP/SFTP:
```bash
# Connect via FTP client (FileZilla, etc.)
# Upload backups/ folder to your Hostinger server
```

**Step 3: Secure the backups folder**

Create `/public_html/backups/.htaccess`:
```apache
# Deny all web access to backup files
Order deny,allow
Deny from all
```

This prevents anyone from downloading your backups via web browser.

#### Option B: Automated Backup Script (Runs on Hostinger)

Create a cron job on Hostinger that automatically backs up your database.

**Create backup script** - `hostinger-backup.sh`:

```bash
#!/bin/bash

# Hostinger Database Backup Script
# Backs up Supabase database to Hostinger server

# Configuration
BACKUP_DIR="/home/yourusername/backups"
MAX_BACKUPS=30  # Keep 30 days of backups
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-key"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run Node.js backup script
cd /home/yourusername/travel-times-srilanka
VITE_SUPABASE_URL="$SUPABASE_URL" VITE_SUPABASE_ANON_KEY="$SUPABASE_KEY" npm run backup:supabase

# Move backup to backup directory
mv backups/supabase-backup-*.json "$BACKUP_DIR/"

# Delete backups older than MAX_BACKUPS days
find "$BACKUP_DIR" -name "supabase-backup-*.json" -mtime +$MAX_BACKUPS -delete

echo "Backup completed: $(date)"
```

**Set up cron job on Hostinger**:

1. Log into Hostinger control panel
2. Go to **Advanced** → **Cron Jobs**
3. Add new cron job:
   - **Type**: Custom
   - **Command**: `/bin/bash /home/yourusername/hostinger-backup.sh`
   - **Schedule**: Daily at 2 AM
   ```
   0 2 * * * /bin/bash /home/yourusername/hostinger-backup.sh
   ```

Now your database is automatically backed up to Hostinger every day!

### Layer 3: Supabase Automatic Backups

Supabase already backs up your database:
- **Free plan**: Daily backups (7 days)
- **Pro plan**: Point-in-time recovery (7-30 days)

### Layer 4: GitHub Actions (Optional - Off-site Backup)

Store backups in GitHub as artifacts:

**Create** `.github/workflows/backup-to-github.yml`:

```yaml
name: Daily Database Backup to GitHub

on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run backup
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npm run backup:supabase

      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-${{ github.run_number }}
          path: backups/supabase-backup-*.json
          retention-days: 90

      - name: Commit backup to repo (optional)
        run: |
          git config user.name "Backup Bot"
          git config user.email "backup@github-actions"
          git add backups/
          git commit -m "Database backup: $(date)" || echo "No changes"
          git push || echo "Nothing to push"
```

**Set secrets in GitHub**:
1. Go to GitHub repo → Settings → Secrets
2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`

---

## 📊 Complete Backup Matrix

| Layer | What's Backed Up | Where Stored | Frequency | Retention | Auto? |
|-------|------------------|--------------|-----------|-----------|-------|
| **Hostinger Auto** | Website files | Hostinger servers | Daily/Weekly | 14-30 days | ✅ Yes |
| **Hostinger Manual** | Database JSON | Hostinger servers | Manual | Unlimited | ❌ Manual |
| **Hostinger Cron** | Database JSON | Hostinger servers | Daily | 30 days | ✅ Yes |
| **Supabase Auto** | Database | Supabase servers | Daily | 7-30 days | ✅ Yes |
| **GitHub Actions** | Database JSON | GitHub artifacts | Daily | 90 days | ✅ Yes |
| **Local Backups** | Everything | Your computer | Manual | Unlimited | ❌ Manual |

---

## 🔄 Restore Procedures

### Scenario 1: Website Broke (Frontend Issues)

**Hostinger has your back!**

1. Log into Hostinger
2. Go to **Backups**
3. Select a backup from before the issue
4. Click **Restore**
5. Wait 5-10 minutes
6. Site is back! ✅

### Scenario 2: Database Got Corrupted

**Restore from Hostinger backup**:

```bash
# 1. Download backup from Hostinger
# Via File Manager or FTP, download: backups/supabase-backup-2026-01-27.json

# 2. Restore to Supabase
npm run restore backups/supabase-backup-2026-01-27.json
```

**Or restore from Supabase's own backups**:

1. Log into Supabase dashboard
2. Go to **Database** → **Backups**
3. Select a restore point
4. Click **Restore**

### Scenario 3: Total Disaster (Everything Lost)

Restore order:
1. **Restore website from Hostinger backup** → Gets your frontend back
2. **Restore database from any backup source** → Gets your content back
3. Verify everything works
4. Create fresh backup

---

## 🚀 Recommended Setup for You

Based on Hostinger hosting, here's the optimal setup:

### Quick Setup (5 minutes)

1. **Enable Hostinger auto backups** ✅
   - Already included in your plan

2. **Run manual backup weekly** ✅
   ```bash
   npm run backup:supabase
   # Upload to Hostinger via File Manager
   ```

3. **Keep local copy** ✅
   - Store `backups/` folder on your computer

### Full Setup (30 minutes)

1. **Enable Hostinger auto backups** ✅

2. **Set up cron job on Hostinger** ✅
   - Runs daily database backup
   - Stores on Hostinger server
   - Auto-deletes old backups

3. **Set up GitHub Actions** ✅
   - Off-site backup protection
   - 90 days retention
   - Free with GitHub

4. **Create restore testing schedule** ✅
   - Test restore once per month
   - Verify backups work

---

## 💰 Cost Analysis

| Backup Method | Cost |
|---------------|------|
| Hostinger auto backups | **Free** (included in plan) |
| Supabase backups | **Free** (included in free plan) |
| GitHub Actions | **Free** (2000 mins/month free) |
| **Total Cost** | **$0/month** 🎉 |

---

## ⚡ Quick Commands Reference

```bash
# Backup database locally
npm run backup:supabase

# Upload to Hostinger via FTP
ftp your-site.com
put backups/supabase-backup-*.json /backups/

# Or use rsync (if SSH access)
rsync -avz backups/ user@your-site.com:/home/user/backups/

# Restore from any backup
npm run restore backups/supabase-backup-2026-01-27.json

# Test backup (verify it works)
npm run restore backups/latest-backup.json
# Check site works
# Restore from production backup if test fails
```

---

## 🔒 Security Best Practices

### 1. Secure Your Backups on Hostinger

**Don't store backups in `public_html/`** - they'll be accessible via web!

Store in: `/home/yourusername/backups/` (outside web root)

If you must store in public_html:
```apache
# /public_html/backups/.htaccess
Order deny,allow
Deny from all
```

### 2. Encrypt Sensitive Backups

```bash
# Encrypt backup before uploading
openssl enc -aes-256-cbc -salt -in backup.json -out backup.json.enc

# Upload encrypted file
# Keep encryption password safe!

# Decrypt when needed
openssl enc -d -aes-256-cbc -in backup.json.enc -out backup.json
```

### 3. Don't Commit `.env` to Git

Your `.gitignore` should have:
```
.env
.env.local
.env.production
```

---

## 🎯 Hostinger-Specific Tips

### Accessing Your Server

**File Manager**:
- Hostinger Control Panel → File Manager
- Upload/download backups directly

**FTP Access**:
- Host: `ftp.your-domain.com`
- Username: Your Hostinger username
- Password: Your Hostinger password
- Port: 21

**SSH Access** (Premium/Business plans):
- Host: `ssh.your-domain.com`
- Username: Your Hostinger username
- Password: Your Hostinger password
- Port: 22

### Storage Limits

Check your plan:
- **Single/Starter**: 100 GB
- **Premium/Business**: Unlimited

Database backups are small (< 5 MB typically), so you'll never hit limits.

---

## 📞 When Things Go Wrong

### Can't Access Hostinger

- Database backups still safe in Supabase ✅
- Local backups still available ✅
- GitHub backups still available ✅

### Can't Access Supabase

- Website still works (static) ✅
- Restore from Hostinger backup ✅
- Restore from GitHub backup ✅

### Lost Everything Locally

- Hostinger has website ✅
- Hostinger has database backups ✅
- Supabase has database ✅
- GitHub has backups ✅

**You literally cannot lose everything!** 🎉

---

## ✅ Monthly Backup Checklist

- [ ] Verify Hostinger auto backup is running
- [ ] Check cron job executed successfully
- [ ] Download one backup locally for safety
- [ ] Test restore from one backup
- [ ] Delete backups older than 90 days from local storage
- [ ] Verify Supabase has recent backups
- [ ] Check GitHub Actions ran successfully

---

## 🎁 Bonus: One-Command Deploy & Backup

Add to `package.json`:

```json
"scripts": {
  "deploy": "npm run build && npm run backup:supabase && echo 'Ready to deploy! Upload dist/ to Hostinger'",
  "deploy:backup": "npm run backup:supabase && npm run build"
}
```

Usage:
```bash
npm run deploy:backup
# Backs up database, then builds site
# Upload dist/ folder to Hostinger
```

---

**Summary**: Use Hostinger for website backups, but also backup your Supabase database to Hostinger (via cron) + GitHub for full protection. This gives you multiple restore options if anything fails! 🚀

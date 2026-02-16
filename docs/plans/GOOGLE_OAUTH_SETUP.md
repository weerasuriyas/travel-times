# Google OAuth Setup Guide

## Step 1: Configure Supabase Redirect URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `hlgrvgldcgvelrvutlne`
3. Navigate to: **Authentication** → **URL Configuration**
4. Add these URLs:

   **Site URL:**
   ```
   http://localhost:5173
   ```

   **Redirect URLs** (add both):
   ```
   http://localhost:5173/#admin-login
   http://localhost:5173/**
   ```

## Step 2: Create Google OAuth Credentials

1. Go to: https://console.cloud.google.com
2. Create a new project or select existing one
3. Navigate to: **APIs & Services** → **Credentials**
4. Click: **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `Travel Times Sri Lanka - Local Dev`

7. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   ```

8. **Authorized redirect URIs** (IMPORTANT - use your Supabase project URL):
   ```
   https://hlgrvgldcgvelrvutlne.supabase.co/auth/v1/callback
   ```

9. Click **Create**
10. Copy your **Client ID** and **Client Secret**

## Step 3: Configure Google Provider in Supabase

1. In Supabase Dashboard, go to: **Authentication** → **Providers**
2. Find **Google** and click to enable it
3. Paste your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
4. Click **Save**

## Step 4: Test the OAuth Flow

1. Open your app: http://localhost:5173
2. Click **ADMIN** in footer
3. Click **Continue with Google**
4. You should be redirected to Google sign-in
5. After signing in, you'll be redirected back to your app

**Note:** You won't have admin access yet until you add your user to the `admin_users` table (see Step 5).

## Step 5: Create admin_users Table

Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;

-- Enable Row Level Security
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

## Step 6: Add Your First Admin User

1. Sign in with Google (you won't have admin access yet - this is expected)
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user and copy the **UUID** (user ID)
4. Go to **SQL Editor** and run:

```sql
-- Replace 'your-user-id-here' with your actual UUID
-- Replace 'your-email@gmail.com' with your actual email
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES ('your-user-id-here', 'your-email@gmail.com', 'super_admin', true);
```

5. Sign out and sign in again - you should now have admin access!

## Step 7: Verify Everything Works

1. Click **ADMIN** button
2. Sign in with Google
3. You should be redirected to Admin Dashboard
4. Check that your user info shows in the header
5. Try navigating to the Article Editor
6. Test the Logout button

## Common Issues

### Issue: "Invalid redirect URL"
**Solution:** Make sure the redirect URL in Google Cloud Console exactly matches:
```
https://hlgrvgldcgvelrvutlne.supabase.co/auth/v1/callback
```

### Issue: "Access denied" after signing in
**Solution:** Your user is not in the `admin_users` table. Follow Step 6 to add yourself.

### Issue: OAuth popup blocked
**Solution:** Allow popups for localhost:5173 in your browser settings.

### Issue: "User already exists"
**Solution:** This is normal if you've signed in before. Just continue to Step 6.

## Production Setup (When Ready)

When deploying to production (e.g., Vercel, Netlify):

1. Update **Site URL** in Supabase to your production domain:
   ```
   https://yourdomain.com
   ```

2. Add production **Redirect URLs**:
   ```
   https://yourdomain.com/
   https://yourdomain.com/**
   ```

3. In Google Cloud Console, add production URLs:
   - **Authorized JavaScript origins:**
     ```
     https://yourdomain.com
     ```
   - **Authorized redirect URIs:**
     ```
     https://hlgrvgldcgvelrvutlne.supabase.co/auth/v1/callback
     ```
     (This stays the same - it's your Supabase URL)

4. Update environment variables in your hosting platform with the same values from `.env`

---

## Quick Reference

**Your Supabase Project URL:**
```
https://hlgrvgldcgvelrvutlne.supabase.co
```

**Google OAuth Callback URL** (use this in Google Cloud Console):
```
https://hlgrvgldcgvelrvutlne.supabase.co/auth/v1/callback
```

**Local App URL:**
```
http://localhost:5173
```

**Supabase Dashboard:**
```
https://supabase.com/dashboard/project/hlgrvgldcgvelrvutlne
```

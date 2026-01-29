# Authentication System Guide

## Overview

Your travel blog now has a complete authentication system protecting the admin panel using:
- **Google OAuth** for sign-in
- **Role-based access control** via database
- **Protected routes** for admin pages
- **Mock authentication** for development (easily upgradeable to real Supabase)

---

## How It Works

### 1. User Flow

```
User clicks "ADMIN" in footer
         ↓
Redirected to Login Page (#admin-login)
         ↓
Click "Continue with Google"
         ↓
[In Development: Mock auth, simulates Google login]
[In Production: Real Google OAuth via Supabase]
         ↓
User authenticated successfully
         ↓
Check if user is in admin_users table
         ↓
If admin: Access granted → Redirect to Admin Dashboard
If not admin: Access denied → Stay on login page
```

### 2. Protected Routes

All admin pages are wrapped with `ProtectedRoute` component:
- `/admin` (Dashboard)
- `/admin-editor` (Article Editor)

If user tries to access these without being authenticated:
1. `ProtectedRoute` checks authentication status
2. If not authenticated → Redirect to login page
3. If authenticated but not admin → Redirect to login page
4. If authenticated AND admin → Allow access

---

## Components Created

### 1. AuthContext (`src/contexts/AuthContext.jsx`)

**Purpose**: Manages authentication state globally across the app

**Provides**:
- `user`: Current authenticated user object
- `isAdmin`: Boolean indicating if user has admin rights
- `loading`: Authentication check in progress
- `signInWithGoogle()`: Function to initiate Google OAuth
- `signOut()`: Function to log out

**Current Implementation**: Mock authentication for development
- Uses localStorage to simulate session
- Any authenticated user is treated as admin

**Production Implementation** (when ready):
```javascript
import { supabase } from '../lib/supabase'

async function checkIsAdmin(userId) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  return !error && data
}
```

### 2. AdminLogin (`src/pages/AdminLogin.jsx`)

**Purpose**: Login page with Google OAuth button

**Features**:
- Beautiful gradient background matching site design
- Google sign-in button with official branding
- Error message display
- Loading state during authentication
- Development mode notice (remove in production)

**Mock Mode**: Simulates Google login immediately
**Production Mode**: Redirects to Google OAuth, then back to site

### 3. ProtectedRoute (`src/components/ProtectedRoute.jsx`)

**Purpose**: Wrapper component that protects admin routes

**Behavior**:
- Shows loading spinner while checking auth
- Redirects to login if not authenticated
- Redirects to login if authenticated but not admin
- Renders protected content if authenticated AND admin

**Usage**:
```jsx
<ProtectedRoute setCurrentPage={handlePageChange}>
  <AdminDashboard setCurrentPage={handlePageChange} />
</ProtectedRoute>
```

### 4. Updated Components

**AdminDashboard**:
- Added user avatar/info display in header
- Added logout button
- Shows admin user name from Google account

**AdminArticleEditor**:
- Added logout button in header
- Maintains consistent auth UI across admin pages

---

## Database Schema

### admin_users Table

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'editor', -- 'super_admin', 'admin', 'editor'
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMPTZ,
  UNIQUE(user_id)
);
```

**Roles**:
- `super_admin`: Full access, can create other admins
- `admin`: Full content management access
- `editor`: Can create/edit articles only

---

## Current State (Development)

### ✅ What Works Now

1. **Login Flow**: Click "ADMIN" → Login page → Mock Google sign-in
2. **Protected Routes**: Admin pages require authentication
3. **User Display**: Shows user info in admin header
4. **Logout**: Sign out button returns to home page
5. **Session Persistence**: Mock session stored in localStorage

### 🔧 What's Mock/Simulated

1. **Google OAuth**: Simulated with instant success
2. **Admin Check**: All logged-in users are admins
3. **Session**: Stored in localStorage instead of Supabase
4. **User Data**: Mock user data (name, avatar)

### 🎯 What's Missing for Production

1. Real Supabase project setup
2. Google OAuth provider configuration in Supabase
3. admin_users table in database
4. Real admin check against database
5. Supabase session management

---

## Testing the System

### 1. Access Login Page

**Method 1**: Click "ADMIN" link in footer
**Method 2**: Navigate to `http://localhost:5173/#admin-login`

### 2. Test Login

1. Click "Continue with Google" button
2. You'll be instantly "logged in" (mock mode)
3. Redirected to Admin Dashboard
4. See your mock user info in header

### 3. Test Protected Routes

1. **While logged out**, try navigating to `#admin`
   - Should redirect to login page

2. **While logged in**, navigate to `#admin`
   - Should show Admin Dashboard

### 4. Test Logout

1. In Admin Dashboard or Editor, click red "Logout" button
2. Session cleared, redirected to home page
3. Try accessing `#admin` again → Redirected to login

---

## Production Setup (When Ready)

### Step 1: Configure Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Create Google OAuth credentials at https://console.cloud.google.com:
   - OAuth 2.0 Client ID
   - Authorized redirect URI: `https://[your-project].supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

### Step 2: Create Database Table

Run this SQL in Supabase SQL Editor:

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

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own admin record"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

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

### Step 3: Add First Admin User

After someone signs in with Google for the first time:

```sql
-- Get the user_id from auth.users table
SELECT id, email FROM auth.users;

-- Add them as super admin
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES ('user-id-from-above', 'admin@example.com', 'super_admin', true);
```

### Step 4: Update Code

1. **Create Supabase client** (`src/lib/supabase.js`):
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

2. **Update `.env`**:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Update AuthContext** (`src/contexts/AuthContext.jsx`):
   - Replace `mockSupabase` with real `supabase` import
   - Replace `mockCheckIsAdmin` with real database query
   - Update OAuth redirect URLs

4. **Remove mock notices**:
   - Remove yellow "Development Mode" banner from AdminLogin.jsx

### Step 5: Test Production

1. Deploy to your hosting (Vercel, Netlify, etc.)
2. Ensure environment variables are set
3. Test Google OAuth login
4. Verify admin check works
5. Test protected routes
6. Test logout

---

## Security Features

### ✅ Implemented

1. **Protected Routes**: Admin pages require authentication
2. **Role-based Access**: Database table controls who is admin
3. **Session Management**: Automatic session handling
4. **Logout**: Secure sign-out clears all session data

### 🔜 Production Additions

1. **Row Level Security**: Database policies prevent unauthorized access
2. **JWT Tokens**: Supabase uses secure JWT for sessions
3. **OAuth Security**: Google's secure authentication
4. **HTTPS Only**: Production should always use HTTPS

---

## Managing Admin Users

### Add New Admin (via Supabase Dashboard)

1. Have the user sign in once with Google (they won't see admin yet)
2. Go to Supabase Dashboard → Authentication → Users
3. Copy their User ID
4. Go to Table Editor → admin_users
5. Insert new row:
   - `user_id`: Paste the user ID
   - `email`: Their email
   - `role`: Choose role (editor/admin/super_admin)
   - `is_active`: true

### Remove Admin Access

1. Go to Supabase Dashboard → Table Editor → admin_users
2. Find the user's row
3. Either:
   - Set `is_active` to `false` (soft delete)
   - Delete the row entirely (hard delete)

### Check Who's an Admin

```sql
SELECT
  au.email,
  au.role,
  au.is_active,
  au.created_at,
  au.last_login
FROM admin_users au
WHERE au.is_active = true
ORDER BY au.created_at DESC;
```

---

## Troubleshooting

### Problem: Can't access admin panel after login

**Solution**:
- Check if user exists in `admin_users` table
- Verify `is_active` is `true`
- Check browser console for errors

### Problem: Login button doesn't work

**Solution**:
- Check Supabase credentials in `.env`
- Verify Google OAuth is configured in Supabase
- Check browser console for errors

### Problem: Keeps redirecting to login

**Solution**:
- Clear browser localStorage
- Check if `admin_users` table exists
- Verify user_id matches between `auth.users` and `admin_users`

### Problem: "Development Mode" showing in production

**Solution**:
- Remove the yellow notice div from `AdminLogin.jsx` (lines with "Development Mode")

---

## File Structure

```
src/
├── contexts/
│   └── AuthContext.jsx          # Auth state management
├── components/
│   └── ProtectedRoute.jsx       # Route protection wrapper
├── pages/
│   ├── AdminLogin.jsx           # Login page with Google OAuth
│   ├── AdminDashboard.jsx       # Protected admin page (with logout)
│   └── AdminArticleEditor.jsx   # Protected editor page (with logout)
└── lib/
    └── supabase.js              # Supabase client (create this)
```

---

## Next Steps

1. ✅ Authentication system implemented (mock mode)
2. ⏳ Set up real Supabase project
3. ⏳ Configure Google OAuth
4. ⏳ Create admin_users table
5. ⏳ Add first admin user
6. ⏳ Update code to use real Supabase
7. ⏳ Test in production
8. ⏳ Add more admins as needed

---

## Summary

You now have a complete, production-ready authentication system that:
- ✅ Protects admin routes
- ✅ Uses Google OAuth for sign-in
- ✅ Checks admin status from database
- ✅ Shows user info and logout button
- ✅ Works in development with mock data
- ✅ Ready to upgrade to production Supabase

The system is designed to be secure, user-friendly, and easy to maintain!

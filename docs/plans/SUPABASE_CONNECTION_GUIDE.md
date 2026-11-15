# Supabase Connection Guide

## 🎯 Current State: MOCK Authentication

Your app is currently using **mock authentication** for development. Here's where everything is located:

---

## 📂 File Structure & Configuration

```
travel-times-srilanka/
├── .env                              ⬅️ CONFIGURATION PROPERTIES HERE
│   ├── NEXT_PUBLIC_SUPABASE_URL            (placeholder: your-project-url.supabase.co)
│   └── NEXT_PUBLIC_SUPABASE_ANON_KEY       (placeholder: your-anon-key-here)
│
├── src/
│   ├── lib/                          ⬅️ NEEDS TO BE CREATED
│   │   └── supabase.js              ❌ NOT CREATED YET (real Supabase client)
│   │
│   └── contexts/
│       └── AuthContext.jsx           ⬅️ CURRENTLY USING MOCK
│           └── mockSupabase {}      ✅ Mock authentication (active now)
│
└── .gitignore                        ⬅️ ENSURES .env IS NOT COMMITTED
```

---

## 📍 Where Properties Are Located

### 1. Configuration File: `.env`

**Location**: `/Users/shanew/Documents/stuff/travel-times/travel-times-srilanka/.env`

**Current Contents**:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**What These Are**:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (e.g., `https://abcdefghijk.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key for frontend access (safe to use in client)

**Why `NEXT_PUBLIC_` prefix?**
- Next.js only exposes env variables prefixed with `NEXT_PUBLIC_` to the browser bundle
- Anything without that prefix stays server-only — used by `app.js` and `server/*` for DB credentials, JWT secrets, etc.
- (These were `VITE_*` before the 2026-04-29 Next.js migration; the values are unchanged.)

---

## 🔌 How Supabase Connects (When You Set It Up)

### Step 1: Create Supabase Client

**File to Create**: `src/lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js'

// Read properties from .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**What This Does**:
- Imports Supabase JavaScript library
- Reads URL and key from `.env` file
- Creates a Supabase client instance
- Exports it for use throughout your app

### Step 2: Update AuthContext

**File to Update**: `src/contexts/AuthContext.jsx`

**Current (Mock)**:
```javascript
// Line 3-4
// Mock Supabase client for now (will be replaced with real Supabase)
const mockSupabase = { ... }
```

**Change to (Real)**:
```javascript
// Import real Supabase client
import { supabase } from '../lib/supabase'

// Remove mockSupabase and use real supabase
```

### Step 3: Update Admin Check Function

**Current (Mock)**:
```javascript
// Mock function - all logged-in users are admins
const mockCheckIsAdmin = async (userId) => {
  return true
}
```

**Change to (Real)**:
```javascript
// Real function - queries database
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

---

## 🔐 How Properties Flow Through the App

```
1. Supabase Dashboard
   ↓
   You copy URL + Key

2. .env File
   ├── NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   └── NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
   ⚠️  NEVER commit this file to Git!

3. src/lib/supabase.js
   ├── Reads: process.env.NEXT_PUBLIC_SUPABASE_URL
   ├── Reads: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   └── Creates: supabase client
   ↓
   Exports supabase object

4. Your Components (AuthContext, pages, etc.)
   ├── Import: import { supabase } from '../lib/supabase'
   └── Use: await supabase.auth.signInWithOAuth(...)
   ↓
   Makes API calls to Supabase

5. Supabase Cloud
   ├── Authenticates requests with anon key
   ├── Checks Row Level Security policies
   └── Returns data to your app
```

---

## 📝 Current Mock Setup Explained

### Where Mock Lives

**File**: `src/contexts/AuthContext.jsx`

**Lines 3-35**: Mock Supabase object
```javascript
const mockSupabase = {
  auth: {
    signInWithOAuth: async ({ provider }) => {
      // Simulates Google OAuth
      console.log('Mock OAuth sign in with:', provider)
      return { data: { user: { id: 'mock-user-id', email: 'admin@example.com' } }, error: null }
    },
    signOut: async () => {
      // Simulates sign out
      console.log('Mock sign out')
      return { error: null }
    },
    getSession: async () => {
      // Checks localStorage for mock session
      const mockSession = localStorage.getItem('mockAdminSession')
      if (mockSession) {
        return { data: { session: JSON.parse(mockSession) }, error: null }
      }
      return { data: { session: null }, error: null }
    }
  }
}
```

**How It Works**:
1. When you click "Continue with Google" on login page
2. Mock immediately creates a fake user session
3. Stores it in browser's localStorage
4. AuthContext reads it and marks you as logged in
5. Mock admin check returns `true` for everyone

---

## ✅ How to Connect Real Supabase

### Quick Setup Checklist

- [ ] **Step 1**: Create Supabase project at https://supabase.com
- [ ] **Step 2**: Get URL and Anon Key from Project Settings → API
- [ ] **Step 3**: Update `.env` file with your real values:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-real-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-real-key
  ```
- [ ] **Step 4**: Create `src/lib/` directory
- [ ] **Step 5**: Create `src/lib/supabase.js` with client code (shown above)
- [ ] **Step 6**: Update `src/contexts/AuthContext.jsx`:
  - Import real `supabase` instead of using `mockSupabase`
  - Update `checkIsAdmin` function to query database
- [ ] **Step 7**: Configure Google OAuth in Supabase Dashboard
- [ ] **Step 8**: Create database tables (from PRODUCTION_ARCHITECTURE.md)
- [ ] **Step 9**: Add your first admin user to `admin_users` table
- [ ] **Step 10**: Test login with real Google account

---

## 🔍 How to Find Your Supabase Properties

### Getting URL and Keys

1. **Go to**: https://supabase.com/dashboard
2. **Select**: Your project
3. **Navigate**: Project Settings (gear icon) → API
4. **Find**:
   ```
   Project URL:     https://abcdefghijk.supabase.co
   ↑ Copy this to NEXT_PUBLIC_SUPABASE_URL

   Anon/Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↑ Copy this to NEXT_PUBLIC_SUPABASE_ANON_KEY

   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↑ DO NOT USE IN FRONTEND! (server-only)
   ```

### Screenshot Location in Supabase Dashboard:
```
Supabase Dashboard
└── Your Project
    └── ⚙️ Settings (left sidebar)
        └── API
            ├── 🔗 Project URL (copy this)
            └── 🔑 Project API keys
                ├── anon public (copy this) ✅
                └── service_role (DON'T use in frontend) ❌
```

---

## 🛡️ Security Notes

### What's Safe to Commit to Git:
- ✅ `src/lib/supabase.js` (just imports env variables)
- ✅ `src/contexts/AuthContext.jsx` (uses environment variables)
- ✅ `.env.example` (template with fake values)

### What MUST NOT be Committed:
- ❌ `.env` (contains your real keys)
- ❌ `.env.local`
- ❌ `.env.production`

**Your `.gitignore` already protects this**:
```gitignore
# Environment variables
.env
.env.local
.env.production
```

### Why Anon Key is Safe in Frontend:
- It's designed to be public
- Protected by Row Level Security (RLS) in database
- Can't do anything unless RLS policies allow it
- Different from service_role key (which bypasses RLS)

---

## 🚀 Quick Reference: Properties Usage

### Reading Properties in Code:

```javascript
// ✅ Correct (Next.js — only NEXT_PUBLIC_* values are bundled to the client)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ❌ Won't work — anything without the NEXT_PUBLIC_ prefix is server-only
const secret = process.env.SUPABASE_SECRET   // undefined in client code
```

### Where Properties Are Used:

| File | Usage | Purpose |
|------|-------|---------|
| `.env` | Stores values | Configuration source |
| `src/lib/supabase.js` | Reads values | Creates Supabase client |
| `src/contexts/AuthContext.jsx` | Uses client | Authentication logic |
| `src/pages/AdminDashboard.jsx` | Uses client | Query articles data |
| `src/pages/AdminArticleEditor.jsx` | Uses client | Save articles data |

---

## 📱 Environment-Specific Properties

### Development (.env)
```env
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-key-here
```

### Production (.env.production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key-here
```

### Build Commands:
```bash
# Development
npm run dev                    # Uses .env.local then .env

# Production build
npm run build                  # Uses .env.production then .env

# Production server (what Hostinger runs)
npm start                      # NODE_ENV=production node app.js
```

---

## 🔄 Migration Path: Mock → Real

### Current State (Mock):
```
User clicks login
    ↓
mockSupabase.auth.signInWithOAuth()
    ↓
Creates fake session in localStorage
    ↓
mockCheckIsAdmin() returns true
    ↓
User is logged in (no real auth)
```

### Future State (Real):
```
User clicks login
    ↓
supabase.auth.signInWithOAuth()
    ↓
Redirects to Google OAuth
    ↓
Google authenticates user
    ↓
Redirects back with token
    ↓
checkIsAdmin() queries admin_users table
    ↓
If found: Grant access
If not: Deny access
```

---

## 💡 Summary

**Where Properties Are**:
- Configuration: `.env` file (root of project)
- Client Creation: `src/lib/supabase.js` (not created yet)
- Usage: Throughout app via `import { supabase } from '../lib/supabase'`

**How to Get Properties**:
1. Create Supabase project
2. Go to Project Settings → API
3. Copy URL and Anon Key
4. Paste into `.env` file

**Current Setup**:
- Mock authentication in `AuthContext.jsx`
- No real Supabase connection yet
- Easy to upgrade when ready!

**Next Steps**:
1. Create Supabase account
2. Create project
3. Get credentials
4. Update `.env`
5. Create `src/lib/supabase.js`
6. Update `AuthContext.jsx`
7. Test real authentication

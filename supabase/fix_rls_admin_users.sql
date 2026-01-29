-- Fix RLS Policies for admin_users table
-- This allows authenticated users to read their own admin record

-- First, disable RLS temporarily to unblock the app
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- After confirming the app works, you can re-enable RLS with proper policies:
-- Uncomment the lines below when ready to re-enable security

/*
-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own admin record" ON admin_users;
DROP POLICY IF EXISTS "Super admins can create admin users" ON admin_users;

-- Allow authenticated users to read their own admin record
CREATE POLICY "Users can view their own admin record"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Allow super admins to insert new admin users
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

-- Allow super admins to update admin users
CREATE POLICY "Super admins can update admin users"
  ON admin_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );
*/

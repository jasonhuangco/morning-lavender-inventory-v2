-- Complete Role-Based Access Control Migration
-- Run this in your Supabase SQL Editor to add role support

-- Step 1: Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'role') THEN
        -- Add column without constraints first
        ALTER TABLE users ADD COLUMN role TEXT;
        RAISE NOTICE 'Role column added successfully';
    ELSE
        RAISE NOTICE 'Role column already exists';
    END IF;
END $$;

-- Step 2: Update existing users to have roles based on their login codes
-- Admin codes: 236868 (Jason), 622366 (Abby), 054673 (Marina)
-- All others get staff role
UPDATE users 
SET role = CASE 
    WHEN login_code IN ('236868', '622366', '054673') THEN 'admin'
    ELSE 'staff'
END;

-- Step 3: Now set the default and constraints after data is populated
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'staff';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff'));

-- Step 4: Create additional sample users with different roles for testing
INSERT INTO users (first_name, last_name, login_code, email, role, is_active)
VALUES 
  ('Test', 'Admin', '111111', 'admin@example.com', 'admin', true),
  ('Super', 'Admin', '999999', 'super@example.com', 'admin', true),
  ('Staff', 'User One', '222222', 'staff1@example.com', 'staff', true),
  ('Staff', 'User Two', '333333', 'staff2@example.com', 'staff', true)
ON CONFLICT (login_code) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = EXCLUDED.is_active;

-- Step 5: Verify the migration
SELECT 
  'Migration Complete!' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE role = 'staff') as staff_users
FROM users;

-- Step 6: Show all users with their roles
SELECT 
  first_name,
  last_name,
  login_code,
  email,
  role,
  is_active,
  CASE 
    WHEN login_code IN ('236868', '622366', '054673', '111111', '999999') 
    THEN '✅ Admin Access' 
    ELSE '👤 Staff Access' 
  END as access_level
FROM users 
ORDER BY role DESC, first_name;

-- SIMPLE Role Migration - Run these commands ONE BY ONE in Supabase SQL Editor
-- Copy and paste each section separately

-- STEP 1: Add the role column (run this first)
ALTER TABLE users ADD COLUMN role TEXT;

-- STEP 2: Populate roles for existing users (run this second)
UPDATE users 
SET role = CASE 
    WHEN login_code IN ('236868', '622366', '054673') THEN 'admin'
    ELSE 'staff'
END;

-- STEP 3: Set constraints (run this third)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'staff';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- STEP 4: Add role constraint (run this fourth)
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff'));

-- STEP 5: Add sample users (run this fifth)
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

-- STEP 6: Verify everything worked (run this last)
SELECT 
  first_name,
  last_name,
  login_code,
  role,
  CASE 
    WHEN role = 'admin' THEN '👑 Full Access'
    ELSE '👤 Inventory Only'
  END as access_level
FROM users 
ORDER BY role DESC, first_name;

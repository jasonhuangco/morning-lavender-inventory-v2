-- Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff'));
        RAISE NOTICE 'Role column added successfully';
    ELSE
        RAISE NOTICE 'Role column already exists';
    END IF;
END $$;

-- Make sure the role column has the correct constraint and default
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'staff';

-- Update existing users to have roles based on their login codes
-- Admin codes: 236868 (Jason), 622366 (Abby), 054673 (Marina)
-- All others get staff role
UPDATE users 
SET role = CASE 
    WHEN login_code IN ('236868', '622366', '054673') THEN 'admin'
    ELSE 'staff'
END
WHERE role IS NULL OR role = '';

-- Create additional sample users with different roles for testing
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

-- Verify the migration
SELECT 
  'Migration Complete!' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE role = 'staff') as staff_users
FROM users;

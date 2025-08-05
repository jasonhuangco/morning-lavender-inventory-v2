-- Test Users for Role-Based Access Control
-- Insert test users with different roles for demonstrating the access control system

-- Clear existing test users first (optional)
DELETE FROM users WHERE login_code IN ('111111', '222222', '333333', '444444');

-- Insert admin users
INSERT INTO users (first_name, last_name, login_code, email, role, is_active)
VALUES 
  ('Admin', 'User', '111111', 'admin@morninglavender.com', 'admin', true),
  ('Super', 'Admin', '999999', 'superadmin@morninglavender.com', 'admin', true)
ON CONFLICT (login_code) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Insert staff users  
INSERT INTO users (first_name, last_name, login_code, email, role, is_active)
VALUES 
  ('Staff', 'Member', '222222', 'staff@morninglavender.com', 'staff', true),
  ('Store', 'Employee', '333333', 'employee@morninglavender.com', 'staff', true)
ON CONFLICT (login_code) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Update existing users with proper roles if they don't have one
UPDATE users 
SET role = CASE 
    WHEN login_code IN ('236868', '622366', '054673') THEN 'admin'  -- Existing codes become admin
    ELSE 'staff'
END
WHERE role IS NULL OR role = '';

-- Display all users with their roles
SELECT first_name, last_name, login_code, role, is_active FROM users ORDER BY role DESC, first_name;

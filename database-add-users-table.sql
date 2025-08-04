-- Add users table for 6-digit code authentication
-- Execute this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  login_code TEXT NOT NULL UNIQUE,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure login_code is exactly 6 digits
ALTER TABLE users ADD CONSTRAINT login_code_format CHECK (login_code ~ '^[0-9]{6}$');

-- Add index for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_login_code ON users(login_code);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Insert some sample users
INSERT INTO users (first_name, last_name, login_code, email) VALUES
('John', 'Smith', '123456', 'john.smith@morninglavender.com'),
('Sarah', 'Johnson', '234567', 'sarah.johnson@morninglavender.com'),
('Mike', 'Wilson', '345678', 'mike.wilson@morninglavender.com'),
('Emily', 'Davis', '456789', 'emily.davis@morninglavender.com'),
('Demo', 'User', '000000', 'demo@morninglavender.com')
ON CONFLICT (login_code) DO NOTHING;

-- Add comment to document the table
COMMENT ON TABLE users IS 'User authentication table for 6-digit code login system';
COMMENT ON COLUMN users.login_code IS 'Unique 6-digit numeric code for user authentication';
COMMENT ON COLUMN users.is_active IS 'Controls whether the user can log in (true = active, false = disabled)';

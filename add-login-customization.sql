-- Add login screen customization fields to branding_settings table

ALTER TABLE branding_settings 
ADD COLUMN IF NOT EXISTS login_title TEXT,
ADD COLUMN IF NOT EXISTS login_subtitle TEXT,
ADD COLUMN IF NOT EXISTS login_description TEXT,
ADD COLUMN IF NOT EXISTS login_background_url TEXT,
ADD COLUMN IF NOT EXISTS login_background_color TEXT;

-- Update the updated_at timestamp
UPDATE branding_settings 
SET updated_at = now() 
WHERE id IS NOT NULL;

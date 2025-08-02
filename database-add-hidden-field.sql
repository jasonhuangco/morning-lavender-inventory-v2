-- Add hidden field to products table
-- Execute this in your Supabase SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Update existing products to not be hidden by default
UPDATE products SET hidden = FALSE WHERE hidden IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN products.hidden IS 'Controls whether the product appears in inventory lists (true = hidden, false = visible)';

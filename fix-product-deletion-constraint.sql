-- Implement soft deletion for products to preserve order history
-- This allows product "deletion" while maintaining referential integrity

-- Add deleted_at column for soft deletion
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for efficient querying of active/deleted products
CREATE INDEX IF NOT EXISTS idx_products_deleted_at 
ON products(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_active 
ON products(deleted_at) WHERE deleted_at IS NULL;

-- Note: Products with deleted_at IS NOT NULL are considered "deleted"
-- but are preserved in the database to maintain order history integrity.
-- The application will filter these out from active product lists.

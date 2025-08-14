-- Add ordered status tracking to order_items table
-- This allows tracking which items have been purchased/ordered after the inventory count

-- Add the ordered_status column to order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS ordered_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ordered_by TEXT,
ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN order_items.ordered_status IS 'Whether this item has been marked as ordered/purchased by staff';
COMMENT ON COLUMN order_items.ordered_by IS 'Name or identifier of who marked this item as ordered';
COMMENT ON COLUMN order_items.ordered_at IS 'When this item was marked as ordered';

-- Create index for faster querying of ordered items
CREATE INDEX IF NOT EXISTS idx_order_items_ordered_status ON order_items(ordered_status);
CREATE INDEX IF NOT EXISTS idx_order_items_ordered_at ON order_items(ordered_at);

-- Optional: Update existing records to have default values
UPDATE order_items SET ordered_status = FALSE WHERE ordered_status IS NULL;

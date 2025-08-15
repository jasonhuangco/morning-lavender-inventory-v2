-- Add draft functionality for inventory orders
-- This allows users to save their progress without submitting final orders

-- Create drafts table for storing draft inventory data
CREATE TABLE IF NOT EXISTS draft_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  draft_data JSONB NOT NULL, -- Store complete inventory state
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_draft_orders_user_location ON draft_orders(user_name, location_id);
CREATE INDEX IF NOT EXISTS idx_draft_orders_updated_at ON draft_orders(updated_at);

-- Add comment for documentation
COMMENT ON TABLE draft_orders IS 'Stores draft inventory counts that havent been submitted yet';
COMMENT ON COLUMN draft_orders.draft_data IS 'JSON object storing complete inventory state with quantities and order flags';
COMMENT ON COLUMN draft_orders.user_name IS 'Name of user who created the draft';
COMMENT ON COLUMN draft_orders.location_id IS 'Location where inventory is being counted';

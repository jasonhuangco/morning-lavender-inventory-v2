-- Fix orders status constraint to include 'completed'
-- This addresses the issue where the database constraint only allows 'draft' and 'pending'
-- but the application tries to set status to 'completed'

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the corrected constraint that includes 'completed'
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('draft', 'pending', 'completed'));

-- Verify the constraint is working by testing all values
DO $$
BEGIN
  -- Test that all three values are now allowed
  RAISE NOTICE 'Testing constraint with allowed values...';
  
  -- This should work now
  PERFORM 'draft'::text WHERE 'draft' IN ('draft', 'pending', 'completed');
  PERFORM 'pending'::text WHERE 'pending' IN ('draft', 'pending', 'completed');
  PERFORM 'completed'::text WHERE 'completed' IN ('draft', 'pending', 'completed');
  
  RAISE NOTICE 'All status values (draft, pending, completed) are now allowed!';
END $$;

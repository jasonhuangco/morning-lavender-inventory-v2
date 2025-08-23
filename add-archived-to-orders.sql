-- Add archived column to orders table
-- This migration adds an archived boolean column to track archived orders

-- Add the archived column with default value false
ALTER TABLE orders 
ADD COLUMN archived BOOLEAN DEFAULT false NOT NULL;

-- Create index for better query performance when filtering by archived status
CREATE INDEX idx_orders_archived ON orders(archived);

-- Create index for combined archived and created_at for order history queries
CREATE INDEX idx_orders_archived_created_at ON orders(archived, created_at DESC);

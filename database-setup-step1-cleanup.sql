-- Step 1: Clean slate - Drop all existing tables
-- RUN THIS FIRST to remove any problematic tables

DROP TABLE IF EXISTS inventory_counts CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- Remove any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

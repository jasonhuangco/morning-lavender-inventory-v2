-- Add sorting functionality to tables
-- Run this in your Supabase SQL Editor

-- Add sort_order columns to tables
ALTER TABLE locations ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Set initial sort_order values based on creation order
UPDATE locations SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) 
  FROM (SELECT created_at FROM locations l2 WHERE l2.id = locations.id) sub
);

UPDATE categories SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) 
  FROM (SELECT created_at FROM categories c2 WHERE c2.id = categories.id) sub
);

UPDATE suppliers SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) 
  FROM (SELECT created_at FROM suppliers s2 WHERE s2.id = suppliers.id) sub
);

UPDATE products SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) 
  FROM (SELECT created_at FROM products p2 WHERE p2.id = products.id) sub
);

-- Add indexes for sorting performance
CREATE INDEX idx_locations_sort_order ON locations(sort_order);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_suppliers_sort_order ON suppliers(sort_order);
CREATE INDEX idx_products_sort_order ON products(sort_order);

-- Create function to reorder items
CREATE OR REPLACE FUNCTION reorder_items(
  table_name TEXT,
  item_id UUID,
  new_position INTEGER
) RETURNS VOID AS $$
DECLARE
  current_position INTEGER;
BEGIN
  -- Get current position
  EXECUTE format('SELECT sort_order FROM %I WHERE id = $1', table_name) 
  INTO current_position USING item_id;
  
  IF current_position IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;
  
  -- If moving down (increasing position)
  IF new_position > current_position THEN
    EXECUTE format('
      UPDATE %I 
      SET sort_order = sort_order - 1 
      WHERE sort_order > $1 AND sort_order <= $2
    ', table_name) USING current_position, new_position;
  -- If moving up (decreasing position)  
  ELSIF new_position < current_position THEN
    EXECUTE format('
      UPDATE %I 
      SET sort_order = sort_order + 1 
      WHERE sort_order >= $1 AND sort_order < $2
    ', table_name) USING new_position, current_position;
  END IF;
  
  -- Update the item's position
  EXECUTE format('UPDATE %I SET sort_order = $1 WHERE id = $2', table_name) 
  USING new_position, item_id;
END;
$$ LANGUAGE plpgsql;

-- Verification query
SELECT 
  'Sorting setup complete!' as status,
  (SELECT count(*) FROM locations WHERE sort_order IS NOT NULL) as locations_with_sort,
  (SELECT count(*) FROM categories WHERE sort_order IS NOT NULL) as categories_with_sort,
  (SELECT count(*) FROM suppliers WHERE sort_order IS NOT NULL) as suppliers_with_sort,
  (SELECT count(*) FROM products WHERE sort_order IS NOT NULL) as products_with_sort;

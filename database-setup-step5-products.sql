-- Step 5: Add products with proper foreign key references
-- RUN THIS FIFTH after verifying basic data exists

-- Insert products with explicit category and supplier lookups
INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'House Blend Coffee Beans', 
  'Medium roast house blend', 
  'lbs', 
  12.50, 
  10, 
  false, 
  (SELECT id FROM categories WHERE name = 'Coffee Beans'),
  (SELECT id FROM suppliers WHERE name = 'Premium Coffee Co.');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Dark Roast Coffee Beans', 
  'Bold dark roast', 
  'lbs', 
  13.00, 
  8, 
  false, 
  (SELECT id FROM categories WHERE name = 'Coffee Beans'),
  (SELECT id FROM suppliers WHERE name = 'Premium Coffee Co.');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Decaf Coffee Beans', 
  'Swiss water process decaf', 
  'lbs', 
  14.00, 
  5, 
  false, 
  (SELECT id FROM categories WHERE name = 'Coffee Beans'),
  (SELECT id FROM suppliers WHERE name = 'Premium Coffee Co.');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Whole Milk', 
  'Fresh whole milk', 
  'gallons', 
  4.50, 
  20, 
  false, 
  (SELECT id FROM categories WHERE name = 'Milk & Dairy'),
  (SELECT id FROM suppliers WHERE name = 'Fresh Dairy Supply');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  '2% Milk', 
  'Reduced fat milk', 
  'gallons', 
  4.25, 
  15, 
  false, 
  (SELECT id FROM categories WHERE name = 'Milk & Dairy'),
  (SELECT id FROM suppliers WHERE name = 'Fresh Dairy Supply');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Oat Milk', 
  'Plant-based oat milk', 
  'cartons', 
  3.75, 
  10, 
  false, 
  (SELECT id FROM categories WHERE name = 'Milk & Dairy'),
  (SELECT id FROM suppliers WHERE name = 'Fresh Dairy Supply');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Heavy Cream', 
  'Heavy whipping cream', 
  'quarts', 
  5.50, 
  8, 
  false, 
  (SELECT id FROM categories WHERE name = 'Milk & Dairy'),
  (SELECT id FROM suppliers WHERE name = 'Fresh Dairy Supply');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Croissants', 
  'Butter croissants', 
  'dozen', 
  18.00, 
  5, 
  false, 
  (SELECT id FROM categories WHERE name = 'Pastries'),
  (SELECT id FROM suppliers WHERE name = 'Bakery Wholesale');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Vanilla Syrup', 
  'Natural vanilla syrup', 
  'bottles', 
  8.50, 
  6, 
  false, 
  (SELECT id FROM categories WHERE name = 'Syrups'),
  (SELECT id FROM suppliers WHERE name = 'Restaurant Supplies Plus');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  '12oz Paper Cups', 
  'Biodegradable paper cups', 
  'sleeves', 
  25.00, 
  20, 
  false, 
  (SELECT id FROM categories WHERE name = 'Cups & Lids'),
  (SELECT id FROM suppliers WHERE name = 'Restaurant Supplies Plus');

INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) 
SELECT 
  'Sanitizer', 
  'Food-safe sanitizer', 
  'bottles', 
  12.00, 
  8, 
  true, 
  (SELECT id FROM categories WHERE name = 'Cleaning Supplies'),
  (SELECT id FROM suppliers WHERE name = 'Restaurant Supplies Plus');

-- Verify products were inserted
SELECT 
  p.name, 
  c.name as category, 
  s.name as supplier 
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
ORDER BY p.name;

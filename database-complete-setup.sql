-- Morning Lavender Inventory Management Database - COMPLETE SETUP
-- Execute this in your Supabase SQL Editor for new deployments
-- Last Updated: August 2025 - Includes all features and latest updates

-- Drop existing tables if they exist (for fresh deployments)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with roles and category access
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  login_code TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  assigned_categories TEXT[], -- Array of category IDs this user can access (NULL = all categories)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT login_code_format CHECK (login_code ~ '^[0-9]{6}$')
);

-- Create locations table
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT,
  email TEXT,
  phone TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table with all latest fields
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  cost DECIMAL(10,2),
  minimum_threshold INTEGER NOT NULL DEFAULT 1,
  checkbox_only BOOLEAN DEFAULT FALSE,
  hidden BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  location_id UUID REFERENCES locations(id),
  status TEXT CHECK (status IN ('draft', 'pending', 'completed')) DEFAULT 'pending',
  notes TEXT,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table with needs_ordering and ordered status tracking
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  needs_ordering BOOLEAN DEFAULT FALSE,
  ordered_status BOOLEAN DEFAULT FALSE,
  ordered_by TEXT,
  ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample users (replace with your actual users)
INSERT INTO users (first_name, last_name, login_code, email, role) VALUES 
('Admin', 'User', '236868', 'admin@morninglavender.com', 'admin'),
('Staff', 'Member', '622366', 'staff@morninglavender.com', 'staff'),
('Manager', 'Lead', '998877', 'manager@morninglavender.com', 'admin');

-- Insert sample locations
DO $$
DECLARE
    location1_id UUID;
    location2_id UUID;
    location3_id UUID;
BEGIN
    INSERT INTO locations (name, address, sort_order) VALUES 
    ('Downtown Café', '123 Main Street, Downtown', 1),
    ('University Branch', '456 College Ave, University District', 2),
    ('Suburban Location', '789 Oak Road, Suburbs', 3)
    RETURNING id INTO location1_id;
    
    -- Get location IDs for reference
    SELECT id INTO location1_id FROM locations WHERE name = 'Downtown Café';
    SELECT id INTO location2_id FROM locations WHERE name = 'University Branch';
    SELECT id INTO location3_id FROM locations WHERE name = 'Suburban Location';
END $$;

-- Insert sample categories
DO $$
DECLARE
    coffee_cat_id UUID;
    dairy_cat_id UUID;
    pastry_cat_id UUID;
    syrup_cat_id UUID;
    cup_cat_id UUID;
    cleaning_cat_id UUID;
BEGIN
    INSERT INTO categories (name, color, sort_order) VALUES 
    ('Coffee', '#8B4513', 1),
    ('Dairy', '#FFFFFF', 2),
    ('Pastries', '#FFD700', 3),
    ('Syrups', '#FF6B6B', 4),
    ('Cups & Lids', '#4ECDC4', 5),
    ('Cleaning', '#95E1D3', 6)
    RETURNING id INTO coffee_cat_id;
    
    -- Get category IDs for reference
    SELECT id INTO coffee_cat_id FROM categories WHERE name = 'Coffee';
    SELECT id INTO dairy_cat_id FROM categories WHERE name = 'Dairy';
    SELECT id INTO pastry_cat_id FROM categories WHERE name = 'Pastries';
    SELECT id INTO syrup_cat_id FROM categories WHERE name = 'Syrups';
    SELECT id INTO cup_cat_id FROM categories WHERE name = 'Cups & Lids';
    SELECT id INTO cleaning_cat_id FROM categories WHERE name = 'Cleaning';
END $$;

-- Insert sample suppliers
DO $$
DECLARE
    coffee_supplier_id UUID;
    dairy_supplier_id UUID;
    bakery_supplier_id UUID;
    supplies_supplier_id UUID;
BEGIN
    INSERT INTO suppliers (name, contact_info, email, phone, sort_order) VALUES 
    ('Premium Coffee Co', 'Main supplier for coffee beans', 'orders@premiumcoffee.com', '555-0101', 1),
    ('Fresh Dairy Supply', 'Local dairy products', 'orders@freshdairy.com', '555-0102', 2),
    ('Bakery Wholesale', 'Fresh baked goods daily', 'orders@bakerywhol.com', '555-0103', 3),
    ('Restaurant Supplies Plus', 'Complete restaurant supplies', 'orders@restsupply.com', '555-0104', 4)
    RETURNING id INTO coffee_supplier_id;
    
    -- Get supplier IDs for reference
    SELECT id INTO coffee_supplier_id FROM suppliers WHERE name = 'Premium Coffee Co';
    SELECT id INTO dairy_supplier_id FROM suppliers WHERE name = 'Fresh Dairy Supply';
    SELECT id INTO bakery_supplier_id FROM suppliers WHERE name = 'Bakery Wholesale';
    SELECT id INTO supplies_supplier_id FROM suppliers WHERE name = 'Restaurant Supplies Plus';
END $$;

-- Insert sample products with realistic Morning Lavender inventory
DO $$
DECLARE
    coffee_cat_id UUID;
    dairy_cat_id UUID;
    pastry_cat_id UUID;
    syrup_cat_id UUID;
    cup_cat_id UUID;
    cleaning_cat_id UUID;
    coffee_supplier_id UUID;
    dairy_supplier_id UUID;
    bakery_supplier_id UUID;
    supplies_supplier_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO coffee_cat_id FROM categories WHERE name = 'Coffee';
    SELECT id INTO dairy_cat_id FROM categories WHERE name = 'Dairy';
    SELECT id INTO pastry_cat_id FROM categories WHERE name = 'Pastries';
    SELECT id INTO syrup_cat_id FROM categories WHERE name = 'Syrups';
    SELECT id INTO cup_cat_id FROM categories WHERE name = 'Cups & Lids';
    SELECT id INTO cleaning_cat_id FROM categories WHERE name = 'Cleaning';
    
    -- Get supplier IDs
    SELECT id INTO coffee_supplier_id FROM suppliers WHERE name = 'Premium Coffee Co';
    SELECT id INTO dairy_supplier_id FROM suppliers WHERE name = 'Fresh Dairy Supply';
    SELECT id INTO bakery_supplier_id FROM suppliers WHERE name = 'Bakery Wholesale';
    SELECT id INTO supplies_supplier_id FROM suppliers WHERE name = 'Restaurant Supplies Plus';

    -- Insert products
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id, sort_order) VALUES 
    -- Coffee Products
    ('House Blend Coffee Beans', 'Medium roast house blend', 'lbs', 12.50, 10, false, coffee_cat_id, coffee_supplier_id, 1),
    ('Dark Roast Coffee Beans', 'Bold dark roast', 'lbs', 13.00, 8, false, coffee_cat_id, coffee_supplier_id, 2),
    ('Decaf Coffee Beans', 'Swiss water process decaf', 'lbs', 14.00, 5, false, coffee_cat_id, coffee_supplier_id, 3),
    ('Espresso Beans', 'Premium espresso blend', 'lbs', 15.50, 6, false, coffee_cat_id, coffee_supplier_id, 4),
    
    -- Dairy Products
    ('Whole Milk', 'Fresh whole milk', 'gallons', 4.50, 20, false, dairy_cat_id, dairy_supplier_id, 5),
    ('2% Milk', 'Reduced fat milk', 'gallons', 4.25, 15, false, dairy_cat_id, dairy_supplier_id, 6),
    ('Oat Milk', 'Plant-based oat milk', 'cartons', 3.75, 10, false, dairy_cat_id, dairy_supplier_id, 7),
    ('Almond Milk', 'Unsweetened almond milk', 'cartons', 3.50, 8, false, dairy_cat_id, dairy_supplier_id, 8),
    ('Heavy Cream', 'Heavy whipping cream', 'quarts', 5.50, 8, false, dairy_cat_id, dairy_supplier_id, 9),
    
    -- Pastries
    ('Croissants', 'Butter croissants', 'dozen', 18.00, 5, false, pastry_cat_id, bakery_supplier_id, 10),
    ('Muffins', 'Assorted muffins', 'dozen', 15.00, 3, false, pastry_cat_id, bakery_supplier_id, 11),
    ('Scones', 'Traditional scones', 'dozen', 16.00, 4, false, pastry_cat_id, bakery_supplier_id, 12),
    ('Cookies', 'Chocolate chip cookies', 'dozen', 12.00, 4, false, pastry_cat_id, bakery_supplier_id, 13),
    
    -- Syrups
    ('Vanilla Syrup', 'Natural vanilla syrup', 'bottles', 8.50, 6, false, syrup_cat_id, supplies_supplier_id, 14),
    ('Caramel Syrup', 'Rich caramel syrup', 'bottles', 8.75, 6, false, syrup_cat_id, supplies_supplier_id, 15),
    ('Hazelnut Syrup', 'Hazelnut flavored syrup', 'bottles', 8.50, 4, false, syrup_cat_id, supplies_supplier_id, 16),
    ('Lavender Syrup', 'Signature lavender syrup', 'bottles', 9.50, 8, false, syrup_cat_id, supplies_supplier_id, 17),
    ('Rose Syrup', 'Delicate rose syrup', 'bottles', 9.25, 6, false, syrup_cat_id, supplies_supplier_id, 18),
    
    -- Cups & Supplies
    ('12oz Paper Cups', 'Biodegradable paper cups', 'sleeves', 25.00, 20, false, cup_cat_id, supplies_supplier_id, 19),
    ('16oz Paper Cups', 'Large paper cups', 'sleeves', 28.00, 15, false, cup_cat_id, supplies_supplier_id, 20),
    ('Cup Lids', 'Dome lids for hot drinks', 'sleeves', 15.00, 25, false, cup_cat_id, supplies_supplier_id, 21),
    ('Cup Carriers', '4-cup carriers', 'packs', 12.00, 10, false, cup_cat_id, supplies_supplier_id, 22),
    
    -- Cleaning (some checkbox-only)
    ('Sanitizer', 'Food-safe sanitizer', 'bottles', 12.00, 8, true, cleaning_cat_id, supplies_supplier_id, 23),
    ('Paper Towels', 'Commercial paper towels', 'cases', 35.00, 3, false, cleaning_cat_id, supplies_supplier_id, 24),
    ('Dish Soap', 'Commercial dish soap', 'gallons', 18.00, 4, false, cleaning_cat_id, supplies_supplier_id, 25),
    ('Floor Cleaner', 'Commercial floor cleaner', 'bottles', 15.00, 2, true, cleaning_cat_id, supplies_supplier_id, 26);
END $$;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for development/testing (allow all operations)
-- NOTE: In production, restrict these policies based on user authentication and roles

-- Allow all operations for development
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON order_items FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_sort_order ON products(sort_order);
CREATE INDEX idx_orders_location ON orders(location_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_ordered_status ON order_items(ordered_status);
CREATE INDEX idx_order_items_ordered_at ON order_items(ordered_at);
CREATE INDEX idx_users_login_code ON users(login_code);
CREATE INDEX idx_users_assigned_categories ON users USING GIN (assigned_categories);

-- Setup complete message
DO $$
BEGIN
    RAISE NOTICE '🎉 Morning Lavender Inventory Database Setup Complete!';
    RAISE NOTICE '📊 Created: % users, % locations, % categories, % suppliers, % products', 
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM locations), 
        (SELECT COUNT(*) FROM categories),
        (SELECT COUNT(*) FROM suppliers),
        (SELECT COUNT(*) FROM products);
    RAISE NOTICE '🔑 Admin login codes: 236868, 998877';
    RAISE NOTICE '👤 Staff login code: 622366';
    RAISE NOTICE '⚠️  Remember to update RLS policies for production use!';
END $$;

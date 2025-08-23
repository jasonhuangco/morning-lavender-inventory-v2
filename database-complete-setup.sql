-- Morning Lavender Inventory Management Database - COMPLETE SETUP
-- Execute this in your Supabase SQL Editor for new deployments
-- Last Updated: August 2025 - Includes all features and latest updates
-- Features: Orders, Order Items, Products, Categories, Locations, Users, Draft Orders with JSONB storage

-- Drop existing tables if they exist (for fresh deployments)
DROP TABLE IF EXISTS product_suppliers CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS draft_orders CASCADE;

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

-- Create products table with all latest fields (removed category_id and supplier_id for many-to-many)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  cost DECIMAL(10,2),
  minimum_threshold INTEGER NOT NULL DEFAULT 1,
  checkbox_only BOOLEAN DEFAULT FALSE,
  hidden BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_categories junction table for many-to-many relationship
CREATE TABLE product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Mark one category as primary for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Create product_suppliers junction table for many-to-many relationship
CREATE TABLE product_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Mark one supplier as primary for ordering
  cost_override DECIMAL(10,2), -- Override cost for this specific supplier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  location_id UUID REFERENCES locations(id),
  user_name TEXT NOT NULL, -- User who created the order
  status TEXT CHECK (status IN ('draft', 'pending', 'completed')) DEFAULT 'pending',
  archived BOOLEAN DEFAULT false NOT NULL, -- Archive status for order management
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

-- Create draft_orders table for draft functionality
CREATE TABLE draft_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  draft_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create branding_settings table for company customization
CREATE TABLE branding_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'Morning Lavender',
    logo_url TEXT,
    icon_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#8B4513',
    secondary_color TEXT NOT NULL DEFAULT '#E6E6FA',
    accent_color TEXT NOT NULL DEFAULT '#DDA0DD',
    text_color TEXT NOT NULL DEFAULT '#374151',
    background_color TEXT NOT NULL DEFAULT '#F9FAFB',
    -- Login screen customization
    login_title TEXT,
    login_subtitle TEXT,
    login_description TEXT,
    login_background_url TEXT,
    login_background_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample users (replace with your actual users)
INSERT INTO users (first_name, last_name, login_code, email, role) VALUES 
('Admin', 'User', '236868', 'admin@morninglavender.com', 'admin'),
('Staff', 'Member', '622366', 'staff@morninglavender.com', 'staff'),
('Manager', 'Lead', '998877', 'manager@morninglavender.com', 'admin');

-- Insert sample locations
INSERT INTO locations (name, address, sort_order) VALUES 
('Downtown Café', '123 Main Street, Downtown', 1),
('University Branch', '456 College Ave, University District', 2),
('Suburban Location', '789 Oak Road, Suburbs', 3);

-- Insert sample categories
INSERT INTO categories (name, color, sort_order) VALUES 
('Coffee', '#8B4513', 1),
('Dairy', '#FFFFFF', 2),
('Pastries', '#FFD700', 3),
('Syrups', '#FF6B6B', 4),
('Cups & Lids', '#4ECDC4', 5),
('Cleaning', '#95E1D3', 6);

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_info, email, phone, sort_order) VALUES 
('Premium Coffee Co', 'Main supplier for coffee beans', 'orders@premiumcoffee.com', '555-0101', 1),
('Fresh Dairy Supply', 'Local dairy products', 'orders@freshdairy.com', '555-0102', 2),
('Bakery Wholesale', 'Fresh baked goods daily', 'orders@bakerywhol.com', '555-0103', 3),
('Restaurant Supplies Plus', 'Complete restaurant supplies', 'orders@restsupply.com', '555-0104', 4);

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
    product_id UUID;
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

    -- Insert products (without category_id and supplier_id)
    -- Coffee Products
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('House Blend Coffee Beans', 'Medium roast house blend', 'lbs', 12.50, 10, false, 1) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, coffee_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, coffee_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Dark Roast Coffee Beans', 'Bold dark roast', 'lbs', 13.00, 8, false, 2) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, coffee_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, coffee_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Decaf Coffee Beans', 'Swiss water process decaf', 'lbs', 14.00, 5, false, 3) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, coffee_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, coffee_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Espresso Beans', 'Premium espresso blend', 'lbs', 15.50, 6, false, 4) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, coffee_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, coffee_supplier_id, true);
    
    -- Dairy Products
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Whole Milk', 'Fresh whole milk', 'gallons', 4.50, 20, false, 5) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, dairy_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, dairy_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('2% Milk', 'Reduced fat milk', 'gallons', 4.25, 15, false, 6) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, dairy_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, dairy_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Oat Milk', 'Plant-based oat milk', 'cartons', 3.75, 10, false, 7) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, dairy_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, dairy_supplier_id, true);
    -- Add secondary supplier for oat milk (example of multiple suppliers)
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary, cost_override) VALUES (product_id, supplies_supplier_id, false, 3.90);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Almond Milk', 'Unsweetened almond milk', 'cartons', 3.50, 8, false, 8) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, dairy_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, dairy_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Heavy Cream', 'Heavy whipping cream', 'quarts', 5.50, 8, false, 9) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, dairy_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, dairy_supplier_id, true);
    
    -- Pastries (example of products with multiple categories)
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Croissants', 'Butter croissants', 'dozen', 18.00, 5, false, 10) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, pastry_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, bakery_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Muffins', 'Assorted muffins', 'dozen', 15.00, 3, false, 11) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, pastry_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, bakery_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Scones', 'Traditional scones', 'dozen', 16.00, 4, false, 12) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, pastry_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, bakery_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Cookies', 'Chocolate chip cookies', 'dozen', 12.00, 4, false, 13) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, pastry_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, bakery_supplier_id, true);
    
    -- Syrups
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Vanilla Syrup', 'Natural vanilla syrup', 'bottles', 8.50, 6, false, 14) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, syrup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Caramel Syrup', 'Rich caramel syrup', 'bottles', 8.75, 6, false, 15) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, syrup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Hazelnut Syrup', 'Hazelnut flavored syrup', 'bottles', 8.50, 4, false, 16) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, syrup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Lavender Syrup', 'Signature lavender syrup', 'bottles', 9.50, 8, false, 17) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, syrup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Rose Syrup', 'Delicate rose syrup', 'bottles', 9.25, 6, false, 18) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, syrup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);
    
    -- Cups & Supplies
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('12oz Paper Cups', 'Biodegradable paper cups', 'sleeves', 25.00, 20, false, 19) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('16oz Paper Cups', 'Large paper cups', 'sleeves', 28.00, 15, false, 20) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Cup Lids', 'Dome lids for hot drinks', 'sleeves', 15.00, 25, false, 21) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Cup Carriers', '4-cup carriers', 'packs', 12.00, 10, false, 22) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cup_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);
    
    -- Cleaning (some checkbox-only, example of multiple categories)
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Sanitizer', 'Food-safe sanitizer', 'bottles', 12.00, 8, true, 23) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cleaning_cat_id, true);
    -- Add as secondary category to cups & lids since it's used for sanitizing cups
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cup_cat_id, false);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Paper Towels', 'Commercial paper towels', 'cases', 35.00, 3, false, 24) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cleaning_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Dish Soap', 'Commercial dish soap', 'gallons', 18.00, 4, false, 25) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cleaning_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order) VALUES 
    ('Floor Cleaner', 'Commercial floor cleaner', 'bottles', 15.00, 2, true, 26) RETURNING id INTO product_id;
    INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (product_id, cleaning_cat_id, true);
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES (product_id, supplies_supplier_id, true);
END $$;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for development/testing (allow all operations)
-- NOTE: In production, restrict these policies based on user authentication and roles

-- Allow all operations for development
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON product_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON product_suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON draft_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON branding_settings FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_sort_order ON products(sort_order);
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
CREATE INDEX idx_product_categories_primary ON product_categories(product_id, is_primary);
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX idx_product_suppliers_primary ON product_suppliers(product_id, is_primary);
CREATE INDEX idx_orders_location ON orders(location_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_ordered_status ON order_items(ordered_status);
CREATE INDEX idx_order_items_ordered_at ON order_items(ordered_at);
CREATE INDEX idx_orders_archived ON orders(archived);
CREATE INDEX idx_orders_archived_created_at ON orders(archived, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_location_id ON orders(location_id);
CREATE INDEX idx_users_login_code ON users(login_code);
CREATE INDEX idx_users_assigned_categories ON users USING GIN (assigned_categories);
CREATE INDEX idx_draft_orders_user_location ON draft_orders(user_name, location_id);
CREATE INDEX idx_draft_orders_updated_at ON draft_orders(updated_at);

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

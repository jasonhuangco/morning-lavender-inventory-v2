-- Morning Lavender Inventory Management Database Schema
-- Execute this in your Supabase SQL Editor

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS inventory_counts CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- Create locations table
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'each',
  cost DECIMAL(10,2),
  minimum_threshold INTEGER DEFAULT 0,
  checkbox_only BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'ordered', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_counts table (for tracking current stock levels)
CREATE TABLE inventory_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

-- Create indexes for better performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_orders_location_id ON orders(location_id);
CREATE INDEX idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_inventory_counts_product_location ON inventory_counts(product_id, location_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_counts_updated_at BEFORE UPDATE ON inventory_counts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO locations (name, address) VALUES 
('Downtown Café', '123 Main St, Downtown'),
('University Branch', '456 College Ave, University District'),
('Mall Location', '789 Shopping Plaza, Westside');

INSERT INTO categories (name, color) VALUES 
('Coffee Beans', '#8B4513'),
('Pastries', '#FFD700'),
('Milk & Dairy', '#FFFFFF'),
('Syrups', '#FF69B4'),
('Cups & Lids', '#90EE90'),
('Cleaning Supplies', '#87CEEB');

INSERT INTO suppliers (name, contact_info, email, phone) VALUES 
('Premium Coffee Co.', 'contact@premiumcoffee.com', 'orders@premiumcoffee.com', '555-0101'),
('Fresh Dairy Supply', 'Fresh Dairy Supply Inc.', 'dairy@freshsupply.com', '555-0102'),
('Bakery Wholesale', 'Wholesale pastries and baked goods', 'orders@bakerywholesale.com', '555-0103'),
('Restaurant Supplies Plus', 'Complete restaurant supply solutions', 'info@suppliesplus.com', '555-0104');

-- Get the category and supplier IDs for sample products
DO $$
DECLARE
    coffee_cat_id UUID;
    pastry_cat_id UUID;
    dairy_cat_id UUID;
    syrup_cat_id UUID;
    cup_cat_id UUID;
    cleaning_cat_id UUID;
    coffee_supplier_id UUID;
    dairy_supplier_id UUID;
    bakery_supplier_id UUID;
    supplies_supplier_id UUID;
BEGIN
    SELECT id INTO coffee_cat_id FROM categories WHERE name = 'Coffee Beans';
    SELECT id INTO pastry_cat_id FROM categories WHERE name = 'Pastries';
    SELECT id INTO dairy_cat_id FROM categories WHERE name = 'Milk & Dairy';
    SELECT id INTO syrup_cat_id FROM categories WHERE name = 'Syrups';
    SELECT id INTO cup_cat_id FROM categories WHERE name = 'Cups & Lids';
    SELECT id INTO cleaning_cat_id FROM categories WHERE name = 'Cleaning Supplies';
    
    SELECT id INTO coffee_supplier_id FROM suppliers WHERE name = 'Premium Coffee Co.';
    SELECT id INTO dairy_supplier_id FROM suppliers WHERE name = 'Fresh Dairy Supply';
    SELECT id INTO bakery_supplier_id FROM suppliers WHERE name = 'Bakery Wholesale';
    SELECT id INTO supplies_supplier_id FROM suppliers WHERE name = 'Restaurant Supplies Plus';

    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id) VALUES 
    ('House Blend Coffee Beans', 'Medium roast house blend', 'lbs', 12.50, 10, false, coffee_cat_id, coffee_supplier_id),
    ('Dark Roast Coffee Beans', 'Bold dark roast', 'lbs', 13.00, 8, false, coffee_cat_id, coffee_supplier_id),
    ('Decaf Coffee Beans', 'Swiss water process decaf', 'lbs', 14.00, 5, false, coffee_cat_id, coffee_supplier_id),
    
    ('Whole Milk', 'Fresh whole milk', 'gallons', 4.50, 20, false, dairy_cat_id, dairy_supplier_id),
    ('2% Milk', 'Reduced fat milk', 'gallons', 4.25, 15, false, dairy_cat_id, dairy_supplier_id),
    ('Oat Milk', 'Plant-based oat milk', 'cartons', 3.75, 10, false, dairy_cat_id, dairy_supplier_id),
    ('Heavy Cream', 'Heavy whipping cream', 'quarts', 5.50, 8, false, dairy_cat_id, dairy_supplier_id),
    
    ('Croissants', 'Butter croissants', 'dozen', 18.00, 5, false, pastry_cat_id, bakery_supplier_id),
    ('Muffins', 'Assorted muffins', 'dozen', 15.00, 3, false, pastry_cat_id, bakery_supplier_id),
    ('Cookies', 'Chocolate chip cookies', 'dozen', 12.00, 4, false, pastry_cat_id, bakery_supplier_id),
    
    ('Vanilla Syrup', 'Natural vanilla syrup', 'bottles', 8.50, 6, false, syrup_cat_id, supplies_supplier_id),
    ('Caramel Syrup', 'Rich caramel syrup', 'bottles', 8.75, 6, false, syrup_cat_id, supplies_supplier_id),
    ('Hazelnut Syrup', 'Hazelnut flavored syrup', 'bottles', 8.50, 4, false, syrup_cat_id, supplies_supplier_id),
    
    ('12oz Paper Cups', 'Biodegradable paper cups', 'sleeves', 25.00, 20, false, cup_cat_id, supplies_supplier_id),
    ('16oz Paper Cups', 'Large paper cups', 'sleeves', 28.00, 15, false, cup_cat_id, supplies_supplier_id),
    ('Cup Lids', 'Dome lids for hot drinks', 'sleeves', 15.00, 25, false, cup_cat_id, supplies_supplier_id),
    
    ('Sanitizer', 'Food-safe sanitizer', 'bottles', 12.00, 8, true, cleaning_cat_id, supplies_supplier_id),
    ('Paper Towels', 'Commercial paper towels', 'cases', 35.00, 3, false, cleaning_cat_id, supplies_supplier_id),
    ('Dish Soap', 'Commercial dish soap', 'gallons', 18.00, 4, false, cleaning_cat_id, supplies_supplier_id);
END $$;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for authenticated users
-- Note: In production, you'll want more restrictive policies based on user roles

CREATE POLICY "Allow all operations for authenticated users" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON inventory_counts FOR ALL USING (true);

-- For development/testing, allow anonymous access too
CREATE POLICY "Allow anonymous access" ON locations FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON categories FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON products FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON orders FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON inventory_counts FOR ALL USING (true);

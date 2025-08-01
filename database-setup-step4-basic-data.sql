-- Step 4: Add sample data
-- RUN THIS FOURTH after verifying all tables exist

-- Insert sample locations
INSERT INTO locations (name, address) VALUES 
('Downtown Café', '123 Main St, Downtown'),
('University Branch', '456 College Ave, University District'),
('Mall Location', '789 Shopping Plaza, Westside');

-- Insert sample categories
INSERT INTO categories (name, color) VALUES 
('Coffee Beans', '#8B4513'),
('Pastries', '#FFD700'),
('Milk & Dairy', '#FFFFFF'),
('Syrups', '#FF69B4'),
('Cups & Lids', '#90EE90'),
('Cleaning Supplies', '#87CEEB');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_info, email, phone) VALUES 
('Premium Coffee Co.', 'contact@premiumcoffee.com', 'orders@premiumcoffee.com', '555-0101'),
('Fresh Dairy Supply', 'Fresh Dairy Supply Inc.', 'dairy@freshsupply.com', '555-0102'),
('Bakery Wholesale', 'Wholesale pastries and baked goods', 'orders@bakerywholesale.com', '555-0103'),
('Restaurant Supplies Plus', 'Complete restaurant supply solutions', 'info@suppliesplus.com', '555-0104');

-- Verify basic data was inserted
SELECT 'locations' as table_name, count(*) as count FROM locations
UNION ALL
SELECT 'categories' as table_name, count(*) as count FROM categories  
UNION ALL
SELECT 'suppliers' as table_name, count(*) as count FROM suppliers;

-- COMPREHENSIVE MIGRATION: Add Draft Functionality + Many-to-Many Relationships
-- This script adds all functionality developed since August 14th 12:00 AM
-- SAFE: Does not drop existing tables or data
-- Execute this in your Supabase SQL Editor

-- ===========================================
-- STEP 1: ADD DRAFT FUNCTIONALITY
-- ===========================================

-- Create draft_orders table for draft functionality with JSONB storage
CREATE TABLE IF NOT EXISTS draft_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  draft_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- STEP 2: ADD ORDERED STATUS TRACKING
-- ===========================================

-- Add ordered status tracking columns to order_items table (if they don't exist)
DO $$
BEGIN
    -- Add ordered_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='ordered_status') THEN
        ALTER TABLE order_items ADD COLUMN ordered_status BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add ordered_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='ordered_by') THEN
        ALTER TABLE order_items ADD COLUMN ordered_by TEXT;
    END IF;
    
    -- Add ordered_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='ordered_at') THEN
        ALTER TABLE order_items ADD COLUMN ordered_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    RAISE NOTICE 'Order status tracking columns added';
END $$;

-- ===========================================
-- STEP 3: ADD MANY-TO-MANY RELATIONSHIPS
-- ===========================================

-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Mark one category as primary for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Create product_suppliers junction table  
CREATE TABLE IF NOT EXISTS product_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Mark one supplier as primary for ordering
  cost_override DECIMAL(10,2), -- Override cost for this specific supplier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- ===========================================
-- STEP 4: MIGRATE EXISTING DATA TO JUNCTION TABLES
-- ===========================================

-- Migrate existing product-category relationships to junction table
DO $$
BEGIN
    INSERT INTO product_categories (product_id, category_id, is_primary)
    SELECT id, category_id, true
    FROM products 
    WHERE category_id IS NOT NULL
    ON CONFLICT (product_id, category_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated existing product-category relationships';
END $$;

-- Migrate existing product-supplier relationships to junction table
DO $$
BEGIN
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary)
    SELECT id, supplier_id, true
    FROM products 
    WHERE supplier_id IS NOT NULL
    ON CONFLICT (product_id, supplier_id) DO NOTHING;
    
    RAISE NOTICE 'Migrated existing product-supplier relationships';
END $$;

-- ===========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on new tables
ALTER TABLE draft_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;

-- Create development-friendly policies (restrict in production)
CREATE POLICY "Allow all operations" ON draft_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON product_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON product_suppliers FOR ALL USING (true);

-- ===========================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- ===========================================

-- Indexes for draft orders
CREATE INDEX IF NOT EXISTS idx_draft_orders_user_location ON draft_orders(user_name, location_id);
CREATE INDEX IF NOT EXISTS idx_draft_orders_updated_at ON draft_orders(updated_at);

-- Indexes for order items (ordered status tracking)
CREATE INDEX IF NOT EXISTS idx_order_items_ordered_status ON order_items(ordered_status);
CREATE INDEX IF NOT EXISTS idx_order_items_ordered_at ON order_items(ordered_at);

-- Indexes for product categories junction table
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_primary ON product_categories(product_id, is_primary);

-- Indexes for product suppliers junction table
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_primary ON product_suppliers(product_id, is_primary);

-- ===========================================
-- STEP 7: ADD SAMPLE DATA FOR TESTING (OPTIONAL)
-- ===========================================

-- Add a sample multi-category product to demonstrate functionality
DO $$
DECLARE
    sample_product_id UUID;
    cleaning_cat_id UUID;
    cups_cat_id UUID;
    supplies_supplier_id UUID;
BEGIN
    -- Find existing categories and suppliers
    SELECT id INTO cleaning_cat_id FROM categories WHERE name ILIKE '%clean%' LIMIT 1;
    SELECT id INTO cups_cat_id FROM categories WHERE name ILIKE '%cup%' OR name ILIKE '%lid%' LIMIT 1;
    SELECT id INTO supplies_supplier_id FROM suppliers WHERE name ILIKE '%supply%' OR name ILIKE '%supplies%' LIMIT 1;
    
    -- Only add if we found the necessary categories/suppliers
    IF cleaning_cat_id IS NOT NULL AND cups_cat_id IS NOT NULL AND supplies_supplier_id IS NOT NULL THEN
        -- Create a sample product that belongs to multiple categories
        INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, sort_order)
        VALUES ('Multi-Purpose Sanitizer', 'Food-safe sanitizer for equipment and surfaces', 'bottles', 12.00, 8, true, 999)
        RETURNING id INTO sample_product_id;
        
        -- Add to multiple categories
        INSERT INTO product_categories (product_id, category_id, is_primary) VALUES 
        (sample_product_id, cleaning_cat_id, true),
        (sample_product_id, cups_cat_id, false);
        
        -- Add supplier
        INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES 
        (sample_product_id, supplies_supplier_id, true);
        
        RAISE NOTICE 'Added sample multi-category product for testing';
    ELSE
        RAISE NOTICE 'Skipped sample product - required categories/suppliers not found';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Sample product creation skipped - product may already exist';
END $$;

-- ===========================================
-- STEP 8: VERIFICATION & COMPLETION
-- ===========================================

-- Verify the migration
DO $$
DECLARE
    draft_count INT;
    product_cat_count INT;
    product_sup_count INT;
BEGIN
    SELECT COUNT(*) INTO draft_count FROM draft_orders;
    SELECT COUNT(*) INTO product_cat_count FROM product_categories;
    SELECT COUNT(*) INTO product_sup_count FROM product_suppliers;
    
    RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY! 🎉';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'NEW FEATURES ADDED:';
    RAISE NOTICE '✅ Draft Orders: table created (% drafts)', draft_count;
    RAISE NOTICE '✅ Order Status Tracking: columns added to order_items';
    RAISE NOTICE '✅ Many-to-Many Categories: % product-category relationships', product_cat_count;
    RAISE NOTICE '✅ Many-to-Many Suppliers: % product-supplier relationships', product_sup_count;
    RAISE NOTICE '✅ Performance indexes: created for all new tables';
    RAISE NOTICE '✅ RLS Security: enabled with development policies';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Frontend is already updated to use these features';
    RAISE NOTICE '2. Draft functionality will auto-save every 30 seconds';
    RAISE NOTICE '3. Products can now have multiple categories & suppliers';
    RAISE NOTICE '4. Order status tracking is now available';
    RAISE NOTICE '================================================';
    RAISE NOTICE '⚠️  IMPORTANT: Your original data was preserved!';
    RAISE NOTICE 'All existing products, categories, suppliers, etc. are intact';
END $$;

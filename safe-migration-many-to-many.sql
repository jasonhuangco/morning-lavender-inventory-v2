-- Migration Script: Add Many-to-Many Relationships (NON-DESTRUCTIVE)
-- This script adds junction tables WITHOUT dropping existing tables
-- Execute this to add the new many-to-many functionality while preserving data

-- Step 1: Create junction tables for many-to-many relationships

-- Create product_categories junction table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Create product_suppliers junction table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS product_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  cost_override DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Step 2: Migrate existing data from single relationships to many-to-many
-- This populates the junction tables with existing category and supplier relationships

DO $$
BEGIN
    -- Migrate existing product-category relationships
    INSERT INTO product_categories (product_id, category_id, is_primary)
    SELECT id, category_id, true
    FROM products 
    WHERE category_id IS NOT NULL
    ON CONFLICT (product_id, category_id) DO NOTHING;

    -- Migrate existing product-supplier relationships  
    INSERT INTO product_suppliers (product_id, supplier_id, is_primary)
    SELECT id, supplier_id, true
    FROM products 
    WHERE supplier_id IS NOT NULL
    ON CONFLICT (product_id, supplier_id) DO NOTHING;

    RAISE NOTICE 'Migration completed: Existing relationships preserved in junction tables';
END $$;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_primary ON product_categories(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_primary ON product_suppliers(product_id, is_primary);

-- Step 4: Enable Row Level Security on new tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;

-- Step 5: Create development-friendly policies
CREATE POLICY "Allow all operations" ON product_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON product_suppliers FOR ALL USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Many-to-many migration completed successfully!';
    RAISE NOTICE 'Junction tables created: product_categories, product_suppliers';
    RAISE NOTICE 'Existing product relationships have been preserved';
    RAISE NOTICE 'Your original data is safe - no tables were dropped';
END $$;

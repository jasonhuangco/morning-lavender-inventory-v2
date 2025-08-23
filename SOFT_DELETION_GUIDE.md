# Product Soft Deletion Guide

This guide explains the soft deletion system for products, which preserves order history while allowing products to be "deleted" from active use.

## What is Soft Deletion?

Soft deletion marks products as deleted by setting a `deleted_at` timestamp instead of actually removing them from the database. This approach:

- **Preserves Order History**: All past orders remain intact with their product references
- **Prevents Broken References**: No foreign key constraint errors
- **Allows Recovery**: Deleted products can be restored if needed
- **Maintains Data Integrity**: Historical reporting remains accurate

## How It Works

### For Users:
1. **Deleting a Product**: Click "Delete" on any product - it's immediately removed from all active lists
2. **Viewing Deleted Products**: Go to Settings → Product Management → "Show Deleted Products"
3. **Restoring Products**: Click "Restore" on any deleted product to bring it back to active use
4. **Permanent Deletion**: Click "Delete Forever" to permanently remove a product and ALL its order history

### Technical Implementation:
- Products have a new `deleted_at` timestamp field
- The system filters out products where `deleted_at IS NOT NULL`
- Order history continues to reference deleted products correctly
- Soft-deleted products are preserved indefinitely unless permanently deleted

## Database Migration

For existing deployments, run this SQL:

```sql
-- Add soft deletion support to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_products_deleted_at 
ON products(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_active 
ON products(deleted_at) WHERE deleted_at IS NULL;
```

## Managing Deleted Products

### Admin Interface:
1. Navigate to **Settings** → **Product Management**
2. Click **"Show Deleted Products"** at the bottom
3. View all soft-deleted products with deletion timestamps
4. Options for each deleted product:
   - **Restore**: Brings the product back to active use
   - **Delete Forever**: Permanently removes the product and all order history

### Restoration Process:
- Restoring a product sets `deleted_at` back to `NULL`
- The product immediately appears in all active product lists
- All historical data and relationships are preserved
- Sort order and other properties remain unchanged

### Permanent Deletion:
⚠️ **Warning**: This action cannot be undone!

Permanent deletion:
- Removes the product record completely
- Deletes all associated order items (breaks order history)
- Removes product-category and product-supplier relationships
- Should only be used for products that were added by mistake

## Best Practices

### When to Use Soft Deletion:
- Discontinuing products that were used in orders
- Seasonal products that may return
- Products being replaced by new versions
- Cleanup of outdated inventory items

### When to Use Permanent Deletion:
- Test products that were never actually used
- Duplicate entries created by mistake
- Products with no historical significance
- When you're certain you want to remove all traces

### Maintenance Tips:
- Periodically review deleted products (quarterly/yearly)
- Permanently delete test/mistake products to keep database clean
- Consider restoring seasonal products when they return
- Document why products were deleted for future reference

## Impact on System Features

### ✅ What Still Works:
- **Order History**: All past orders display correctly with deleted product names
- **Reports**: Historical reporting includes deleted products accurately  
- **Search**: Past orders can be searched by deleted product names
- **Analytics**: Revenue and quantity data remains intact

### ❌ What Changes:
- **Active Lists**: Deleted products don't appear in inventory, order forms, or product management
- **New Orders**: Deleted products cannot be added to new orders
- **Inventory Counts**: Deleted products are excluded from active inventory tracking
- **CSV Import**: Cannot import products with names matching deleted products

## Database Schema

### Products Table Changes:
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  cost DECIMAL(10,2),
  minimum_threshold INTEGER NOT NULL DEFAULT 1,
  checkbox_only BOOLEAN DEFAULT FALSE,
  hidden BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE, -- NEW: Soft deletion timestamp
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Query Examples:
```sql
-- Get only active products
SELECT * FROM products WHERE deleted_at IS NULL;

-- Get only deleted products
SELECT * FROM products WHERE deleted_at IS NOT NULL;

-- Get all products (active and deleted)
SELECT * FROM products;

-- Soft delete a product
UPDATE products 
SET deleted_at = NOW(), updated_at = NOW() 
WHERE id = 'product-id';

-- Restore a product
UPDATE products 
SET deleted_at = NULL, updated_at = NOW() 
WHERE id = 'product-id';
```

## Migration from Hard Deletion

If you previously had foreign key constraint issues with product deletion, the soft deletion system resolves these problems:

### Before (Hard Deletion Issues):
```sql
-- This would fail if product was used in orders
DELETE FROM products WHERE id = 'some-id';
-- ERROR: foreign key constraint violation
```

### After (Soft Deletion):
```sql
-- This always works - just marks as deleted
UPDATE products 
SET deleted_at = NOW() 
WHERE id = 'some-id';
-- SUCCESS: Product "deleted" but order history preserved
```

## Troubleshooting

### Can't Delete Products:
- Ensure the `deleted_at` column exists in your database
- Check that the migration script was run successfully
- Verify user permissions for UPDATE operations

### Deleted Products Still Appear:
- Clear browser cache and reload
- Check if filters are correctly applying `WHERE deleted_at IS NULL`
- Verify the soft deletion was successful in the database

### Can't Restore Products:
- Ensure the deleted products section is loading properly
- Check database permissions for UPDATE operations
- Verify the product exists in the deleted products list

### Performance Issues:
- Ensure indexes on `deleted_at` column are created
- Consider permanently deleting very old, unused products
- Monitor database size if many products are soft-deleted

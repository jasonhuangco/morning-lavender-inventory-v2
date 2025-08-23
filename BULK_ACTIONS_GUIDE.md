# Bulk Actions Guide

This guide explains how to use the powerful bulk actions feature for managing multiple products efficiently in the Morning Lavender Inventory Management System.

## Overview

The bulk actions feature allows you to perform operations on multiple products simultaneously, dramatically improving productivity when managing large product catalogs.

## Available Bulk Actions

### 1. **Bulk Delete** (Soft Delete)
- Soft deletes multiple products while preserving order history
- Products are immediately hidden from active use
- Can be restored later from the "Deleted Products" section

### 2. **Bulk Categorize**
- Assign categories to multiple products at once
- **Add Categories**: Adds selected categories to products (keeps existing ones)
- **Replace Categories**: Replaces all existing categories with selected ones

### 3. **Bulk Assign Suppliers**
- Set suppliers for multiple products simultaneously  
- **Add Suppliers**: Adds selected suppliers to products (keeps existing ones)
- **Replace Suppliers**: Replaces all existing suppliers with selected ones

### 4. **Bulk Visibility Settings**
- **Show All**: Makes all selected products visible in inventory lists
- **Hide All**: Hides selected products from inventory lists (but keeps in database)
- **Make Checkbox-Only**: Converts products to checkbox-only mode (no quantity tracking)
- **Make Quantity-Based**: Converts products to quantity-based tracking

### 5. **Bulk Export CSV**
- Exports selected products to CSV file
- Includes all product details, categories, and suppliers
- Perfect for external reporting or backup purposes

## How to Use Bulk Actions

### Step 1: Enable Bulk Mode
1. Navigate to **Settings** → **Product Management**
2. Check the **"Bulk Actions"** checkbox at the top of the products list
3. Individual product action buttons will be hidden
4. Checkboxes appear next to each product

### Step 2: Select Products
- **Individual Selection**: Click checkboxes next to specific products
- **Select All**: Click "Select All" to choose all visible products
- **Clear Selection**: Click "Clear Selection" to deselect everything

### Step 3: Perform Bulk Actions
Once products are selected, bulk action buttons appear:
- Click the desired action button
- Follow any additional prompts (e.g., category/supplier selection)
- Confirm the action when prompted

### Step 4: Exit Bulk Mode
- Uncheck the **"Bulk Actions"** checkbox
- Individual product action buttons return
- Selection is automatically cleared

## Bulk Action Details

### Bulk Categorization
When you click "Set Categories":
- A modal appears with all available categories
- Check individual categories to add them to selected products
- Click "Replace All Categories" to remove existing categories first
- Changes are applied immediately

### Bulk Supplier Assignment  
When you click "Set Suppliers":
- A modal appears with all available suppliers
- Check individual suppliers to add them to selected products
- Click "Replace All Suppliers" to remove existing suppliers first
- Changes are applied immediately

### Bulk Visibility Management
The visibility panel offers four options:
- **Show All**: Sets `hidden = false` for all selected products
- **Hide All**: Sets `hidden = true` for all selected products
- **Make Checkbox-Only**: Sets `checkbox_only = true` (for yes/no inventory items)
- **Make Quantity-Based**: Sets `checkbox_only = false` (for tracked quantities)

## Advanced Features

### Smart Filtering with Bulk Actions
- Use category/supplier filters to narrow down products first
- Then use "Select All" to choose only filtered products
- Perform bulk actions on the filtered subset

### Bulk Actions with Search
1. Use the search box to find specific products
2. Enable bulk mode
3. Select all matching products
4. Perform desired bulk action

### CSV Export Details
Exported CSV includes:
- Product name, description, unit
- Cost and minimum threshold
- Checkbox-only and hidden status
- Primary category and supplier names
- File automatically named with current date

## Best Practices

### Preparation
- **Test First**: Try bulk actions on a small subset before large operations
- **Backup**: Export products to CSV before major bulk changes
- **Filter Smart**: Use filters to target specific product groups

### Category Management
- **Plan Structure**: Organize categories before bulk assignment
- **Primary Categories**: Remember first selected category becomes primary
- **User Access**: Consider user category restrictions when bulk assigning

### Supplier Management  
- **Primary Suppliers**: First selected supplier becomes primary
- **Cost Overrides**: Bulk actions don't set custom costs per supplier
- **Validation**: Ensure suppliers are active and properly configured

### Performance Tips
- **Smaller Batches**: For very large catalogs (500+ products), work in batches
- **Clear Filters**: Remove filters before bulk operations to see all affected products
- **Monitor Progress**: Watch for success/error messages after bulk operations

## Troubleshooting

### "Failed to Update" Errors
- **Database Connection**: Check internet connection and database availability
- **User Permissions**: Ensure user has admin rights for bulk operations
- **Category/Supplier Existence**: Verify selected categories/suppliers still exist

### Missing Products After Bulk Action
- **Check Filters**: Products may be filtered out of current view
- **Refresh Page**: Reload the page to see all changes
- **Search**: Use search to locate specific products

### Slow Performance
- **Reduce Selection**: Work with smaller batches of products
- **Close Other Tabs**: Free up browser memory
- **Check Network**: Ensure stable internet connection

### Bulk Delete Concerns
- **Soft Deletion**: Products are not permanently deleted initially
- **Order History**: All past orders remain intact and functional
- **Recovery**: Use "Show Deleted Products" to restore if needed

## Safety Features

### Confirmation Prompts
- All destructive actions require explicit confirmation
- Prompts show exact number of products affected
- Clear descriptions of what will happen

### Undo Options
- **Soft Delete**: Can be reversed via "Deleted Products" section
- **Category/Supplier Changes**: Can be manually reversed
- **Visibility Changes**: Can be toggled back easily

### Data Preservation
- **Order History**: Always preserved regardless of bulk actions
- **Product Relationships**: Many-to-many relationships maintained
- **Audit Trail**: Database tracks all changes with timestamps

## Integration with Other Features

### Works With
- ✅ **User Category Restrictions**: Respects assigned categories per user
- ✅ **Manual Reordering**: Can reorder after bulk operations
- ✅ **CSV Import**: Can import products then bulk-modify them  
- ✅ **Search and Filters**: Combines seamlessly for targeted operations
- ✅ **Soft Deletion**: Integrates with deleted products management

### Limitations
- ❌ **Reorder Mode**: Cannot use bulk actions while in manual reorder mode
- ❌ **Individual Editing**: Individual edit/duplicate buttons hidden in bulk mode
- ❌ **Cost Overrides**: Cannot set supplier-specific costs via bulk actions

## Examples

### Example 1: Seasonal Product Management
```
1. Search for "summer" to find summer products
2. Enable bulk mode and select all results
3. Click "Show/Hide" → "Hide All" to hide for winter season
4. Products remain in system for future use
```

### Example 2: New Supplier Assignment
```
1. Filter by specific category (e.g., "Coffee")
2. Enable bulk mode and select all
3. Click "Set Suppliers" and choose new supplier
4. Click "Replace All Suppliers" to standardize source
```

### Example 3: Category Reorganization
```
1. Select products that need category updates
2. Click "Set Categories"
3. Choose new categories  
4. Use "Replace All Categories" for clean structure
```

This bulk actions system transforms product management from tedious one-by-one operations into efficient batch processing, making inventory management scalable for businesses of all sizes.

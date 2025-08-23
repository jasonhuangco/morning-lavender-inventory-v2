# CSV Import Guide for Products

## Overview
The CSV import functionality allows you to bulk import products into the Morning Lavender Inventory Management System. This is especially useful for initial setup or when adding many products at once.

## CSV Format Requirements

### Required Columns
Your CSV file must include these exact column headers (order doesn't matter):

1. **name** - Product name (text)
2. **minimum_threshold** - Minimum quantity threshold (number)
3. **cost** - Product cost (decimal number)
4. **unit** - Unit of measurement (text, e.g., "lbs", "units", "bottles")
5. **checkbox_only** - Whether this is a checkbox-only item (true/false)
6. **categories** - Product categories (text, use | to separate multiple)
7. **suppliers** - Product suppliers (text, use | to separate multiple)
8. **primary_category** - Which category is primary (must match one from categories)
9. **primary_supplier** - Which supplier is primary (must match one from suppliers)
10. **supplier_costs** - Cost override for each supplier (numbers, use | to separate)

### Data Format Rules

#### Text Fields
- **name**: Any text (required)
- **unit**: Common units like "lbs", "units", "bottles", "each", "packs"
- **categories/suppliers**: Use pipe (|) to separate multiple values
  - Example: "Beverages|Specialty" for multiple categories
  - Example: "Costco|Restaurant Supply Co" for multiple suppliers

#### Number Fields
- **minimum_threshold**: Whole numbers (1, 5, 10, etc.)
- **cost**: Decimal numbers (12.50, 8.99, 25.00)
- **supplier_costs**: Use pipe (|) to separate costs for each supplier
  - Must match the order of suppliers
  - Example: If suppliers are "Costco|Restaurant Supply Co", costs could be "12.50|15.00"

#### Boolean Fields
- **checkbox_only**: Use "true" or "false" (case-insensitive)

#### Category/Supplier Matching
- Categories and suppliers must already exist in your system
- Names are matched case-insensitively
- Primary category must be one of the listed categories
- Primary supplier must be one of the listed suppliers

## Sample CSV

```csv
name,minimum_threshold,cost,unit,checkbox_only,categories,suppliers,primary_category,primary_supplier,supplier_costs
Colombian Coffee Beans,10,12.50,lbs,false,Beverages,Costco|Restaurant Supply Co,Beverages,Costco,12.50|15.00
Vanilla Syrup,5,8.99,bottles,false,Beverages,Beverage Distributor,Beverages,Beverage Distributor,8.99
Paper Cups (16oz),100,25.00,units,false,Supplies,Restaurant Supply Co,Supplies,Restaurant Supply Co,25.00
Cleaning Supplies,1,15.00,units,true,Cleaning,Costco,Cleaning,Costco,15.00
Oat Milk,8,4.50,cartons,false,Beverages,Costco|Local Grocery,Beverages,Costco,4.50|5.25
```

## How to Use

### Step 1: Download Sample CSV
1. Go to Settings > Products
2. Click "Sample CSV" button to download a template
3. Open the downloaded file in Excel, Google Sheets, or any spreadsheet program

### Step 2: Prepare Your Data
1. Replace the sample data with your actual products
2. Ensure all categories and suppliers already exist in your system
3. Double-check that primary categories/suppliers match the listed ones
4. Validate that supplier costs match the supplier order

### Step 3: Import the CSV
1. Click "Import CSV" button
2. Select your prepared CSV file
3. Wait for processing (you'll see a progress indicator)
4. Review the results:
   - ✅ Success: Shows number of products imported
   - ⚠️ Partial success: Shows imported count + errors
   - ❌ Error: Shows what went wrong

### Step 4: Review Results
- **Success messages**: Products were added successfully
- **Error details**: Click to expand and see specific issues
- **Common errors**: Missing categories/suppliers, invalid data formats

## Common Issues and Solutions

### "Category not found" Error
**Problem**: The category name in your CSV doesn't match existing categories
**Solution**: 
- Go to Settings > Categories to see exact category names
- Update your CSV to use exact matching names (case doesn't matter)

### "Supplier not found" Error
**Problem**: The supplier name in your CSV doesn't match existing suppliers
**Solution**:
- Go to Settings > Suppliers to see exact supplier names
- Update your CSV to use exact matching names

### "Primary category must match listed categories" Error
**Problem**: Your primary_category doesn't match one of the categories in the categories column
**Solution**: Ensure primary_category exactly matches one of the pipe-separated categories

### Invalid Number Format
**Problem**: Non-numeric data in cost, minimum_threshold, or supplier_costs
**Solution**: Use only numbers (decimals allowed for costs)

### Supplier Cost Mismatch
**Problem**: Number of supplier costs doesn't match number of suppliers
**Solution**: Provide one cost for each supplier in the same order

## Best Practices

### Before Import
1. **Create categories and suppliers first** - Import won't create new ones
2. **Test with small batches** - Try 5-10 products first
3. **Backup your data** - Export existing products before large imports
4. **Validate in spreadsheet** - Use data validation to catch errors early

### CSV File Preparation
1. **Use proper encoding** - Save as UTF-8 CSV if you have special characters
2. **Avoid extra commas** - Don't use commas in product names or descriptions
3. **Quote complex text** - Wrap text containing commas or quotes in double quotes
4. **Check empty rows** - Remove empty rows to avoid processing errors

### After Import
1. **Review imported products** - Check a few products to ensure data imported correctly
2. **Test functionality** - Try creating an order with imported products
3. **Update as needed** - Use the edit function to fix any issues

## Troubleshooting

### File Won't Upload
- Ensure file has .csv extension
- Check file size (very large files may timeout)
- Try opening and re-saving in a different program

### All Imports Failed
- Check CSV format (headers must match exactly)
- Ensure at least one data row exists
- Verify categories and suppliers exist in your system

### Partial Import Success
- Review error details for specific issues
- Fix errors in original CSV and re-import failed rows
- Duplicate product names will be rejected

## Technical Notes

### Database Schema Compatibility
The import system works with both old and new database schemas:
- **Old schema**: Uses direct category_id and supplier_id foreign keys
- **New schema**: Uses many-to-many relationships with junction tables
- The system automatically handles both formats

### Performance
- Small imports (< 100 products): Process immediately
- Large imports (> 100 products): May take several minutes
- Very large imports: Consider breaking into smaller batches

### Data Validation
- All required fields are validated before import
- Existing products with same names are skipped
- Categories and suppliers are matched by name (case-insensitive)
- Number fields are validated for proper format
- Boolean fields accept various formats (true/false, yes/no, 1/0)

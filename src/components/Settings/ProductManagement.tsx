import { useState } from 'react';
import { Eye, EyeOff, Upload, Download, X, Plus, Minus } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import { getPrimaryCategory, getPrimarySupplier, getProductCategories, getProductSuppliers } from '../../utils/productHelpers';
import { SortableList } from '../SortableList';

export default function ProductManagement() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, reorderProducts, bulkSortProducts } = useInventory();
  const { user } = useAuth();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [autoSortValue, setAutoSortValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [csvImportMessage, setCsvImportMessage] = useState('');
  const [csvImportResults, setCsvImportResults] = useState<{ added: number; errors: string[] }>({ added: 0, errors: [] });
  const [showDeletedProducts, setShowDeletedProducts] = useState(false);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  
  // Bulk actions state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [selectedBulkCategories, setSelectedBulkCategories] = useState<Set<string>>(new Set());
  const [selectedBulkSuppliers, setSelectedBulkSuppliers] = useState<Set<string>>(new Set());
  
  // Add product form state
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'each',
    cost: 0,
    minimum_threshold: 1,
    checkbox_only: false,
    hidden: false,
    categories: [] as Array<{ id: string; is_primary: boolean }>,
    suppliers: [] as Array<{ id: string; is_primary: boolean; cost_override?: number }>,
    // Keep old fields for backward compatibility with existing deployments
    category_id: '',
    supplier_id: ''
  });

  // Helper function to create default form data
  const getDefaultFormData = () => ({
    name: '',
    description: '',
    unit: 'each',
    cost: 0,
    minimum_threshold: 1,
    checkbox_only: false,
    hidden: false,
    categories: [] as Array<{ id: string; is_primary: boolean }>,
    suppliers: [] as Array<{ id: string; is_primary: boolean; cost_override?: number }>,
    // Keep old fields for backward compatibility with existing deployments
    category_id: '',
    supplier_id: ''
  });

  // Helper function to create form data from product
  const getFormDataFromProduct = (product: Product) => {
    console.log('🔍 getFormDataFromProduct called with product:', {
      id: product.id,
      name: product.name,
      has_product_categories: !!product.product_categories,
      has_product_suppliers: !!product.product_suppliers,
      product_categories_count: product.product_categories?.length || 0,
      product_suppliers_count: product.product_suppliers?.length || 0,
      legacy_category_id: product.category_id,
      legacy_supplier_id: product.supplier_id
    });

    const productCategories = getProductCategories(product, categories);
    const productSuppliers = getProductSuppliers(product, suppliers);
    
    console.log('🔍 Helper function results:', {
      productCategories_count: productCategories.length,
      productSuppliers_count: productSuppliers.length,
      productSuppliers_details: productSuppliers.map(ps => ({
        id: ps.supplier.id,
        name: ps.supplier.name,
        is_primary: ps.supplier.id === getPrimarySupplier(product, suppliers)?.id,
        cost_override: ps.cost_override
      }))
    });

    const formData = {
      name: product.name,
      description: product.description || '',
      unit: product.unit,
      cost: product.cost || 0,
      minimum_threshold: product.minimum_threshold,
      checkbox_only: product.checkbox_only || false,
      hidden: product.hidden || false,
      categories: productCategories.map(cat => ({ 
        id: cat.id, 
        is_primary: cat.id === getPrimaryCategory(product, categories)?.id 
      })),
      suppliers: productSuppliers.map(sup => ({ 
        id: sup.supplier.id, 
        is_primary: sup.supplier.id === getPrimarySupplier(product, suppliers)?.id,
        cost_override: sup.cost_override
      })),
      // Backward compatibility fields for existing deployments
      category_id: getPrimaryCategory(product, categories)?.id || '',
      supplier_id: getPrimarySupplier(product, suppliers)?.id || ''
    };

    console.log('🔍 Final formData suppliers:', formData.suppliers);
    
    return formData;
  };

  // Handler for adding/removing categories
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      // Add category
      const newCategories = [...formData.categories, { id: categoryId, is_primary: formData.categories.length === 0 }];
      setFormData({ 
        ...formData, 
        categories: newCategories,
        // Update backward compatibility field
        category_id: newCategories.find(c => c.is_primary)?.id || newCategories[0]?.id || ''
      });
    } else {
      // Remove category
      const newCategories = formData.categories.filter(c => c.id !== categoryId);
      // If we removed the primary, make the first one primary
      if (newCategories.length > 0 && !newCategories.find(c => c.is_primary)) {
        newCategories[0].is_primary = true;
      }
      setFormData({ 
        ...formData, 
        categories: newCategories,
        // Update backward compatibility field
        category_id: newCategories.find(c => c.is_primary)?.id || ''
      });
    }
  };

  // Handler for setting primary category
  const handlePrimaryCategory = (categoryId: string) => {
    const newCategories = formData.categories.map(c => ({
      ...c,
      is_primary: c.id === categoryId
    }));
    setFormData({ 
      ...formData, 
      categories: newCategories,
      // Update backward compatibility field
      category_id: categoryId
    });
  };

  // Handler for adding/removing suppliers
  const handleSupplierChange = (supplierId: string, checked: boolean) => {
    if (checked) {
      // Add supplier
      const newSuppliers = [...formData.suppliers, { id: supplierId, is_primary: formData.suppliers.length === 0 }];
      setFormData({ 
        ...formData, 
        suppliers: newSuppliers,
        // Update backward compatibility field
        supplier_id: newSuppliers.find(s => s.is_primary)?.id || newSuppliers[0]?.id || ''
      });
    } else {
      // Remove supplier
      const newSuppliers = formData.suppliers.filter(s => s.id !== supplierId);
      // If we removed the primary, make the first one primary
      if (newSuppliers.length > 0 && !newSuppliers.find(s => s.is_primary)) {
        newSuppliers[0].is_primary = true;
      }
      setFormData({ 
        ...formData, 
        suppliers: newSuppliers,
        // Update backward compatibility field
        supplier_id: newSuppliers.find(s => s.is_primary)?.id || ''
      });
    }
  };

  // Handler for setting primary supplier
  const handlePrimarySupplier = (supplierId: string) => {
    const newSuppliers = formData.suppliers.map(s => ({
      ...s,
      is_primary: s.id === supplierId
    }));
    setFormData({ 
      ...formData, 
      suppliers: newSuppliers,
      // Update backward compatibility field
      supplier_id: supplierId
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.categories.length === 0) {
      alert('Please select at least one category.');
      return;
    }
    
    if (formData.suppliers.length === 0) {
      alert('Please select at least one supplier.');
      return;
    }
    
    console.log('🔍 ProductManagement submitting formData:', formData);
    
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(getFormDataFromProduct(product));
    setShowAddForm(true); // Show form when editing
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData(getDefaultFormData());
    setShowAddForm(false); // Hide form when resetting
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleDuplicate = (product: Product) => {
    const duplicateData = getFormDataFromProduct(product);
    duplicateData.name = `${product.name} (Copy)`;
    setFormData(duplicateData);
    setEditingProduct(null); // Ensure we're in "add" mode
    
    // Scroll to form
    const formElement = document.querySelector('.bg-gray-50');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Custom reorder function for filtered products
  const handleFilteredReorder = async (sourceIndex: number, destinationIndex: number) => {
    // If filters are active, we need to map the filtered indices back to the full products array
    if (selectedCategoryFilter !== 'all' || selectedSupplierFilter !== 'all') {
      const sourceProduct = filteredProducts[sourceIndex];
      const destinationProduct = filteredProducts[destinationIndex];
      
      const fullSourceIndex = products.findIndex(p => p.id === sourceProduct.id);
      const fullDestinationIndex = products.findIndex(p => p.id === destinationProduct.id);
      
      if (fullSourceIndex !== -1 && fullDestinationIndex !== -1) {
        await reorderProducts(fullSourceIndex, fullDestinationIndex);
      }
    } else {
      // No filters active, use normal reorder
      await reorderProducts(sourceIndex, destinationIndex);
    }
  };

  const handleAutoSortByName = async () => {
    try {
      console.log('🔄 Sorting products by name...');
      // Create a copy of products sorted by name
      const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
      console.log('📋 Sorted products:', sortedProducts.map(p => p.name));
      
      // Apply the new sort order using bulk sort
      await bulkSortProducts(sortedProducts);
      console.log('✅ Products sorted by name successfully');
    } catch (error) {
      console.error('Error sorting products by name:', error);
      alert('Failed to sort products. Please try again.');
    }
  };

  const handleAutoSortBySupplier = async () => {
    try {
      // Create a copy of products sorted by supplier name, then by product name
      const sortedProducts = [...products].sort((a, b) => {
        const supplierA = suppliers.find(s => s.id === a.supplier_id)?.name || '';
        const supplierB = suppliers.find(s => s.id === b.supplier_id)?.name || '';
        
        // First sort by supplier name
        const supplierCompare = supplierA.localeCompare(supplierB);
        if (supplierCompare !== 0) {
          return supplierCompare;
        }
        
        // If suppliers are the same, sort by product name
        return a.name.localeCompare(b.name);
      });
      
      // Apply the new sort order using bulk sort
      await bulkSortProducts(sortedProducts);
    } catch (error) {
      console.error('Error sorting products by supplier:', error);
      alert('Failed to sort products. Please try again.');
    }
  };

  const handleAutoSortByCategory = async () => {
    try {
      // Create a copy of products sorted by category name, then by product name
      const sortedProducts = [...products].sort((a, b) => {
        const categoryA = categories.find(c => c.id === a.category_id)?.name || '';
        const categoryB = categories.find(c => c.id === b.category_id)?.name || '';
        
        // First sort by category name
        const categoryCompare = categoryA.localeCompare(categoryB);
        if (categoryCompare !== 0) {
          return categoryCompare;
        }
        
        // If categories are the same, sort by product name
        return a.name.localeCompare(b.name);
      });
      
      // Apply the new sort order using bulk sort
      await bulkSortProducts(sortedProducts);
    } catch (error) {
      console.error('Error sorting products by category:', error);
      alert('Failed to sort products. Please try again.');
    }
  };

  const handleAutoSort = async (sortType: string) => {
    console.log('🎯 Auto sort triggered with type:', sortType);
    if (sortType === '') return; // Do nothing if no option selected
    
    try {
      switch (sortType) {
        case 'name':
          await handleAutoSortByName();
          break;
        case 'supplier':
          await handleAutoSortBySupplier();
          break;
        case 'category':
          await handleAutoSortByCategory();
          break;
      }
      // Reset the dropdown after successful sort
      setAutoSortValue('');
    } catch (error) {
      console.error('Error during auto sort:', error);
      // Reset the dropdown even if there's an error
      setAutoSortValue('');
    }
  };

  const toggleProductVisibility = async (productId: string, currentlyHidden: boolean) => {
    try {
      await updateProduct(productId, { hidden: !currentlyHidden });
    } catch (error) {
      console.error('Error toggling product visibility:', error);
      alert('Failed to update product visibility. Please try again.');
    }
  };

  // CSV Import Functions
  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const processCsvData = async (csvData: string[][]) => {
    const [headers, ...rows] = csvData;
    const results = { added: 0, errors: [] as string[] };
    
    // Expected headers
    const expectedHeaders = [
      'name', 'minimum_threshold', 'cost', 'unit', 'checkbox_only', 
      'categories', 'suppliers', 'primary_category', 'primary_supplier', 'supplier_costs'
    ];
    
    // Validate headers
    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      results.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return results;
    }
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because we start from row 1 and header is row 1
      
      try {
        if (row.length === 0 || !row[0]?.trim()) continue; // Skip empty rows
        
        const rowData: { [key: string]: string } = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index]?.trim() || '';
        });
        
        // Parse categories and suppliers
        const categoryNames = rowData.categories ? rowData.categories.split('|').map(s => s.trim()) : [];
        const supplierNames = rowData.suppliers ? rowData.suppliers.split('|').map(s => s.trim()) : [];
        const supplierCosts = rowData.supplier_costs ? rowData.supplier_costs.split('|').map(s => parseFloat(s.trim()) || 0) : [];
        
        // Find category and supplier IDs
        const productCategories = categoryNames.map(name => {
          const category = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
          if (!category) {
            throw new Error(`Category "${name}" not found`);
          }
          return {
            id: category.id,
            is_primary: name.toLowerCase() === rowData.primary_category?.toLowerCase()
          };
        });
        
        const productSuppliers = supplierNames.map((name, index) => {
          const supplier = suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
          if (!supplier) {
            throw new Error(`Supplier "${name}" not found`);
          }
          return {
            id: supplier.id,
            is_primary: name.toLowerCase() === rowData.primary_supplier?.toLowerCase(),
            cost_override: supplierCosts[index] || undefined
          };
        });
        
        // Ensure at least one primary category and supplier
        if (productCategories.length > 0 && !productCategories.some(c => c.is_primary)) {
          productCategories[0].is_primary = true;
        }
        if (productSuppliers.length > 0 && !productSuppliers.some(s => s.is_primary)) {
          productSuppliers[0].is_primary = true;
        }
        
        const productData = {
          name: rowData.name,
          minimum_threshold: parseInt(rowData.minimum_threshold) || 1,
          cost: parseFloat(rowData.cost) || 0,
          unit: rowData.unit || 'each',
          checkbox_only: rowData.checkbox_only?.toLowerCase() === 'true',
          hidden: false,
          categories: productCategories,
          suppliers: productSuppliers,
          // Backward compatibility fields
          category_id: productCategories.length > 0 ? productCategories.find(c => c.is_primary)?.id || productCategories[0].id : '',
          supplier_id: productSuppliers.length > 0 ? productSuppliers.find(s => s.is_primary)?.id || productSuppliers[0].id : ''
        };
        
        await addProduct(productData);
        results.added++;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Row ${rowNum}: ${errorMsg}`);
      }
    }
    
    return results;
  };

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    setCsvImportStatus('processing');
    setCsvImportMessage('Processing CSV file...');
    
    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      
      if (csvData.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }
      
      const results = await processCsvData(csvData);
      setCsvImportResults(results);
      
      if (results.errors.length === 0) {
        setCsvImportStatus('success');
        setCsvImportMessage(`Successfully imported ${results.added} products!`);
      } else {
        setCsvImportStatus('error');
        setCsvImportMessage(`Imported ${results.added} products with ${results.errors.length} errors. See details below.`);
      }
      
    } catch (error) {
      setCsvImportStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to process CSV file';
      setCsvImportMessage(errorMsg);
      setCsvImportResults({ added: 0, errors: [errorMsg] });
    }
    
    // Reset file input
    event.target.value = '';
  };

  const downloadSampleCsv = () => {
    const sampleData = `name,minimum_threshold,cost,unit,checkbox_only,categories,suppliers,primary_category,primary_supplier,supplier_costs
Colombian Coffee Beans,10,12.50,lbs,false,Beverages,Costco|Restaurant Supply Co,Beverages,Costco,12.50|15.00
Vanilla Syrup,5,8.99,bottles,false,Beverages,Beverage Distributor,Beverages,Beverage Distributor,8.99
Paper Cups (16oz),100,25.00,units,false,Supplies,Restaurant Supply Co,Supplies,Restaurant Supply Co,25.00`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-products-import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Functions for managing deleted products
  const loadDeletedProducts = async () => {
    setLoadingDeleted(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { config } = await import('../../config/env');
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            id,
            category_id,
            is_primary,
            created_at,
            categories (*)
          ),
          product_suppliers (
            id,
            supplier_id,
            is_primary,
            cost_override,
            created_at,
            suppliers (*)
          )
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error loading deleted products:', error);
        return;
      }

      // Transform data similar to the main products
      const transformedData = data?.map((product: any) => {
        const productCategories = Array.isArray(product.product_categories) ? product.product_categories : [];
        const productSuppliers = Array.isArray(product.product_suppliers) ? product.product_suppliers : [];
        
        return {
          ...product,
          category_id: productCategories.find((pc: any) => pc.is_primary)?.category_id,
          supplier_id: productSuppliers.find((ps: any) => ps.is_primary)?.supplier_id,
          primary_category: productCategories.find((pc: any) => pc.is_primary)?.categories,
          primary_supplier: productSuppliers.find((ps: any) => ps.is_primary)?.suppliers,
        };
      }) || [];

      setDeletedProducts(transformedData);
    } catch (error) {
      console.error('Error loading deleted products:', error);
    } finally {
      setLoadingDeleted(false);
    }
  };

  const restoreProduct = async (id: string) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { config } = await import('../../config/env');
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      const { error } = await supabase
        .from('products')
        .update({ 
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error restoring product:', error);
        alert('Failed to restore product');
        return;
      }

      // Remove from deleted products list
      setDeletedProducts(prev => prev.filter(p => p.id !== id));
      
      // Reload main products to show the restored product
      window.location.reload(); // Simple reload to refresh all data
      
      alert('Product restored successfully!');
    } catch (error) {
      console.error('Error restoring product:', error);
      alert('Failed to restore product');
    }
  };

  const permanentlyDeleteProduct = async (id: string, productName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE "${productName}"? This action cannot be undone and will remove all associated order history.`)) {
      return;
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { config } = await import('../../config/env');
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      // First delete related records
      await supabase.from('order_items').delete().eq('product_id', id);
      await supabase.from('product_categories').delete().eq('product_id', id);
      await supabase.from('product_suppliers').delete().eq('product_id', id);
      
      // Then delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error permanently deleting product:', error);
        alert('Failed to permanently delete product');
        return;
      }

      // Remove from deleted products list
      setDeletedProducts(prev => prev.filter(p => p.id !== id));
      
      alert('Product permanently deleted!');
    } catch (error) {
      console.error('Error permanently deleting product:', error);
      alert('Failed to permanently delete product');
    }
  };

  // Bulk action functions
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedProducts(new Set());
    setBulkActionType('');
    setSelectedBulkCategories(new Set());
    setSelectedBulkSuppliers(new Set());
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const selectAllProducts = () => {
    const allProductIds = new Set(filteredProducts.map(p => p.id));
    setSelectedProducts(allProductIds);
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  const bulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    const selectedCount = selectedProducts.size;
    
    if (!confirm(`Are you sure you want to delete ${selectedCount} selected products? They will be soft-deleted and can be restored later.`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedProducts).map(productId => 
        deleteProduct(productId)
      );
      
      await Promise.all(deletePromises);
      
      alert(`Successfully deleted ${selectedCount} products`);
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      alert('Failed to delete some products. Please try again.');
    }
  };

  const bulkUpdateCategories = async (categoryIds: string[], replaceAll: boolean = false) => {
    if (selectedProducts.size === 0 || categoryIds.length === 0) return;

    const selectedCount = selectedProducts.size;
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { config } = await import('../../config/env');
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);

      for (const productId of selectedProducts) {
        // Remove existing categories if replacing
        if (replaceAll) {
          await supabase.from('product_categories').delete().eq('product_id', productId);
        }

        // Add new categories (avoid duplicates for add mode)
        for (let index = 0; index < categoryIds.length; index++) {
          const categoryId = categoryIds[index];
          
          // Check if category already exists (for add mode)
          if (!replaceAll) {
            const { data: existing } = await supabase
              .from('product_categories')
              .select('id')
              .eq('product_id', productId)
              .eq('category_id', categoryId)
              .single();
            
            if (existing) continue; // Skip if already exists
          }

          // Insert the category relationship
          await supabase.from('product_categories').insert({
            product_id: productId,
            category_id: categoryId,
            is_primary: replaceAll && index === 0 // First category is primary only when replacing
          });
        }
      }

      // Show success message before reload
      alert(`Successfully updated categories for ${selectedCount} products`);
      
      // Clear selection and reload products to reflect changes
      setSelectedProducts(new Set());
      window.location.reload();
    } catch (error) {
      console.error('Error bulk updating categories:', error);
      alert('Failed to update categories. Please try again.');
    }
  };

  const bulkUpdateSuppliers = async (supplierIds: string[], replaceAll: boolean = false) => {
    if (selectedProducts.size === 0 || supplierIds.length === 0) return;

    const selectedCount = selectedProducts.size;
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { config } = await import('../../config/env');
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);

      for (const productId of selectedProducts) {
        // Remove existing suppliers if replacing
        if (replaceAll) {
          await supabase.from('product_suppliers').delete().eq('product_id', productId);
        }

        // Add new suppliers (avoid duplicates for add mode)
        for (let index = 0; index < supplierIds.length; index++) {
          const supplierId = supplierIds[index];
          
          // Check if supplier already exists (for add mode)
          if (!replaceAll) {
            const { data: existing } = await supabase
              .from('product_suppliers')
              .select('id')
              .eq('product_id', productId)
              .eq('supplier_id', supplierId)
              .single();
            
            if (existing) continue; // Skip if already exists
          }

          // Insert the supplier relationship
          await supabase.from('product_suppliers').insert({
            product_id: productId,
            supplier_id: supplierId,
            is_primary: replaceAll && index === 0 // First supplier is primary only when replacing
          });
        }
      }

      // Show success message before reload
      alert(`Successfully updated suppliers for ${selectedCount} products`);
      
      // Clear selection and reload products to reflect changes
      setSelectedProducts(new Set());
      window.location.reload();
    } catch (error) {
      console.error('Error bulk updating suppliers:', error);
      alert('Failed to update suppliers. Please try again.');
    }
  };

  const bulkUpdateField = async (field: string, value: any) => {
    if (selectedProducts.size === 0) return;

    const selectedCount = selectedProducts.size;
    
    try {
      const updates = Array.from(selectedProducts).map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return Promise.resolve();
        
        return updateProduct(productId, { [field]: value });
      });

      await Promise.all(updates);
      
      alert(`Successfully updated ${field} for ${selectedCount} products`);
      setSelectedProducts(new Set());
    } catch (error) {
      console.error(`Error bulk updating ${field}:`, error);
      alert(`Failed to update ${field}. Please try again.`);
    }
  };

  const bulkExportCsv = () => {
    if (selectedProducts.size === 0) return;

    const selectedProductData = products.filter(p => selectedProducts.has(p.id));
    
    const csvData = [
      ['Name', 'Description', 'Unit', 'Cost', 'Min Threshold', 'Checkbox Only', 'Hidden', 'Category', 'Supplier'],
      ...selectedProductData.map(product => [
        product.name,
        product.description || '',
        product.unit,
        product.cost?.toString() || '0',
        product.minimum_threshold.toString(),
        product.checkbox_only.toString(),
        product.hidden.toString(),
        getPrimaryCategory(product, categories)?.name || '',
        getPrimarySupplier(product, suppliers)?.name || ''
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert(`Exported ${selectedProducts.size} products to CSV`);
  };

  // Filter categories based on user access
  const availableCategories = categories.filter(category => {
    // If user has no restrictions, show all categories
    if (!user || !user.assigned_categories || user.assigned_categories.length === 0) {
      return true;
    }
    // Only show categories user has access to
    return user.assigned_categories.includes(category.id);
  });

  // Filter products based on selected category, supplier, search query, and user access
  const filteredProducts = products.filter(product => {
    // Filter by user's assigned categories (if user has restrictions)
    if (user && user.assigned_categories && user.assigned_categories.length > 0) {
      const hasAccessToCategory = product.category_id && 
        user.assigned_categories.includes(product.category_id);
      if (!hasAccessToCategory) {
        return false;
      }
    }

    const categoryMatch = selectedCategoryFilter === 'all' || product.category_id === selectedCategoryFilter;
    const supplierMatch = selectedSupplierFilter === 'all' || product.supplier_id === selectedSupplierFilter;
    
    // Search functionality - search in product name, description, and supplier/category names
    const searchMatch = searchQuery === '' || [
      product.name,
      product.description || '',
      suppliers.find(s => s.id === product.supplier_id)?.name || '',
      categories.find(c => c.id === product.category_id)?.name || ''
    ].some(field => field.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && supplierMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
        
        {/* CSV Import Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Sample CSV
          </button>
          
          <button
            type="button"
            onClick={() => setShowCsvImport(!showCsvImport)}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
        </div>
      </div>

      {/* CSV Import Section */}
      {showCsvImport && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-blue-900">Import Products from CSV</h3>
              <p className="text-sm text-blue-700 mt-1">
                Upload a CSV file to bulk import products. Download the sample CSV to see the required format.
              </p>
            </div>
            <button
              onClick={() => setShowCsvImport(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="block w-full text-sm text-blue-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
            
            {/* Import Status */}
            {csvImportStatus !== 'idle' && (
              <div className={`p-4 rounded-md ${
                csvImportStatus === 'success' ? 'bg-green-50 border border-green-200' :
                csvImportStatus === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {csvImportStatus === 'success' && (
                      <div className="h-5 w-5 text-green-400">✓</div>
                    )}
                    {csvImportStatus === 'error' && (
                      <div className="h-5 w-5 text-red-400">✗</div>
                    )}
                    {csvImportStatus === 'processing' && (
                      <div className="h-5 w-5 text-yellow-400">⏳</div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${
                      csvImportStatus === 'success' ? 'text-green-800' :
                      csvImportStatus === 'error' ? 'text-red-800' :
                      'text-yellow-800'
                    }`}>
                      {csvImportMessage}
                    </h4>
                    
                    {/* Error Details */}
                    {csvImportResults.errors.length > 0 && (
                      <div className="mt-2">
                        <details className="text-sm text-red-700">
                          <summary className="cursor-pointer font-medium">
                            View Error Details ({csvImportResults.errors.length})
                          </summary>
                          <ul className="mt-2 list-disc list-inside space-y-1">
                            {csvImportResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* CSV Format Help */}
            <div className="bg-white p-4 rounded border">
              <h4 className="text-sm font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Required columns:</strong> name, minimum_threshold, cost, unit, checkbox_only, categories, suppliers, primary_category, primary_supplier, supplier_costs</li>
                <li>• <strong>Multiple values:</strong> Use pipe (|) to separate multiple categories/suppliers (e.g., "Beverages|Specialty")</li>
                <li>• <strong>Boolean values:</strong> Use "true" or "false" for checkbox_only field</li>
                <li>• <strong>Categories/Suppliers:</strong> Must match existing names exactly (case-insensitive)</li>
                <li>• <strong>Primary fields:</strong> Must match one of the categories/suppliers listed</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Form - Collapsible */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-4xl">
        {/* Add Product Button - Always visible */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center w-full sm:w-auto bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors mb-4"
        >
          {showAddForm ? (
            <>
              <Minus className="w-5 h-5 mr-2" />
              Hide Add Product Form
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </>
          )}
        </button>

        {/* Expanded Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-6 rounded-lg -mx-4 -mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
            </div>
        
            <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
          {/* Product Name - Full width on mobile, half width on desktop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full max-w-md p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Three column grid for numeric fields - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Threshold
              </label>
              <input
                type="number"
                value={formData.minimum_threshold}
                onChange={(e) => setFormData({ ...formData, minimum_threshold: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. lbs, bottles, cases"
              />
            </div>
          </div>

          {/* Category and Supplier - Two column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories * (Select multiple, first is primary)
              </label>
              <div className="border border-gray-300 rounded-md p-2 space-y-2 max-h-40 overflow-y-auto">
                {availableCategories.map(category => {
                  const isSelected = formData.categories.some(c => c.id === category.id);
                  const isPrimary = formData.categories.find(c => c.id === category.id)?.is_primary;
                  return (
                    <div key={category.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={isSelected}
                        onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`category-${category.id}`} className="flex-1 text-sm">
                        {category.name}
                        {isPrimary && <span className="ml-1 text-blue-600 font-bold">(Primary)</span>}
                      </label>
                      {isSelected && !isPrimary && (
                        <button
                          type="button"
                          onClick={() => handlePrimaryCategory(category.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suppliers * (Select multiple, first is primary)
              </label>
              <div className="border border-gray-300 rounded-md p-2 space-y-2 max-h-40 overflow-y-auto">
                {suppliers.map(supplier => {
                  const isSelected = formData.suppliers.some(s => s.id === supplier.id);
                  const isPrimary = formData.suppliers.find(s => s.id === supplier.id)?.is_primary;
                  return (
                    <div key={supplier.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`supplier-${supplier.id}`}
                        checked={isSelected}
                        onChange={(e) => handleSupplierChange(supplier.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`supplier-${supplier.id}`} className="flex-1 text-sm">
                        {supplier.name}
                        {isPrimary && <span className="ml-1 text-green-600 font-bold">(Primary)</span>}
                      </label>
                      {isSelected && !isPrimary && (
                        <button
                          type="button"
                          onClick={() => handlePrimarySupplier(supplier.id)}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="checkbox_only"
              checked={formData.checkbox_only}
              onChange={(e) => setFormData({ ...formData, checkbox_only: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="checkbox_only" className="text-sm text-gray-700">
              Checkbox only (no quantity entry)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hidden"
              checked={formData.hidden}
              onChange={(e) => setFormData({ ...formData, hidden: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="hidden" className="text-sm text-gray-700">
              Hidden from inventory list
            </label>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            
            {editingProduct && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
          </div>
        )}
      </div>
      
      {/* Products List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Current Products</h3>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Auto Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Auto Sort:</span>
                <select
                  onChange={(e) => {
                    setAutoSortValue(e.target.value);
                    handleAutoSort(e.target.value);
                  }}
                  value={autoSortValue}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
                  disabled={reorderMode || selectedCategoryFilter !== 'all' || selectedSupplierFilter !== 'all'}
                  title={
                    selectedCategoryFilter !== 'all' || selectedSupplierFilter !== 'all' 
                      ? "Clear filters to use auto-sort"
                      : "Sort products by selected criteria"
                  }
                >
                  <option value="">Select sort option</option>
                  <option value="name">Sort by Name</option>
                  <option value="supplier">Sort by Supplier</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>
              
              {/* Manual Reorder Toggle */}
              <div className="flex items-center space-x-2 sm:pl-4 sm:border-l sm:border-gray-200">
                <input
                  type="checkbox"
                  id="reorder-mode"
                  checked={reorderMode}
                  onChange={(e) => setReorderMode(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="reorder-mode" className="text-sm text-gray-600 whitespace-nowrap">
                  Manual Reorder
                </label>
              </div>

              {/* Bulk Actions Toggle */}
              <div className="flex items-center space-x-2 sm:pl-4 sm:border-l sm:border-gray-200">
                <input
                  type="checkbox"
                  id="bulk-mode"
                  checked={bulkMode}
                  onChange={toggleBulkMode}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="bulk-mode" className="text-sm text-gray-600 whitespace-nowrap">
                  Bulk Actions
                </label>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {bulkMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedProducts.size} selected
                  </span>
                  <button
                    onClick={selectAllProducts}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Select All ({filteredProducts.length})
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-gray-600 hover:text-gray-700"
                  >
                    Clear Selection
                  </button>
                </div>
                
                {selectedProducts.size > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={bulkDelete}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete ({selectedProducts.size})
                    </button>
                    <button
                      onClick={() => setBulkActionType('categories')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Set Categories
                    </button>
                    <button
                      onClick={() => setBulkActionType('suppliers')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Set Suppliers
                    </button>
                    <button
                      onClick={() => setBulkActionType('visibility')}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Show/Hide
                    </button>
                    <button
                      onClick={bulkExportCsv}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Export CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Action Modals */}
          {bulkActionType === 'categories' && selectedProducts.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Set Categories for {selectedProducts.size} products</h4>
                <button
                  onClick={() => {
                    setBulkActionType('');
                    setSelectedBulkCategories(new Set());
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableCategories.map(category => (
                    <label key={category.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedBulkCategories.has(category.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedBulkCategories);
                          if (e.target.checked) {
                            newSelected.add(category.id);
                          } else {
                            newSelected.delete(category.id);
                          }
                          setSelectedBulkCategories(newSelected);
                        }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      if (selectedBulkCategories.size > 0) {
                        bulkUpdateCategories(Array.from(selectedBulkCategories), false);
                        setBulkActionType('');
                        setSelectedBulkCategories(new Set());
                      } else {
                        alert('Please select at least one category');
                      }
                    }}
                    disabled={selectedBulkCategories.size === 0}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add Selected Categories
                  </button>
                  <button
                    onClick={() => {
                      if (selectedBulkCategories.size > 0) {
                        bulkUpdateCategories(Array.from(selectedBulkCategories), true);
                        setBulkActionType('');
                        setSelectedBulkCategories(new Set());
                      } else {
                        alert('Please select at least one category');
                      }
                    }}
                    disabled={selectedBulkCategories.size === 0}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Replace All Categories
                  </button>
                </div>
              </div>
            </div>
          )}

          {bulkActionType === 'suppliers' && selectedProducts.size > 0 && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Set Suppliers for {selectedProducts.size} products</h4>
                <button
                  onClick={() => {
                    setBulkActionType('');
                    setSelectedBulkSuppliers(new Set());
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suppliers.map(supplier => (
                    <label key={supplier.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedBulkSuppliers.has(supplier.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedBulkSuppliers);
                          if (e.target.checked) {
                            newSelected.add(supplier.id);
                          } else {
                            newSelected.delete(supplier.id);
                          }
                          setSelectedBulkSuppliers(newSelected);
                        }}
                      />
                      <span className="text-sm">{supplier.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      if (selectedBulkSuppliers.size > 0) {
                        bulkUpdateSuppliers(Array.from(selectedBulkSuppliers), false);
                        setBulkActionType('');
                        setSelectedBulkSuppliers(new Set());
                      } else {
                        alert('Please select at least one supplier');
                      }
                    }}
                    disabled={selectedBulkSuppliers.size === 0}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add Selected Suppliers
                  </button>
                  <button
                    onClick={() => {
                      if (selectedBulkSuppliers.size > 0) {
                        bulkUpdateSuppliers(Array.from(selectedBulkSuppliers), true);
                        setBulkActionType('');
                        setSelectedBulkSuppliers(new Set());
                      } else {
                        alert('Please select at least one supplier');
                      }
                    }}
                    disabled={selectedBulkSuppliers.size === 0}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Replace All Suppliers
                  </button>
                </div>
              </div>
            </div>
          )}

          {bulkActionType === 'visibility' && selectedProducts.size > 0 && (
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Visibility Settings for {selectedProducts.size} products</h4>
                <button
                  onClick={() => setBulkActionType('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => bulkUpdateField('hidden', false)}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Show All
                </button>
                <button
                  onClick={() => bulkUpdateField('hidden', true)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Hide All
                </button>
                <button
                  onClick={() => bulkUpdateField('checkbox_only', true)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Make Checkbox-Only
                </button>
                <button
                  onClick={() => bulkUpdateField('checkbox_only', false)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Make Quantity-Based
                </button>
              </div>
            </div>
          )}
          
          {/* Search Box */}
          <div className="mb-4">
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Search products, suppliers, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <span className="text-sm text-gray-600 font-medium">Filters:</span>
              
              {/* Category and Supplier Filters Container */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Category:</label>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0 flex-1"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Supplier Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Supplier:</label>
                  <select
                    value={selectedSupplierFilter}
                    onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0 flex-1"
                  >
                    <option value="all">All Suppliers</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Clear Filters Button - Hidden on mobile, shown inline on larger screens */}
              {(selectedCategoryFilter !== 'all' || selectedSupplierFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedCategoryFilter('all');
                    setSelectedSupplierFilter('all');
                  }}
                  className="hidden md:inline-block text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
            
            {/* Mobile Clear Filters Button and Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mt-3">
              {/* Clear Filters Button - Shown on mobile */}
              {(selectedCategoryFilter !== 'all' || selectedSupplierFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedCategoryFilter('all');
                    setSelectedSupplierFilter('all');
                  }}
                  className="md:hidden text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 self-start"
                >
                  Clear Filters
                </button>
              )}
              
              {/* Results Count */}
              <span className="text-sm text-gray-500">
                Showing {filteredProducts.length} of {products.length} products
              </span>
            </div>
          </div>
          
          {reorderMode && (
            <div className="text-sm text-gray-500">
              <p>Drag and drop to reorder products manually</p>
              {(selectedCategoryFilter !== 'all' || selectedSupplierFilter !== 'all') && (
                <p className="text-yellow-600 mt-1">
                  ⚠️ Filters are active - reordering will affect the global product order
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <div className="px-6 py-4 text-gray-500 text-center">
              No products found. Add your first product above.
            </div>
          ) : (
            <SortableList
              items={filteredProducts}
              onReorder={handleFilteredReorder}
              keyExtractor={(product) => product.id}
              enabled={reorderMode}
              renderItem={(product) => {
                const category = categories.find(c => c.id === product.category_id);
                const supplier = suppliers.find(s => s.id === product.supplier_id);
                
                return (
                  <div className={`px-6 py-4 bg-white border border-gray-200 rounded-lg ${reorderMode ? 'cursor-move hover:bg-gray-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start justify-between mb-2">
                      {/* Left side content */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Bulk selection checkbox */}
                        {bulkMode && (
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </div>
                        )}

                        {/* Reorder handle */}
                        {reorderMode && (
                          <div className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                            </svg>
                          </div>
                        )}
                        
                        <div className={`flex-1 min-w-0 ${product.hidden ? 'opacity-50' : ''}`}>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            {product.hidden && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                                Hidden
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 space-x-4">
                            <span>Unit: {product.unit}</span>
                            <span>Min: {product.minimum_threshold}</span>
                            {category && <span>Category: {category.name}</span>}
                            {supplier && <span>Supplier: {supplier.name}</span>}
                          </div>
                          {product.description && (
                            <p className="mt-1 text-xs text-gray-600">{product.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - tags and hide/show icon only */}
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                        {/* Checkbox Only tag */}
                        {product.checkbox_only && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Checkbox Only
                          </span>
                        )}
                        
                        {/* Hide/Show icon */}
                        {!reorderMode && (
                          <button
                            onClick={() => toggleProductVisibility(product.id, product.hidden || false)}
                            className={`text-sm font-medium px-2 py-1 ${
                              product.hidden 
                                ? 'text-gray-400 hover:text-gray-600' 
                                : 'text-green-600 hover:text-green-700'
                            }`}
                            title={product.hidden ? 'Show in inventory' : 'Hide from inventory'}
                          >
                            {product.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom action buttons - horizontal layout */}
                    {!reorderMode && !bulkMode && (
                      <div className="flex justify-start space-x-4 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* Deleted Products Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Deleted Products</h3>
          <div className="flex space-x-2">
            {!showDeletedProducts && (
              <button
                onClick={() => {
                  setShowDeletedProducts(true);
                  loadDeletedProducts();
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Show Deleted Products
              </button>
            )}
            {showDeletedProducts && (
              <button
                onClick={() => setShowDeletedProducts(false)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Hide Deleted Products
              </button>
            )}
          </div>
        </div>

        {showDeletedProducts && (
          <div className="space-y-4">
            {loadingDeleted ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading deleted products...</p>
              </div>
            ) : deletedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No deleted products found.</p>
                <p className="text-sm mt-1">Deleted products preserve order history while being hidden from active use.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-md">
                  <strong>Soft Deletion:</strong> These products were deleted but preserved to maintain order history. 
                  You can restore them to active use or permanently delete them (which will remove all order history).
                </div>
                
                {deletedProducts.map((product) => (
                  <div key={product.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        <div className="flex space-x-4 text-xs text-gray-500 mt-2">
                          <span>Unit: {product.unit}</span>
                          <span>Cost: ${product.cost?.toFixed(2) || '0.00'}</span>
                          <span>Min Threshold: {product.minimum_threshold}</span>
                          <span>Category: {product.primary_category?.name || 'No category'}</span>
                          <span>Supplier: {product.primary_supplier?.name || 'No supplier'}</span>
                        </div>
                        <div className="text-xs text-red-600 mt-2">
                          Deleted: {product.deleted_at ? new Date(product.deleted_at).toLocaleString() : 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => restoreProduct(product.id)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => permanentlyDeleteProduct(product.id, product.name)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

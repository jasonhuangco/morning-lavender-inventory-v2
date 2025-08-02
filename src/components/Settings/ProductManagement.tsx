import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { Product } from '../../types';
import { SortableList } from '../SortableList';

export default function ProductManagement() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, reorderProducts, bulkSortProducts } = useInventory();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [autoSortValue, setAutoSortValue] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'each',
    cost: 0,
    minimum_threshold: 1,
    checkbox_only: false,
    hidden: false,
    category_id: '',
    supplier_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id) {
      alert('Please select a category.');
      return;
    }
    
    if (!formData.supplier_id) {
      alert('Please select a supplier.');
      return;
    }
    
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
    setFormData({
      name: product.name,
      description: product.description || '',
      unit: product.unit,
      cost: product.cost || 0,
      minimum_threshold: product.minimum_threshold,
      checkbox_only: product.checkbox_only,
      hidden: product.hidden || false,
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || ''
    });
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      unit: 'each',
      cost: 0,
      minimum_threshold: 1,
      checkbox_only: false,
      hidden: false,
      category_id: '',
      supplier_id: ''
    });
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
    setFormData({
      name: `${product.name} (Copy)`,
      description: product.description || '',
      unit: product.unit,
      cost: product.cost || 0,
      minimum_threshold: product.minimum_threshold,
      checkbox_only: product.checkbox_only,
      hidden: product.hidden || false,
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || ''
    });
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

  // Filter products based on selected category and supplier
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategoryFilter === 'all' || product.category_id === selectedCategoryFilter;
    const supplierMatch = selectedSupplierFilter === 'all' || product.supplier_id === selectedSupplierFilter;
    return categoryMatch && supplierMatch;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
      
      {/* Add/Edit Form */}
      <div className="bg-gray-50 p-6 rounded-lg max-w-4xl">
        <h3 className="text-lg font-medium mb-4">
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </h3>
        
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
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
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
      
      {/* Products List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Current Products</h3>
            <div className="flex items-center space-x-4">
              {/* Auto Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Auto Sort:</span>
                <select
                  onChange={(e) => {
                    setAutoSortValue(e.target.value);
                    handleAutoSort(e.target.value);
                  }}
                  value={autoSortValue}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
                <input
                  type="checkbox"
                  id="reorder-mode"
                  checked={reorderMode}
                  onChange={(e) => setReorderMode(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="reorder-mode" className="text-sm text-gray-600">
                  Manual Reorder
                </label>
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm text-gray-600 font-medium">Filters:</span>
            
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Category:</label>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Supplier Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Supplier:</label>
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters */}
            {(selectedCategoryFilter !== 'all' || selectedSupplierFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setSelectedSupplierFilter('all');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300"
              >
                Clear Filters
              </button>
            )}
            
            {/* Results Count */}
            <span className="text-sm text-gray-500">
              Showing {filteredProducts.length} of {products.length} products
            </span>
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
                  <div className={`px-6 py-4 flex items-center justify-between bg-white ${reorderMode ? 'cursor-move hover:bg-gray-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center space-x-3">
                      {reorderMode && (
                        <div className="text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                          </svg>
                        </div>
                      )}
                      
                      <div className={`flex-1 ${product.hidden ? 'opacity-50' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                          {product.hidden && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Hidden
                            </span>
                          )}
                          {product.checkbox_only && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Checkbox Only
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
                    
                    {!reorderMode && (
                      <div className="flex space-x-2">
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
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1"
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
    </div>
  );
}

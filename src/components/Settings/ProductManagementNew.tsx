import { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Product } from '../../types';

export default function ProductManagement() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct } = useInventory();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'each',
    cost: 0,
    minimum_threshold: 1,
    checkbox_only: false,
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
      
      {/* Add/Edit Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
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
          <h3 className="text-lg font-medium text-gray-900">Current Products</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <div className="px-6 py-4 text-gray-500 text-center">
              No products found. Add your first product above.
            </div>
          ) : (
            products.map(product => {
              const category = categories.find(c => c.id === product.category_id);
              const supplier = suppliers.find(s => s.id === product.supplier_id);
              
              return (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                      {product.checkbox_only && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Checkbox Only
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 space-x-4">
                      <span>Unit: {product.unit}</span>
                      {product.cost && <span>Cost: ${product.cost}</span>}
                      <span>Min: {product.minimum_threshold}</span>
                      {category && <span>Category: {category.name}</span>}
                      {supplier && <span>Supplier: {supplier.name}</span>}
                    </div>
                    {product.description && (
                      <p className="mt-1 text-xs text-gray-600">{product.description}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

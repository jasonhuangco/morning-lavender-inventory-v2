import { useState } from 'react';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { Supplier } from '../../types';
import { SortableList } from '../SortableList';

export default function SupplierManagement() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, reorderSuppliers } = useInventory();
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_info: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: formData.name,
          contact_info: formData.contact_info || undefined
        });
      } else {
        await addSupplier({
          name: formData.name,
          contact_info: formData.contact_info || undefined
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Failed to save supplier. Please try again.');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_info: supplier.contact_info || ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      try {
        await deleteSupplier(supplier.id);
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Failed to delete supplier. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', contact_info: '' });
    setEditingSupplier(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          {isEditing && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Supplier Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Costco, Sysco, Trader Joe's"
              required
            />
          </div>

          <div>
            <label className="label">Contact Information</label>
            <textarea
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              className="input"
              rows={3}
              placeholder="Website, phone, email, or other contact details"
            />
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Suppliers List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Existing Suppliers ({suppliers.length})
          </h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reorder-mode-suppliers"
              checked={reorderMode}
              onChange={(e) => setReorderMode(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="reorder-mode-suppliers" className="text-sm text-gray-600">
              Enable Reordering
            </label>
          </div>
        </div>
        {reorderMode && (
          <p className="text-sm text-gray-500 mb-4">Drag and drop to reorder suppliers</p>
        )}

        {suppliers.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No suppliers added yet.</p>
            <p className="text-sm text-gray-400">Add your first supplier above.</p>
          </div>
        ) : (
          <SortableList
            items={suppliers}
            onReorder={reorderSuppliers}
            keyExtractor={(supplier) => supplier.id}
            enabled={reorderMode}
            renderItem={(supplier) => (
              <div className={`border border-gray-200 rounded-lg p-4 bg-white mb-3 ${reorderMode ? 'cursor-move hover:bg-gray-50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {reorderMode && (
                      <div className="text-gray-400 hover:text-gray-600 mt-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-5 w-5 text-gray-400" />
                        <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                      </div>
                      
                      {supplier.contact_info && (
                        <div className="text-sm text-gray-600 mt-1 ml-7">
                          <p className="whitespace-pre-wrap">{supplier.contact_info}</p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-2 ml-7">
                        Created: {new Date(supplier.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {!reorderMode && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit supplier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete supplier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

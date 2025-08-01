import { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { Category } from '../../types';
import { SortableList } from '../SortableList';

const PRESET_COLORS = [
  '#8B4513', // Coffee Brown
  '#FFD700', // Pastry Gold
  '#4169E1', // Cleaning Blue
  '#228B22', // Fresh Green
  '#DC143C', // Emergency Red
  '#FF8C00', // Warning Orange
  '#9370DB', // Supply Purple
  '#20B2AA', // Equipment Teal
  '#F4A460', // Ingredient Sandy
  '#CD853F'  // Package Peru
];

export default function CategoryManagement() {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useInventory();
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          color: formData.color
        });
      } else {
        await addCategory({
          name: formData.name,
          color: formData.color
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color || PRESET_COLORS[0]
    });
    setIsEditing(true);
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', color: PRESET_COLORS[0] });
    setEditingCategory(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
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
            <label className="label">Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Coffee, Pastries, Cleaning"
              required
            />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">Custom color</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              {editingCategory ? 'Update Category' : 'Add Category'}
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

      {/* Categories List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Existing Categories ({categories.length})
          </h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reorder-mode-categories"
              checked={reorderMode}
              onChange={(e) => setReorderMode(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="reorder-mode-categories" className="text-sm text-gray-600">
              Enable Reordering
            </label>
          </div>
        </div>
        {reorderMode && (
          <p className="text-sm text-gray-500 mb-4">Drag and drop to reorder categories</p>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No categories added yet.</p>
            <p className="text-sm text-gray-400">Add your first category above.</p>
          </div>
        ) : (
          <SortableList
            items={categories}
            onReorder={reorderCategories}
            keyExtractor={(category) => category.id}
            enabled={reorderMode}
            renderItem={(category) => (
              <div className={`border border-gray-200 rounded-lg p-4 bg-white mb-3 ${reorderMode ? 'cursor-move hover:bg-gray-50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {reorderMode && (
                      <div className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                      </div>
                    )}
                    
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || '#6b7280' }}
                    />
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>

                  {!reorderMode && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <p className={`text-xs text-gray-400 mt-2 ${reorderMode ? 'ml-11' : ''}`}>
                  Created: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

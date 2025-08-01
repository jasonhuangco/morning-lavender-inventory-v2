import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { Location } from '../../types';
import { SortableList } from '../SortableList';

export default function LocationManagement() {
  const { locations, addLocation, updateLocation, deleteLocation, reorderLocations } = useInventory();
  const [isEditing, setIsEditing] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, {
          name: formData.name,
          address: formData.address || undefined
        });
      } else {
        await addLocation({
          name: formData.name,
          address: formData.address || undefined
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location. Please try again.');
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (location: Location) => {
    if (window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
      try {
        await deleteLocation(location.id);
      } catch (error) {
        console.error('Error deleting location:', error);
        alert('Failed to delete location. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '' });
    setEditingLocation(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingLocation ? 'Edit Location' : 'Add New Location'}
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
            <label className="label">Location Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Downtown Café"
              required
            />
          </div>

          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              placeholder="e.g., 123 Main St, City, State"
            />
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              {editingLocation ? 'Update Location' : 'Add Location'}
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

      {/* Locations List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Existing Locations ({locations.length})
          </h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reorder-mode-locations"
              checked={reorderMode}
              onChange={(e) => setReorderMode(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="reorder-mode-locations" className="text-sm text-gray-600">
              Enable Reordering
            </label>
          </div>
        </div>
        {reorderMode && (
          <p className="text-sm text-gray-500 mb-4">Drag and drop to reorder locations</p>
        )}

        {locations.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No locations added yet.</p>
            <p className="text-sm text-gray-400">Add your first location above.</p>
          </div>
        ) : (
          <SortableList
            items={locations}
            onReorder={reorderLocations}
            keyExtractor={(location) => location.id}
            enabled={reorderMode}
            renderItem={(location) => (
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
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <h3 className="font-medium text-gray-900">{location.name}</h3>
                      </div>
                      
                      {location.address && (
                        <p className="text-sm text-gray-600 mt-1 ml-7">
                          {location.address}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-2 ml-7">
                        Created: {new Date(location.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {!reorderMode && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(location)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete location"
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

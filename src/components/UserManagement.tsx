import React, { useState } from 'react';
import { User } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, generateLoginCode } = useInventory();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    login_code: '',
    email: '',
    role: 'staff' as 'admin' | 'staff',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      login_code: '',
      email: '',
      role: 'staff',
      is_active: true
    });
    setIsAddingUser(false);
    setEditingUser(null);
    setError(null);
  };

  const handleAddUser = () => {
    setIsAddingUser(true);
    setFormData({
      first_name: '',
      last_name: '',
      login_code: '',
      email: '',
      role: 'staff',
      is_active: true
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      login_code: user.login_code,
      email: user.email || '',
      role: user.role || 'staff', // Default to staff if role is not set
      is_active: user.is_active
    });
  };

  const handleGenerateCode = async () => {
    try {
      const newCode = await generateLoginCode();
      setFormData(prev => ({ ...prev, login_code: newCode }));
    } catch (err) {
      setError('Failed to generate login code');
    }
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.login_code.trim()) {
      setError('Login code is required');
      return false;
    }
    if (!/^\d{6}$/.test(formData.login_code)) {
      setError('Login code must be exactly 6 digits');
      return false;
    }

    // Check for duplicate codes (excluding current user when editing)
    const existingUser = users.find(user => 
      user.login_code === formData.login_code && 
      (!editingUser || user.id !== editingUser.id)
    );
    if (existingUser) {
      setError('This login code is already in use');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (editingUser) {
        // Check if we're changing the role
        const isRoleChange = editingUser.role !== formData.role;
        const currentUserCode = JSON.parse(localStorage.getItem('inventory_user') || '{}').login_code;
        const isCurrentUser = editingUser.login_code === currentUserCode;
        
        await updateUser(editingUser.id, formData);
        
        // Show notification for role changes
        if (isRoleChange) {
          if (isCurrentUser) {
            alert(`⚠️ Your role has been changed to ${formData.role}. The page will refresh to apply the changes.`);
            // The page will auto-refresh from the updateUser function
          } else {
            alert(`✅ User role updated to ${formData.role}. They will see changes on their next login.`);
          }
        }
      } else {
        await addUser(formData);
      }
      resetForm();
    } catch (err: any) {
      console.error('User operation failed:', err);
      const action = editingUser ? 'update' : 'add';
      const errorMessage = err?.message || `Failed to ${action} user`;
      setError(`Failed to ${action} user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteUser(id);
      setShowConfirmDelete(null);
    } catch (err: any) {
      console.error('Delete user failed:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      setError(`Failed to delete user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeVisibility = (userId: string) => {
    setVisibleCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button
          onClick={handleAddUser}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit User Form */}
      {(isAddingUser || editingUser) && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'staff' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="staff">Staff - Inventory Access Only</option>
                <option value="admin">Admin - Full Access</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-Digit Login Code *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.login_code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData(prev => ({ ...prev, login_code: value }));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active User
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Users ({users.length})</h3>
        </div>
        <div className="divide-y">
          {users.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No users found. Add your first user to get started.
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </h4>
                      {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Role: <span className={`font-medium ${(user.role || 'staff') === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
                          {(user.role || 'staff') === 'admin' ? 'Admin' : 'Staff'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Code:</span>
                      <span className="font-mono text-sm">
                        {visibleCodes.has(user.id) ? user.login_code : '••••••'}
                      </span>
                      <button
                        onClick={() => toggleCodeVisibility(user.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {visibleCodes.has(user.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-800"
                    disabled={loading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(user.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

import { useState } from 'react';
import { Settings as SettingsIcon, MapPin, Tag, Truck, Package, Users } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import LocationManagement from '../components/Settings/LocationManagement';
import CategoryManagement from '../components/Settings/CategoryManagement';
import SupplierManagement from '../components/Settings/SupplierManagement';
import ProductManagement from '../components/Settings/ProductManagement';
import UserManagement from '../components/UserManagement';

type SettingsTab = 'locations' | 'categories' | 'suppliers' | 'products' | 'users';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('locations');
  const { loading } = useInventory();

  const tabs = [
    {
      id: 'locations' as const,
      name: 'Locations',
      icon: MapPin,
      description: 'Manage café locations'
    },
    {
      id: 'categories' as const,
      name: 'Categories',
      icon: Tag,
      description: 'Manage product categories'
    },
    {
      id: 'suppliers' as const,
      name: 'Suppliers',
      icon: Truck,
      description: 'Manage suppliers'
    },
    {
      id: 'products' as const,
      name: 'Products',
      icon: Package,
      description: 'Manage inventory products'
    },
    {
      id: 'users' as const,
      name: 'Users',
      icon: Users,
      description: 'Manage user accounts and login codes'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'locations':
        return <LocationManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'suppliers':
        return <SupplierManagement />;
      case 'products':
        return <ProductManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="card">
        <p className="text-gray-600">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}

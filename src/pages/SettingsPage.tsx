import { useState } from 'react';
import { Settings as SettingsIcon, MapPin, Tag, Truck, Package, Users, Palette } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import LocationManagement from '../components/Settings/LocationManagement';
import CategoryManagement from '../components/Settings/CategoryManagement';
import SupplierManagement from '../components/Settings/SupplierManagement';
import ProductManagement from '../components/Settings/ProductManagement';
import UserManagement from '../components/UserManagement';
import { BrandingManagement } from '../components/BrandingManagement';

type SettingsTab = 'locations' | 'categories' | 'suppliers' | 'products' | 'users' | 'branding';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('locations');
  const { loading } = useInventory();

  const tabs = [
    {
      id: 'locations' as const,
      name: 'Locations',
      icon: MapPin,
      helpContent: 'Add and manage café locations. Each location can have its own inventory counts and order requirements. Use locations to organize your inventory by physical store locations.'
    },
    {
      id: 'categories' as const,
      name: 'Categories',
      icon: Tag,
      helpContent: 'Create product categories to organize your inventory. Categories help with filtering during inventory counts and can be used to restrict user access to specific product types.'
    },
    {
      id: 'suppliers' as const,
      name: 'Suppliers',
      icon: Truck,
      helpContent: 'Manage your supplier information including contact details and ordering preferences. Suppliers are linked to products and used when generating orders.'
    },
    {
      id: 'products' as const,
      name: 'Products',
      icon: Package,
      helpContent: 'Add and manage all inventory products. Set minimum thresholds, assign categories and suppliers, and configure whether items require quantity counts or are checkbox-only.'
    },
    {
      id: 'users' as const,
      name: 'Users',
      icon: Users,
      helpContent: 'Manage user accounts and access codes. Create login codes for staff, assign category restrictions, and control who can access different parts of the inventory system.'
    },
    {
      id: 'branding' as const,
      name: 'Branding',
      icon: Palette,
      helpContent: 'Customize the appearance of your inventory system. Set company colors, logos, and text to match your brand identity across all pages.'
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
      case 'branding':
        return <BrandingManagement />;
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

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}

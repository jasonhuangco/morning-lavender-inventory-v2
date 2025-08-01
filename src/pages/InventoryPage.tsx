import { useState, useEffect } from 'react';
import { Search, Filter, Send } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import ProductCard from '../components/Inventory/ProductCard';
import LocationSelector from '../components/Inventory/LocationSelector';
import CategoryFilter from '../components/Inventory/CategoryFilter';

export default function InventoryPage() {
  const {
    products,
    locations,
    categories,
    currentLocation,
    userName,
    setCurrentLocation,
    setUserName,
    updateProductQuantity,
    submitOrder,
    loading
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [inventoryData, setInventoryData] = useState<{[key: string]: { quantity: number; shouldOrder: boolean }}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize inventory data when products change
  useEffect(() => {
    const initialData: {[key: string]: { quantity: number; shouldOrder: boolean }} = {};
    products.forEach(product => {
      const currentQuantity = product.current_quantity || 0;
      initialData[product.id] = {
        quantity: currentQuantity,
        shouldOrder: currentQuantity < product.minimum_threshold
      };
    });
    setInventoryData(initialData);
  }, [products]);

  // Filter products based on search and categories
  const filteredProducts = products.filter(product => {
    // Note: Location filtering removed since products aren't tied to specific locations in the new schema
    // All products are available at all locations

    // Filter by search term
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      const hasMatchingCategory = product.category_id && 
        selectedCategories.includes(product.category_id);
      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  });

  const handleQuantityChange = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const shouldOrder = quantity < product.minimum_threshold;
    
    setInventoryData(prev => ({
      ...prev,
      [productId]: {
        quantity,
        shouldOrder
      }
    }));

    updateProductQuantity(productId, quantity);
  };

  const handleOrderToggle = (productId: string, shouldOrder: boolean) => {
    setInventoryData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        shouldOrder
      }
    }));
  };

  const handleSubmitOrder = async () => {
    if (!currentLocation || !userName) {
      alert('Please select a location and enter your name before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert shouldOrder to should_order for API
      const apiInventoryData: {[productId: string]: { quantity: number; should_order: boolean }} = {};
      Object.entries(inventoryData).forEach(([productId, data]) => {
        apiInventoryData[productId] = {
          quantity: data.quantity,
          should_order: data.shouldOrder
        };
      });

      await submitOrder({
        location_id: currentLocation,
        user_name: userName,
        products: apiInventoryData
      });

      // Reset form after successful submission
      setInventoryData({});
      // Note: keeping location and user name for convenience
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsToOrder = Object.values(inventoryData).filter(item => item.shouldOrder).length;

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
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Count</h1>
        
        {currentLocation && userName && (
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || itemsToOrder === 0}
            className="btn btn-primary flex items-center justify-center md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Submitting...' : `Submit Order (${itemsToOrder} items)`}
          </button>
        )}
      </div>

      {/* User Info & Location Selection */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Start Count</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name</label>
            <input
              type="text"
              value={userName || ''}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="input"
            />
          </div>
          
          <LocationSelector
            locations={locations}
            selectedLocation={currentLocation}
            onLocationChange={setCurrentLocation}
          />
        </div>
      </div>

      {/* Show products only if location and name are selected */}
      {currentLocation && userName ? (
        <>
          {/* Search and Filters */}
          <div className="card space-y-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary flex items-center justify-center md:w-auto"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {selectedCategories.length > 0 && (
                  <span className="ml-2 bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs">
                    {selectedCategories.length}
                  </span>
                )}
              </button>
            </div>
            
            {showFilters && (
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                quantity={inventoryData[product.id]?.quantity || 0}
                shouldOrder={inventoryData[product.id]?.shouldOrder || false}
                onQuantityChange={(quantity) => handleQuantityChange(product.id, quantity)}
                onOrderToggle={(shouldOrder) => handleOrderToggle(product.id, shouldOrder)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your criteria.</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Please enter your name and select a location to begin counting inventory.</p>
        </div>
      )}
    </div>
  );
}

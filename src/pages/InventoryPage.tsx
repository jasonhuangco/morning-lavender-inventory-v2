import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Send, FileText, X } from 'lucide-react';
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
    updateProductQuantity,
    submitOrder,
    loading
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [inventoryData, setInventoryData] = useState<{[key: string]: { quantity: number; shouldOrder: boolean }}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const hasInitialized = useRef(false);

  // Initialize inventory data when products change
  useEffect(() => {
    // Only initialize once when products first load, or when new products are added
    if (!hasInitialized.current && products.length > 0) {
      const initialData: {[key: string]: { quantity: number; shouldOrder: boolean }} = {};
      products.forEach(product => {
        // Default quantity to minimum threshold amount
        const defaultQuantity = product.minimum_threshold || 0;
        initialData[product.id] = {
          quantity: defaultQuantity,
          // For checkbox-only items, default to unchecked. For regular items, since we're starting at threshold, default to unchecked
          shouldOrder: false
        };
      });
      setInventoryData(initialData);
      hasInitialized.current = true;
    }
  }, [products]);

  // Filter products based on search and categories
  const filteredProducts = products.filter(product => {
    // Filter out hidden products from inventory view
    if (product.hidden) {
      return false;
    }

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

    // For checkbox-only items, preserve the current shouldOrder state
    // For regular items, auto-check if below threshold
    const currentShouldOrder = inventoryData[productId]?.shouldOrder || false;
    const shouldOrder = product.checkbox_only ? currentShouldOrder : quantity < product.minimum_threshold;
    
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
    if (!currentLocation) {
      alert('Please select a location before submitting.');
      return;
    }

    if (!userName) {
      alert('User not properly authenticated. Please log in again.');
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
        notes: orderNote.trim() || undefined,
        products: apiInventoryData
      });

      // Reset form after successful submission
      const resetData: {[key: string]: { quantity: number; shouldOrder: boolean }} = {};
      products.forEach(product => {
        const defaultQuantity = product.minimum_threshold || 0;
        resetData[product.id] = {
          quantity: defaultQuantity,
          shouldOrder: false
        };
      });
      setInventoryData(resetData);
      setOrderNote(''); // Clear the note as well
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
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Count</h1>
        
        {currentLocation && userName && (
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || itemsToOrder === 0}
            className="btn btn-primary flex items-center justify-center sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Submitting...' : `Submit Order (${itemsToOrder} items)`}
          </button>
        )}
      </div>

      {/* User Info & Location Selection */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Start Count</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="label">Logged in as</label>
            <div className="input bg-gray-50 text-gray-700 cursor-not-allowed">
              {userName || 'Loading...'}
            </div>
          </div>
          
          <LocationSelector
            locations={locations}
            selectedLocation={currentLocation}
            onLocationChange={setCurrentLocation}
          />
        </div>
        
        {/* Add Note Link */}
        <div className="flex items-center justify-start">
          <button
            onClick={() => setShowNoteModal(true)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <FileText className="h-4 w-4" />
            <span>
              {orderNote ? 'Edit order note' : 'Add order note'}
              {orderNote && <span className="text-xs text-gray-500 ml-1">(added)</span>}
            </span>
          </button>
        </div>
      </div>

      {/* Show products only if location is selected and user is authenticated */}
      {currentLocation && userName ? (
        <>
          {/* Search and Filters */}
          <div className="card space-y-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 max-w-xl">
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
                className="btn btn-secondary flex items-center justify-center sm:w-auto"
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
          <p className="text-gray-500">Please select a location to begin counting inventory.</p>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add Order Note</h2>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Note Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Add any additional notes for this order..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This note will be included with your order for reference.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setOrderNote('');
                    setShowNoteModal(false);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

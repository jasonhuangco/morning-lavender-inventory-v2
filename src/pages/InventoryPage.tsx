import { useState, useEffect, useRef } from 'react';
import { 
  userCanAccessProduct, 
  productMatchesCategories, 
  getPrimarySupplier,
  getProductCategories 
} from '../utils/productHelpers';
import { Search, Filter, Send, FileText, X, Save } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/Inventory/ProductCard';
import LocationSelector from '../components/Inventory/LocationSelector';
import CategoryFilter from '../components/Inventory/CategoryFilter';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

export default function InventoryPage() {
  const { user } = useAuth();
  const {
    products,
    locations,
    categories,
    suppliers,
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [noteModalReturnToReview, setNoteModalReturnToReview] = useState(false);
  const hasInitialized = useRef(false);
  const draftLoadAttempted = useRef<string>(''); // Track location+user combination for draft loading
  const isShowingPrompt = useRef(false); // Prevent multiple prompts at the same time
  
  // Draft functionality state
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [_draftId, setDraftId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [_hasDraftInLocalStorage, setHasDraftInLocalStorage] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Initialize inventory data when products change
  useEffect(() => {
    // Only initialize once when products first load, and only if no draft loading is in progress
    if (!hasInitialized.current && products.length > 0) {
      // Wait a bit to see if we're about to load a draft
      const initTimeout = setTimeout(() => {
        // Double check we haven't been initialized by draft loading
        if (!hasInitialized.current) {
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
      }, 200); // Wait longer than draft loading timeout

      return () => clearTimeout(initTimeout);
    }
  }, [products]);

  // Draft functionality
  const generateDraftKey = () => {
    if (!currentLocation || !userName) return null;
    return `draft_${currentLocation}_${userName}`;
  };

  const saveDraftToLocalStorage = () => {
    const draftKey = generateDraftKey();
    if (!draftKey) return;

    const draftData = {
      inventoryData,
      orderNote,
      location: currentLocation,
      user: userName,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(draftKey, JSON.stringify(draftData));
    setLastSavedAt(new Date());
  };

  const loadDraftFromLocalStorage = () => {
    const draftKey = generateDraftKey();
    if (!draftKey) return null;

    const stored = localStorage.getItem(draftKey);
    if (!stored) return null;

    try {
      const draftData = JSON.parse(stored);
      return draftData;
    } catch (error) {
      console.error('Error loading draft from localStorage:', error);
      return null;
    }
  };

  const saveDraftToDatabase = async () => {
    if (!currentLocation || !userName) {
      alert('Please select a location and ensure you are logged in.');
      return;
    }

    try {
      setIsSavingDraft(true);
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);

      const draftData = {
        inventoryData,
        orderNote,
        location: currentLocation,
        user: userName,
        timestamp: new Date().toISOString()
      };

      // Check if draft already exists for this user/location combination
      const { data: existingDrafts, error: checkError } = await supabase
        .from('draft_orders')
        .select('id')
        .eq('user_name', userName)
        .eq('location_id', currentLocation);

      if (checkError) {
        console.error('Error checking for existing drafts:', checkError);
        throw checkError;
      }

      if (existingDrafts && existingDrafts.length > 0) {
        // Update existing draft
        const { error } = await supabase
          .from('draft_orders')
          .update({
            draft_data: draftData,
            notes: orderNote.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDrafts[0].id);

        if (error) throw error;
        setDraftId(existingDrafts[0].id);
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('draft_orders')
          .insert([{
            user_name: userName,
            location_id: currentLocation,
            draft_data: draftData,
            notes: orderNote.trim() || null
          }])
          .select()
          .single();

        if (error) throw error;
        setDraftId(data.id);
      }

      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      setIsDraftMode(true);
      
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const clearDraftAndReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear the current count and start fresh? This will delete any saved drafts and reset all quantities.'
    );
    
    if (!confirmed) return;

    try {
      // Clear localStorage draft
      const draftKey = generateDraftKey();
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }

      // Clear database draft if it exists
      if (_draftId) {
        const supabase = createClient(config.supabase.url, config.supabase.anonKey);
        await supabase
          .from('draft_orders')
          .delete()
          .eq('id', _draftId);
      }

      // Reset all state to default values
      const resetData: {[key: string]: { quantity: number; shouldOrder: boolean }} = {};
      products.forEach(product => {
        const defaultQuantity = product.minimum_threshold || 0;
        resetData[product.id] = {
          quantity: defaultQuantity,
          shouldOrder: false
        };
      });

      setInventoryData(resetData);
      setOrderNote('');
      setIsDraftMode(false);
      setDraftId(null);
      setHasUnsavedChanges(false);
      setLastSavedAt(null);
      setHasDraftInLocalStorage(false);
      
      // Reset draft loading flags
      draftLoadAttempted.current = '';
      isShowingPrompt.current = false;

    } catch (error) {
      console.error('Error clearing draft:', error);
      alert('Failed to clear draft completely, but local data has been reset.');
      
      // Still reset local state even if database deletion fails
      const resetData: {[key: string]: { quantity: number; shouldOrder: boolean }} = {};
      products.forEach(product => {
        const defaultQuantity = product.minimum_threshold || 0;
        resetData[product.id] = {
          quantity: defaultQuantity,
          shouldOrder: false
        };
      });

      setInventoryData(resetData);
      setOrderNote('');
      setIsDraftMode(false);
      setDraftId(null);
      setHasUnsavedChanges(false);
      setLastSavedAt(null);
      setHasDraftInLocalStorage(false);
      
      // Reset draft loading flags
      draftLoadAttempted.current = '';
      isShowingPrompt.current = false;
    }
  };

  const loadDraftFromDatabase = async () => {
    if (!currentLocation || !userName) return;

    try {
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      const { data: draftData, error } = await supabase
        .from('draft_orders')
        .select('*')
        .eq('user_name', userName)
        .eq('location_id', currentLocation)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading draft:', error);
        return;
      }

      if (draftData && draftData.length > 0) {
        const draft = draftData[0];
        const draftInventoryData = draft.draft_data;
        
        if (draftInventoryData && draftInventoryData.inventoryData) {
          // Prevent multiple prompts
          if (isShowingPrompt.current) {
            return;
          }
          
          isShowingPrompt.current = true;
          
          const confirmed = window.confirm(
            `Found existing draft from ${new Date(draft.updated_at).toLocaleString()}. Load it?`
          );
          
          if (confirmed) {
            setInventoryData(draftInventoryData.inventoryData);
            setOrderNote(draftInventoryData.orderNote || '');
            setDraftId(draft.id);
            setIsDraftMode(true);
            setLastSavedAt(new Date(draft.updated_at));
            setHasUnsavedChanges(true);
            hasInitialized.current = true; // Mark as initialized to prevent default initialization
          }
          
          isShowingPrompt.current = false;
        }
      }
    } catch (error) {
      console.error('Error loading draft from database:', error);
    }
  };

  // Load draft when location/user changes
  useEffect(() => {
    if (currentLocation && userName && products.length > 0) {
      // Create a unique key for this location+user combination
      const draftKey = `${currentLocation}-${userName}`;
      
      // Skip if we've already attempted to load drafts for this combination
      if (draftLoadAttempted.current === draftKey) {
        return;
      }
      
      // Skip if we're already showing a prompt
      if (isShowingPrompt.current) {
        return;
      }
      
      // Mark this combination as attempted IMMEDIATELY to prevent race conditions
      draftLoadAttempted.current = draftKey;
      
      // Use a timeout to ensure React has finished all its re-renders
      setTimeout(() => {
        // Double-check that we still haven't processed this combination
        if (draftLoadAttempted.current !== draftKey) {
          return;
        }
        
        // Check if there's a draft available
        const localDraft = loadDraftFromLocalStorage();
        setHasDraftInLocalStorage(!!localDraft);
        
        // First try localStorage for quick load (more recent)
        if (localDraft && localDraft.inventoryData) {
          // Prevent multiple prompts
          if (isShowingPrompt.current) {
            return;
          }
          
          isShowingPrompt.current = true;
          
          const shouldLoad = window.confirm(
            `Found recent local draft from ${new Date(localDraft.timestamp).toLocaleString()}. Load it?`
          );
          
          if (shouldLoad) {
            setInventoryData(localDraft.inventoryData);
            setOrderNote(localDraft.orderNote || '');
            setHasUnsavedChanges(true);
            hasInitialized.current = true; // Mark as initialized to prevent default initialization
          }
          
          isShowingPrompt.current = false;
          return; // Exit early to prevent database check
        }
        
        // Only check database if no localStorage draft was loaded and we're not showing a prompt
        if (!isShowingPrompt.current) {
          loadDraftFromDatabase();
        }
      }, 100);
    }
  }, [currentLocation, userName, products.length]);

  // Reset draft loading flag when location/user changes
  useEffect(() => {
    if (currentLocation && userName) {
      const newKey = `${currentLocation}-${userName}`;
      if (draftLoadAttempted.current && draftLoadAttempted.current !== newKey) {
        draftLoadAttempted.current = '';
        isShowingPrompt.current = false;
      }
    }
  }, [currentLocation, userName]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!hasInitialized.current || !currentLocation || !userName) return;
    
    const autoSaveInterval = setInterval(() => {
      saveDraftToLocalStorage();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [inventoryData, orderNote, currentLocation, userName]);

  // Track unsaved changes
  useEffect(() => {
    if (hasInitialized.current) {
      setHasUnsavedChanges(true);
    }
  }, [inventoryData, orderNote]);

  // Add beforeunload event listener for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && currentLocation && userName) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, currentLocation, userName]);

  // Filter categories based on user access
  const availableCategories = categories.filter(category => {
    // If user has no restrictions, show all categories
    if (!user || !user.assigned_categories || user.assigned_categories.length === 0) {
      return true;
    }
    // Only show categories user has access to
    return user.assigned_categories.includes(category.id);
  });

  const filteredProducts = products.filter(product => {
    // Filter out hidden products from inventory view
    if (product.hidden) {
      return false;
    }

    // Filter by user's assigned categories (if user has restrictions)
    if (user && user.assigned_categories && user.assigned_categories.length > 0) {
      if (!userCanAccessProduct(product, user.assigned_categories)) {
        return false;
      }
    }

    // Filter by search term
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      if (!productMatchesCategories(product, selectedCategories)) {
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

    // Open review modal instead of submitting directly
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!currentLocation || !userName) return;

    try {
      setIsSubmitting(true);
      setShowReviewModal(false);
      
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                saveDraftToDatabase();
              }}
              disabled={isSavingDraft}
              className="btn btn-secondary flex items-center justify-center sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5 mr-2" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={clearDraftAndReset}
              className="btn bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center sm:w-auto"
            >
              <X className="h-5 w-5 mr-2" />
              Clear Count
            </button>
            
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || itemsToOrder === 0}
              className="btn btn-primary flex items-center justify-center sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5 mr-2" />
              {isSubmitting ? 'Submitting...' : `Submit Order (${itemsToOrder} items)`}
            </button>
          </div>
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
        
        {/* Draft Status */}
        {currentLocation && userName && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            {isDraftMode ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <FileText className="h-4 w-4" />
                <span>Draft Mode</span>
                {lastSavedAt && (
                  <span className="text-gray-500">
                    • Last saved {lastSavedAt.toLocaleTimeString()}
                  </span>
                )}
              </div>
            ) : hasUnsavedChanges ? (
              <div className="flex items-center space-x-2 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Unsaved changes</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Ready to start</span>
              </div>
            )}
          </div>
        )}
        
        {/* Add Note Link */}
        <div className="flex items-center justify-start">
          <button
            onClick={() => {
              setNoteModalReturnToReview(false);
              setShowNoteModal(true);
            }}
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
                categories={availableCategories}
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
                  onClick={() => {
                    setShowNoteModal(false);
                    if (noteModalReturnToReview) {
                      setNoteModalReturnToReview(false);
                      setShowReviewModal(true);
                    }
                  }}
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
                  onClick={() => {
                    setShowNoteModal(false);
                    if (noteModalReturnToReview) {
                      setNoteModalReturnToReview(false);
                      setShowReviewModal(true);
                    }
                  }}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setOrderNote('');
                    setShowNoteModal(false);
                    if (noteModalReturnToReview) {
                      setNoteModalReturnToReview(false);
                      setShowReviewModal(true);
                    }
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

      {/* Order Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Review Order</h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Order Summary */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="ml-2 text-gray-900">
                        {locations.find(l => l.id === currentLocation)?.name || 'Unknown Location'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Submitted by:</span>
                      <span className="ml-2 text-gray-900">{userName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Items to order:</span>
                      <span className="ml-2 text-gray-900">{itemsToOrder}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
                      <span className="ml-2 text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Order Note:</span>
                      <button
                        onClick={() => {
                          setShowReviewModal(false);
                          setNoteModalReturnToReview(true);
                          setShowNoteModal(true);
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {orderNote ? 'Edit Note' : 'Add Note'}
                      </button>
                    </div>
                    {orderNote ? (
                      <p className="text-gray-900 text-sm bg-gray-50 p-2 rounded border">{orderNote}</p>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No note added</p>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 mb-3">Items to Order:</h3>
                  {Object.entries(inventoryData)
                    .filter(([_, data]) => data.shouldOrder)
                    .map(([productId, data]) => {
                      const product = products.find(p => p.id === productId);
                      if (!product) return null;
                      
                      return (
                        <div key={productId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              Current: {data.quantity} {product.unit} | Minimum: {product.minimum_threshold || 0} {product.unit}
                              {(() => {
                                const supplier = getPrimarySupplier(product, suppliers);
                                return supplier ? ` | Supplier: ${supplier.name}` : '';
                              })()}
                              {(() => {
                                // Show all categories if multiple
                                const productCategories = getProductCategories(product, categories);
                                if (productCategories.length > 1) {
                                  const categoryNames = productCategories
                                    .map(cat => cat.name)
                                    .join(', ');
                                  return categoryNames ? ` | Categories: ${categoryNames}` : '';
                                }
                                return '';
                              })()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {product.checkbox_only ? 'Needed' : `Qty: ${data.quantity}`}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

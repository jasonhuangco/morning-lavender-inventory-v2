import { useState, useEffect } from 'react';
import { Clock, MapPin, User, Package, FileText, Trash2 } from 'lucide-react';
import { Order } from '../types';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { getPrimarySupplier, getProductSuppliers, getProductCategories } from '../utils/productHelpers';

// Create Supabase client outside component to avoid multiple instances warning
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export default function OrderHistoryPage() {
  
  const [orders, setOrders] = useState<Order[]>([]);
  // @ts-ignore - Used in transformation logic
  const [categories, setCategories] = useState<any[]>([]);
  // @ts-ignore - Used in transformation logic
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showOnlyNeedsOrdering, setShowOnlyNeedsOrdering] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(false);

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setSelectedSupplier('all'); // Reset filter when opening new order
    setShowOnlyNeedsOrdering(true); // Default to showing only items needing orders
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setSelectedSupplier('all'); // Reset filter when closing modal
    setShowOnlyNeedsOrdering(true); // Reset toggle to default state
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      // Delete the order (order_items will be automatically deleted due to CASCADE)
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
        return;
      }

      // Remove from local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Close modal if the deleted order was selected
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      alert(`Order ${orderNumber} has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  // Get unique locations, months, and years from orders
  const getUniqueLocations = () => {
    return Array.from(new Set(orders.map(order => order.location_name))).sort();
  };

  const getUniqueYears = () => {
    return Array.from(new Set(orders.map(order => new Date(order.created_at).getFullYear()))).sort((a, b) => b - a);
  };

  const getMonths = () => {
    return [
      { value: '0', name: 'January' },
      { value: '1', name: 'February' },
      { value: '2', name: 'March' },
      { value: '3', name: 'April' },
      { value: '4', name: 'May' },
      { value: '5', name: 'June' },
      { value: '6', name: 'July' },
      { value: '7', name: 'August' },
      { value: '8', name: 'September' },
      { value: '9', name: 'October' },
      { value: '10', name: 'November' },
      { value: '11', name: 'December' }
    ];
  };

  // Filter orders based on selected filters
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const orderMonth = orderDate.getMonth();
    const orderYear = orderDate.getFullYear();

    const locationMatch = selectedLocation === 'all' || order.location_name === selectedLocation;
    const monthMatch = selectedMonth === 'all' || orderMonth === parseInt(selectedMonth);
    const yearMatch = selectedYear === 'all' || orderYear === parseInt(selectedYear);
    const statusMatch = !hideCompleted || order.status !== 'completed';

    return locationMatch && monthMatch && yearMatch && statusMatch;
  });

  useEffect(() => {
    loadOrders();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Orders loaded:', orders.length);
  }, [orders]);

  useEffect(() => {
    if (selectedOrder) {
      console.log('Selected order:', selectedOrder.status, selectedOrder.items?.length, 'items');
    }
  }, [selectedOrder]);

  const toggleItemOrdered = async (orderId: string, productId: string) => {
    try {
      // Find the current item from the selectedOrder (more reliable than orders array)
      if (!selectedOrder || selectedOrder.id !== orderId) {
        console.error('Selected order does not match the order being toggled');
        return;
      }
      
      const currentItem = selectedOrder.items.find(item => item.product_id === productId);
      
      if (!currentItem) {
        console.error('Item not found in selected order');
        return;
      }

      const newOrderedStatus = !currentItem.ordered_status;
      
      // Get current user from localStorage (matching the format used elsewhere in the app)
      const currentUser = JSON.parse(localStorage.getItem('inventory_user') || '{}');
      const userName = currentUser.first_name && currentUser.last_name 
        ? `${currentUser.first_name} ${currentUser.last_name}`
        : 'Unknown User';
      
      // Update database (only if not using mock data)
      if (selectedOrder && selectedOrder.id !== '1') { // '1' is our mock order ID
        const { error } = await supabase
          .from('order_items')
          .update({
            ordered_status: newOrderedStatus,
            ordered_by: newOrderedStatus ? userName : null,
            ordered_at: newOrderedStatus ? new Date().toISOString() : null
          })
          .eq('order_id', orderId)
          .eq('product_id', productId);

        if (error) {
          console.error('Error updating ordered status:', error);
          return;
        }
        
        console.log('Database updated successfully');
      } else {
        console.log('Using mock data, skipping database update');
      }

      // Update selectedOrder immediately since we're working with it
      const updatedOrder = {
        ...selectedOrder,
        items: selectedOrder.items.map(item =>
          item.product_id === productId
            ? {
                ...item,
                ordered_status: newOrderedStatus,
                ordered_by: newOrderedStatus ? userName : undefined,
                ordered_at: newOrderedStatus ? new Date().toISOString() : undefined
              }
            : item
        )
      };
      
      setSelectedOrder(updatedOrder);
      
      // Also update the orders array for consistency
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? updatedOrder
            : order
        )
      );

      // Check and update order status automatically
      await checkAndUpdateOrderStatus(updatedOrder);
    } catch (error) {
      console.error('Error toggling item ordered status:', error);
    }
  };

  const checkAndUpdateOrderStatus = async (order: Order) => {
    if (!order.items) {
      console.log('No items found in order for status check');
      return;
    }
    
    // Only count items that actually need ordering
    const itemsThatNeedOrdering = order.items.filter(item => item.needs_ordering);
    const orderedItemsCount = itemsThatNeedOrdering.filter(item => item.ordered_status).length;
    const totalItemsNeedingOrdering = itemsThatNeedOrdering.length;
    
    // If we have any ordered items, set to draft (if currently pending)
    if (orderedItemsCount > 0 && order.status === 'pending') {
      console.log('Updating status to draft (in progress)');
      await updateOrderStatus(order.id, 'draft', order);
    }
    
    // If all items that need ordering are ordered, set to completed
    else if (orderedItemsCount === totalItemsNeedingOrdering && totalItemsNeedingOrdering > 0 && order.status !== 'completed') {
      console.log('Updating status to completed');
      await updateOrderStatus(order.id, 'completed', order);
    }
    
    // If no items are ordered, go back to pending
    else if (orderedItemsCount === 0 && order.status !== 'pending') {
      console.log('Updating status back to pending');
      await updateOrderStatus(order.id, 'pending', order);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'draft' | 'pending' | 'completed', preserveItems?: Order) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      
      // Update order status in database (only if not using mock data)
      if (orderId !== '1') { // '1' is our mock order ID
        // First, check if the order exists
        const { data: existingOrder, error: fetchError } = await supabase
          .from('orders')
          .select('id, status, order_number')
          .eq('id', orderId)
          .single();

        if (fetchError) {
          console.error('Error fetching order for status update:', fetchError);
          console.error('Order ID that failed:', orderId);
          return;
        }

        if (!existingOrder) {
          console.error('Order not found in database:', orderId);
          return;
        }

        console.log(`Found existing order: ${existingOrder.order_number}, current status: ${existingOrder.status}`);

        // Update the order status
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) {
          console.error('Error updating order status:', error);
          console.error('Attempted to set status to:', newStatus);
          console.error('Order ID:', orderId);
          console.error('Current status was:', existingOrder.status);
          return;
        }

        console.log(`Database updated successfully for order ${orderId}`);
      } else {
        console.log('Using mock data, skipping database update');
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...(preserveItems || order), 
              status: newStatus, 
              updated_at: new Date().toISOString() 
            }
          : order
      ));

      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        console.log(`Updating selectedOrder status to ${newStatus}`);
        const orderToUpdate = preserveItems || selectedOrder;
        setSelectedOrder({
          ...orderToUpdate,
          status: newStatus,
          updated_at: new Date().toISOString()
        });
      }

      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading orders from database...');
      
      // Load categories and suppliers for helper functions
      const [categoriesResult, suppliersResult] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('suppliers').select('*')
      ]);
      
      const categoriesData = categoriesResult.data || [];
      const suppliersData = suppliersResult.data || [];
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      
      // Fetch orders with related data
      const { data: ordersData, error } = await supabase
        .from('orders')
        // Query with many-to-many relationships
        .select(`
          *,
          locations(name),
          order_items(
            *,
            products(
              name,
              minimum_threshold,
              checkbox_only,
              category_id,
              supplier_id,
              product_categories(
                category_id,
                is_primary,
                categories(name)
              ),
              product_suppliers(
                supplier_id,
                is_primary,
                cost_override,
                suppliers(name)
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading orders:', error);
        throw error;
      }

      console.log('✅ Orders loaded from database:', ordersData?.length || 0);
      
      // Debug: Check what order_items data looks like
      if (ordersData && ordersData.length > 0) {
        const firstOrder = ordersData[0];
        const orderedItems = firstOrder.order_items?.filter((item: any) => item.ordered_status === true) || [];
        console.log(`🔍 Raw DB data - First order has ${orderedItems.length} ordered items out of ${firstOrder.order_items?.length || 0} total`);
        if (orderedItems.length > 0) {
          console.log('🔍 Sample ordered item from DB:', {
            product_id: orderedItems[0].product_id,
            ordered_status: orderedItems[0].ordered_status,
            ordered_by: orderedItems[0].ordered_by
          });
        }
      }

      // Transform the data to match our Order interface
      // For each product with multiple suppliers, create separate line items
      const transformedOrders = (ordersData || []).map((order: any) => {
        // Extract user name from user_name field or fall back to parsing notes
        let userName = order.user_name;
        if (!userName && order.notes) {
          const match = order.notes.match(/Order submitted by (.+?)(\n|$)/);
          userName = match ? match[1] : 'Unknown User';
        }
        if (!userName) {
          userName = 'Unknown User';
        }

        return {
          id: order.id,
          order_number: order.order_number,
          location_id: order.location_id,
          location_name: order.locations?.name || 'Unknown Location',
          user_name: userName,
          status: order.status,
          created_at: order.created_at,
          updated_at: order.updated_at || order.created_at,
          order_date: order.order_date,
          notes: order.notes,
        items: (order.order_items || []).flatMap((item: any) => {
          // Log raw item data for debugging
          if (item.ordered_status) {
            console.log(`🔍 Loading ordered item from DB: ${item.product_id} = ${item.ordered_status}`);
          }
          
          const product = item.products;
          if (!product) {
            // Return single item if no product data
            return [{
              product_id: item.product_id,
              product_name: 'Unknown Product',
              quantity_ordered: item.quantity || 0,
              current_quantity: item.quantity || 0,
              minimum_threshold: 0,
              checkbox_only: false,
              unit: '',
              supplier_name: 'Unknown Supplier',
              category_names: [],
              needs_ordering: item.needs_ordering || false,
              ordered_status: item.ordered_status || false,
              ordered_by: item.ordered_by || undefined,
              ordered_at: item.ordered_at || undefined
            }];
          }

          // Get all suppliers for this product
          const productSuppliers = getProductSuppliers(product, suppliersData);
          const productCategories = getProductCategories(product, categoriesData);
          
          // If product has multiple suppliers, create an entry for each
          if (productSuppliers.length > 1) {
            return productSuppliers.map(supRel => ({
              product_id: item.product_id,
              product_name: product.name || 'Unknown Product',
              quantity_ordered: item.quantity || 0,
              current_quantity: item.quantity || 0,
              minimum_threshold: product.minimum_threshold || 0,
              checkbox_only: product.checkbox_only || false,
              unit: product.unit || '',
              supplier_name: supRel.supplier.name,
              supplier_is_primary: supRel.is_primary,
              supplier_cost_override: supRel.cost_override,
              category_names: productCategories.map(cat => cat.name),
              needs_ordering: item.needs_ordering || false,
              ordered_status: item.ordered_status || false,
              ordered_by: item.ordered_by || undefined,
              ordered_at: item.ordered_at || undefined
            }));
          } else {
            // Single supplier or fallback to primary
            const primarySupplier = getPrimarySupplier(product, suppliersData);
            return [{
              product_id: item.product_id,
              product_name: product.name || 'Unknown Product',
              quantity_ordered: item.quantity || 0,
              current_quantity: item.quantity || 0,
              minimum_threshold: product.minimum_threshold || 0,
              checkbox_only: product.checkbox_only || false,
              unit: product.unit || '',
              supplier_name: primarySupplier?.name || 'Unknown Supplier',
              supplier_is_primary: true,
              category_names: productCategories.map(cat => cat.name),
              needs_ordering: item.needs_ordering || false,
              ordered_status: item.ordered_status || false,
              ordered_by: item.ordered_by || undefined,
              ordered_at: item.ordered_at || undefined
            }];
          }
        })
      };
      });

      setOrders(transformedOrders);
      
      // Update selectedOrder if it exists and needs to be synced with the reloaded data
      if (selectedOrder) {
        const updatedSelectedOrder = transformedOrders.find(order => order.id === selectedOrder.id);
        if (updatedSelectedOrder) {
          console.log(`🔄 Syncing selectedOrder with reloaded data: ${updatedSelectedOrder.status}`);
          setSelectedOrder(updatedSelectedOrder);
        }
      }
      
      console.log(`Orders loaded from database: ${transformedOrders.length}`);
      
      // Log sample order items to debug checkbox state
      if (transformedOrders.length > 0) {
        const sampleOrder = transformedOrders[0];
        const orderedItems = sampleOrder.items.filter((item: any) => item.ordered_status === true);
        console.log(`Sample order ${sampleOrder.id}: ${orderedItems.length} ordered items out of ${sampleOrder.items.length} total`);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      console.log('Falling back to mock data...');
      
      // Fall back to mock data if database fails
      const mockOrders: Order[] = [
        {
          id: '1',
          user_name: 'Demo User',
          location_id: '1',
          location_name: 'Downtown Café',
          items: [
            {
              product_id: '1',
              product_name: 'Colombian Coffee Beans',
              quantity_ordered: 15,
              current_quantity: 5,
              minimum_threshold: 10,
              checkbox_only: false,
              unit: 'lbs',
              supplier_name: 'Costco',
              category_names: ['Coffee'],
              needs_ordering: true, // Below threshold, needs ordering
              ordered_status: false,
              ordered_by: undefined,
              ordered_at: undefined
            },
            {
              product_id: '2',
              product_name: 'Paper Cups',
              quantity_ordered: 250,
              current_quantity: 250,
              minimum_threshold: 100,
              checkbox_only: false,
              unit: 'units',
              supplier_name: 'Restaurant Supply Co',
              category_names: ['Supplies'],
              needs_ordering: false, // Above threshold, just counted
              ordered_status: false,
              ordered_by: undefined,
              ordered_at: undefined
            },
            {
              product_id: '3',
              product_name: 'Cleaning Supplies',
              quantity_ordered: 5,
              current_quantity: 0,
              minimum_threshold: 1,
              checkbox_only: true,
              unit: 'units',
              supplier_name: 'Costco',
              category_names: ['Cleaning'],
              needs_ordering: true, // Checkbox item, needs ordering
              ordered_status: false,
              ordered_by: undefined,
              ordered_at: undefined
            },
            {
              product_id: '4',
              product_name: 'Vanilla Syrup',
              quantity_ordered: 8,
              current_quantity: 8,
              minimum_threshold: 3,
              checkbox_only: false,
              unit: 'bottles',
              supplier_name: 'Beverage Distributor',
              category_names: ['Beverages'],
              needs_ordering: false, // Above threshold, just counted
              ordered_status: false,
              ordered_by: undefined,
              ordered_at: undefined
            }
          ],
          status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      setOrders(mockOrders);
      console.log('✅ Mock data loaded:', mockOrders.length, 'orders');
      console.log('🧪 First order status:', mockOrders[0]?.status);
      console.log('🧪 First order items:', mockOrders[0]?.items.map(i => ({ id: i.product_id, ordered_status: i.ordered_status })));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'draft':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          
          <div className="text-sm text-gray-600">
            {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              {getUniqueLocations().map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Months</option>
              {getMonths().map(month => (
                <option key={month.value} value={month.value}>{month.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedLocation('all');
                setSelectedMonth('all');
                setSelectedYear('all');
                setHideCompleted(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Hide Completed Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hideCompleted"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="hideCompleted" className="text-sm font-medium text-gray-700 cursor-pointer">
            Hide completed orders
          </label>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div
            key={order.id}
            className="card hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleOrderSelect(order)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                {/* Order Header */}
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(order.created_at)}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{order.user_name}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{order.location_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening the modal
                    handleDeleteOrder(order.id, `#${order.id.slice(-8)}`);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Delete order"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && orders.length > 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders match the selected filters.</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters to see more results.</p>
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders found.</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here after they are submitted.</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Order Details</h2>
                <button
                  onClick={() => handleCloseModal()}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>

              {/* Order Info */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as 'pending' | 'draft' | 'completed';
                        updateOrderStatus(selectedOrder.id, newStatus);
                      }}
                      className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-none bg-transparent focus:ring-2 focus:ring-primary-500"
                      style={{
                        backgroundColor: getStatusColor(selectedOrder.status).includes('green') ? '#F0FDF4' :
                                       getStatusColor(selectedOrder.status).includes('yellow') ? '#FEFCE8' :
                                       getStatusColor(selectedOrder.status).includes('blue') ? '#EFF6FF' : '#F9FAFB',
                        color: getStatusColor(selectedOrder.status).includes('green') ? '#166534' :
                               getStatusColor(selectedOrder.status).includes('yellow') ? '#A16207' :
                               getStatusColor(selectedOrder.status).includes('blue') ? '#1E40AF' : '#374151'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="draft">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">User:</span>
                    <span className="ml-2">{selectedOrder.user_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2">{selectedOrder.location_name}</span>
                  </div>
                </div>
                
                {/* Order Notes */}
                {selectedOrder.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700">Order Notes:</span>
                      <div className="text-gray-900 text-sm bg-gray-50 p-3 rounded-md border">
                        {selectedOrder.notes}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">Inventory Count Details</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      {(() => {
                        // Calculate counts for actually counted items only
                        const countedItems = selectedOrder.items.filter(item => !item.checkbox_only || item.needs_ordering);
                        const needsOrderingCount = countedItems.filter(item => item.needs_ordering).length;
                        const adequateStockCount = countedItems.filter(item => !item.needs_ordering).length;
                        
                        return (
                          <>
                            <span>{countedItems.length} items counted</span>
                            <span className="text-red-600">{needsOrderingCount} need ordering</span>
                            <span className="text-green-600">{adequateStockCount} adequate stock</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Order Progress and Clear Button */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const countedItems = selectedOrder.items.filter(item => !item.checkbox_only || item.needs_ordering);
                        const orderedCount = countedItems.filter((item) => item.ordered_status).length;
                        return `${orderedCount} of ${countedItems.length} ordered`;
                      })()}
                    </div>
                    <button
                      onClick={async () => {
                        // Clear all ordered status for this order
                        try {
                          const { error } = await supabase
                            .from('order_items')
                            .update({
                              ordered_status: false,
                              ordered_by: null,
                              ordered_at: null
                            })
                            .eq('order_id', selectedOrder.id);

                          if (error) {
                            console.error('Error clearing ordered status:', error);
                            return;
                          }

                          // Update local state
                          setOrders(prevOrders => 
                            prevOrders.map(order => 
                              order.id === selectedOrder.id 
                                ? {
                                    ...order,
                                    items: order.items.map(item => ({
                                      ...item,
                                      ordered_status: false,
                                      ordered_by: undefined,
                                      ordered_at: undefined
                                    }))
                                  }
                                : order
                            )
                          );

                          // Update selectedOrder
                          setSelectedOrder(prev => 
                            prev ? {
                              ...prev,
                              items: prev.items.map(item => ({
                                ...item,
                                ordered_status: false,
                                ordered_by: undefined,
                                ordered_at: undefined
                              }))
                            } : null
                          );
                        } catch (error) {
                          console.error('Error clearing ordered status:', error);
                        }
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Filter by supplier:</label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Suppliers</option>
                      {Array.from(new Set(
                        selectedOrder.items
                          .filter(item => !item.checkbox_only || item.needs_ordering) // Only actually counted items
                          .map(item => item.supplier_name)
                      )).map(supplier => (
                        <option key={supplier} value={supplier}>{supplier}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Toggle for showing only items that need ordering */}
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={showOnlyNeedsOrdering}
                        onChange={(e) => setShowOnlyNeedsOrdering(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span>Show only items needing orders</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {selectedOrder.items
                    .filter(item => {
                      // Filter by supplier
                      const supplierMatch = selectedSupplier === 'all' || item.supplier_name === selectedSupplier;
                      
                      // Only show items that were actually counted:
                      // 1. Non-checkbox items that have a counted quantity > 0
                      // 2. Checkbox-only items that were checked (needs_ordering = true)
                      const wasActuallyCounted = !item.checkbox_only || item.needs_ordering;
                      
                      // Apply needs ordering filter if toggle is on
                      const needsOrderingMatch = !showOnlyNeedsOrdering || item.needs_ordering;
                      
                      return supplierMatch && wasActuallyCounted && needsOrderingMatch;
                    })
                    .map((item) => {
                    // For checkbox-only items, don't calculate difference since counted quantity doesn't apply
                    const difference = item.checkbox_only ? 0 : item.minimum_threshold - item.quantity_ordered;
                    const isOrdered = Boolean(item.ordered_status);
                    
                    return (
                      <div key={`${item.product_id}-${item.supplier_name}-${isOrdered}`} className={`border border-gray-200 rounded-lg p-3 transition-all ${isOrdered ? 'bg-green-50 opacity-80' : 'bg-white'}`}>
                        <div className="flex items-start">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 mr-3 mt-1">
                            <input
                              type="checkbox"
                              checked={isOrdered}
                              onChange={() => {
                                toggleItemOrdered(selectedOrder.id, item.product_id);
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                              title={isOrdered ? `Ordered by ${item.ordered_by} at ${item.ordered_at ? new Date(item.ordered_at).toLocaleString() : 'unknown time'}` : 'Mark as ordered'}
                            />
                          </div>
                          
                          {/* Item Content */}
                          <div className="flex justify-between items-start flex-1">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${isOrdered ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {item.product_name}
                                </h4>
                                {item.needs_ordering ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Needs Order
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Counted
                                  </span>
                                )}
                                {isOrdered && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Ordered
                                  </span>
                                )}
                              </div>
                              <div className={`text-sm mt-1 ${isOrdered ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p>Supplier: {item.supplier_name}</p>
                                <p>Categories: {item.category_names.join(', ')}</p>
                                {item.checkbox_only ? (
                                  <p>Minimum: {item.minimum_threshold} {item.unit}</p>
                                ) : (
                                  <p>Counted: {item.quantity_ordered} {item.unit} | Minimum: {item.minimum_threshold} {item.unit}</p>
                                )}
                                {isOrdered && item.ordered_by && (
                                  <p className="text-xs text-blue-600">
                                    Ordered by {item.ordered_by} on {item.ordered_at ? new Date(item.ordered_at).toLocaleDateString() : 'unknown date'}
                                  </p>
                                )}
                              </div>
                            </div>
                            {!item.checkbox_only && (
                              <div className="flex flex-col items-end ml-4">
                                <div className={`font-semibold ${isOrdered ? 'text-gray-400' : difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                  {difference > 0 ? `Need ${difference}` : difference < 0 ? `Over by ${Math.abs(difference)}` : '0'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleCloseModal()}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Location, Category, Supplier, InventoryCount, User } from '../types';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { emailService } from '../services/email';
import { useAuth } from './AuthContext';

interface InventoryContextType {
  products: Product[];
  locations: Location[];
  categories: Category[];
  suppliers: Supplier[];
  users: User[];
  currentLocation: string | null;
  userName: string | null;
  loading: boolean;
  
  // Actions
  setCurrentLocation: (locationId: string | null) => void;
  setUserName: (name: string) => void;
  updateProductQuantity: (productId: string, quantity: number) => void;
  toggleProductOrder: (productId: string, shouldOrder: boolean) => void;
  submitOrder: (inventoryCount: InventoryCount) => Promise<void>;
  
  // Data management
  loadData: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  reorderProducts: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  bulkSortProducts: (sortedProducts: Product[]) => Promise<void>;
  
  addLocation: (location: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => Promise<void>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  reorderLocations: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  reorderSuppliers: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  
  addUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  generateLoginCode: () => Promise<string>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

interface InventoryProviderProps {
  children: ReactNode;
}

export function InventoryProvider({ children }: InventoryProviderProps) {
  const { user, getUserDisplayName } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-set userName when user changes
  useEffect(() => {
    if (user) {
      const displayName = getUserDisplayName();
      setUserName(displayName);
    } else {
      setUserName(null);
    }
  }, [user, getUserDisplayName]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Initialize Supabase client
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      console.log('🔄 Loading data from Supabase...');
      
      // Load all data in parallel
      const [locationsResult, categoriesResult, suppliersResult, productsResult, usersResult] = await Promise.all([
        supabase.from('locations').select('*').order('sort_order'),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('suppliers').select('*').order('sort_order'),
        supabase
          .from('products')
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, contact_info)
          `)
          .order('sort_order'),
        supabase.from('users').select('*').order('created_at', { ascending: false })
      ]);

      // Check for errors
      if (locationsResult.error) {
        console.error('Error loading locations:', locationsResult.error);
        throw locationsResult.error;
      }
      if (categoriesResult.error) {
        console.error('Error loading categories:', categoriesResult.error);
        throw categoriesResult.error;
      }
      if (suppliersResult.error) {
        console.error('Error loading suppliers:', suppliersResult.error);
        throw suppliersResult.error;
      }
      if (productsResult.error) {
        console.error('Error loading products:', productsResult.error);
        throw productsResult.error;
      }
      if (usersResult.error) {
        console.error('Error loading users:', usersResult.error);
        throw usersResult.error;
      }

      // Transform and set data
      const locations = locationsResult.data || [];
      const categories = categoriesResult.data || [];
      const suppliers = suppliersResult.data || [];
      const users = usersResult.data || [];
      const products = (productsResult.data || []).map((product: any) => ({
        ...product,
        current_quantity: 0, // Default - will be updated from inventory counts
        is_checkbox_only: product.checkbox_only, // Map database field name
        hidden: product.hidden || false // Ensure hidden field is preserved
      }));

      console.log('✅ Data loaded successfully:', {
        locations: locations.length,
        categories: categories.length,
        suppliers: suppliers.length,
        products: products.length,
        users: users.length
      });

      setLocations(locations);
      setCategories(categories);
      setSuppliers(suppliers);
      setProducts(products);
      setUsers(users);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      
      // Fall back to empty arrays instead of mock data
      setLocations([]);
      setCategories([]);
      setSuppliers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, current_quantity: quantity }
        : product
    ));
  };

  const toggleProductOrder = (productId: string, shouldOrder: boolean) => {
    // This would typically update a separate order state
    // For now, we'll just log it
    console.log(`Product ${productId} order status: ${shouldOrder}`);
  };

  const submitOrder = async (inventoryCount: InventoryCount) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      console.log('Submitting order:', inventoryCount);
      
      // Find location name
      const location = locations.find(l => l.id === inventoryCount.location_id);
      if (!location) {
        throw new Error('Location not found');
      }

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}`;
      
      // Prepare items that need ordering
      const itemsToOrder = Object.entries(inventoryCount.products)
        .filter(([_, data]) => data.should_order)
        .map(([productId, data]) => {
          const product = products.find(p => p.id === productId);
          const supplier = suppliers.find(s => s.id === product?.supplier_id);
          const category = categories.find(c => c.id === product?.category_id);
          
          return {
            product_id: productId,
            product_name: product?.name || '',
            current_quantity: data.quantity,
            minimum_threshold: product?.minimum_threshold || 0,
            supplier_name: supplier?.name || '',
            category_names: category ? [category.name] : []
          };
        });

      if (itemsToOrder.length === 0) {
        alert('No items need to be ordered.');
        return;
      }

      // Create main order record
      const orderNotes = inventoryCount.notes 
        ? `Order submitted by ${inventoryCount.user_name}\n\nNote: ${inventoryCount.notes}`
        : `Order submitted by ${inventoryCount.user_name}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          location_id: inventoryCount.location_id,
          status: 'pending',
          notes: orderNotes,
          order_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Create order items - store the actual counted quantity
      const orderItems = itemsToOrder.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.current_quantity // actual counted quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }

      // Send email notification
      try {
        await emailService.sendOrderEmail(inventoryCount, products, locations, categories, suppliers);
        console.log('✅ Email sent successfully');
      } catch (emailError) {
        console.error('❌ Email failed (order still saved):', emailError);
      }

      alert(`Order submitted successfully! Order #${orderNumber}`);
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  };

  // Placeholder functions for CRUD operations
  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // Get the highest sort_order value
      const maxSortOrder = products.length > 0 ? Math.max(...products.map(p => p.sort_order)) : -1;
      
      const productWithSort = {
        ...product,
        sort_order: maxSortOrder + 1
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productWithSort])
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        throw error;
      }

      // Add to local state with mapped field
      const newProduct = {
        ...data,
        is_checkbox_only: data.checkbox_only,
        hidden: data.hidden || false
      };
      setProducts(prev => [...prev, newProduct]);
      
      console.log('✅ Product added successfully:', data);
    } catch (error) {
      console.error('❌ Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // Map is_checkbox_only back to checkbox_only for database
      const dbUpdates = { ...updates };
      if ('is_checkbox_only' in dbUpdates) {
        (dbUpdates as any).checkbox_only = dbUpdates.is_checkbox_only;
        delete (dbUpdates as any).is_checkbox_only;
      }

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }

      // Update local state
      const updatedProduct = {
        ...data,
        is_checkbox_only: data.checkbox_only,
        hidden: data.hidden || false
      };
      setProducts(prev => prev.map(product => 
        product.id === id ? updatedProduct : product
      ));
      
      console.log('✅ Product updated successfully:', data);
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }

      // Remove from local state
      setProducts(prev => prev.filter(product => product.id !== id));
      
      console.log('✅ Product deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete product:', error);
      throw error;
    }
  };

  const addLocation = async (location: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // Get the highest sort_order value
      const maxSortOrder = locations.length > 0 ? Math.max(...locations.map(l => l.sort_order)) : -1;
      
      const locationWithSort = {
        ...location,
        sort_order: maxSortOrder + 1
      };

      const { data, error } = await supabase
        .from('locations')
        .insert([locationWithSort])
        .select()
        .single();

      if (error) {
        console.error('Error adding location:', error);
        throw error;
      }

      // Add to local state
      setLocations(prev => [...prev, data]);
      
      console.log('✅ Location added successfully:', data);
    } catch (error) {
      console.error('❌ Failed to add location:', error);
      throw error;
    }
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }

      // Update local state
      setLocations(prev => prev.map(location => 
        location.id === id ? data : location
      ));
      
      console.log('✅ Location updated successfully:', data);
    } catch (error) {
      console.error('❌ Failed to update location:', error);
      throw error;
    }
  };

  const deleteLocation = async (id: string) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting location:', error);
        throw error;
      }

      // Remove from local state
      setLocations(prev => prev.filter(location => location.id !== id));
      
      console.log('✅ Location deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete location:', error);
      throw error;
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // Get the highest sort_order value
      const maxSortOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : -1;
      
      const categoryWithSort = {
        ...category,
        sort_order: maxSortOrder + 1
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryWithSort])
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        throw error;
      }

      // Add to local state
      setCategories(prev => [...prev, data]);
      
      console.log('✅ Category added successfully:', data);
    } catch (error) {
      console.error('❌ Failed to add category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      // Update local state
      setCategories(prev => prev.map(category => 
        category.id === id ? data : category
      ));
      
      console.log('✅ Category updated successfully:', data);
    } catch (error) {
      console.error('❌ Failed to update category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      // Remove from local state
      setCategories(prev => prev.filter(category => category.id !== id));
      
      console.log('✅ Category deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete category:', error);
      throw error;
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // Get the highest sort_order value
      const maxSortOrder = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.sort_order)) : -1;
      
      const supplierWithSort = {
        ...supplier,
        sort_order: maxSortOrder + 1
      };

      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierWithSort])
        .select()
        .single();

      if (error) {
        console.error('Error adding supplier:', error);
        throw error;
      }

      // Add to local state
      setSuppliers(prev => [...prev, data]);
      
      console.log('✅ Supplier added successfully:', data);
    } catch (error) {
      console.error('❌ Failed to add supplier:', error);
      throw error;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating supplier:', error);
        throw error;
      }

      // Update local state
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === id ? data : supplier
      ));
      
      console.log('✅ Supplier updated successfully:', data);
    } catch (error) {
      console.error('❌ Failed to update supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting supplier:', error);
        throw error;
      }

      // Remove from local state
      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      
      console.log('✅ Supplier deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete supplier:', error);
      throw error;
    }
  };

  // Reordering functions
  const reorderItems = async (
    items: any[], 
    setItems: (items: any[]) => void, 
    tableName: string, 
    sourceIndex: number, 
    destinationIndex: number
  ) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // Create a copy of the array
      const newItems = Array.from(items);
      const [reorderedItem] = newItems.splice(sourceIndex, 1);
      newItems.splice(destinationIndex, 0, reorderedItem);

      // Update local state immediately for smooth UX
      setItems(newItems);

      // Update sort_order values in database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index
      }));

      // Batch update all items
      for (const update of updates) {
        const { error } = await supabase
          .from(tableName)
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating ${tableName} sort order:`, error);
          throw error;
        }
      }

      console.log(`✅ ${tableName} reordered successfully`);
    } catch (error) {
      console.error(`❌ Failed to reorder ${tableName}:`, error);
      // Reload data to revert changes on error
      await loadData();
      throw error;
    }
  };

  const reorderProducts = async (sourceIndex: number, destinationIndex: number) => {
    await reorderItems(products, setProducts, 'products', sourceIndex, destinationIndex);
  };

  const bulkSortProducts = async (sortedProducts: Product[]) => {
    try {
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      // Create updates for each product with new sort_order
      const updates = sortedProducts.map((product, index) => ({
        id: product.id,
        sort_order: index
      }));

      // Update all products in a single transaction
      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) {
          throw error;
        }
      }

      // Update local state with new order
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error bulk sorting products:', error);
      throw error;
    }
  };

  const reorderLocations = async (sourceIndex: number, destinationIndex: number) => {
    await reorderItems(locations, setLocations, 'locations', sourceIndex, destinationIndex);
  };

  const reorderCategories = async (sourceIndex: number, destinationIndex: number) => {
    await reorderItems(categories, setCategories, 'categories', sourceIndex, destinationIndex);
  };

  const reorderSuppliers = async (sourceIndex: number, destinationIndex: number) => {
    await reorderItems(suppliers, setSuppliers, 'suppliers', sourceIndex, destinationIndex);
  };

  // User management functions
  const addUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    
    setUsers(prev => [...prev, data]);
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setUsers(prev => prev.map(existingUser => existingUser.id === id ? data : existingUser));
  };

  const deleteUser = async (id: string) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const generateLoginCode = async (): Promise<string> => {
    // Generate a random 6-digit code
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (users.some(user => user.login_code === code));
    
    return code;
  };

  const value = {
    products,
    locations,
    categories,
    suppliers,
    users,
    currentLocation,
    userName,
    loading,
    
    setCurrentLocation,
    setUserName,
    updateProductQuantity,
    toggleProductOrder,
    submitOrder,
    
    loadData,
    addProduct,
    updateProduct,
    deleteProduct,
    reorderProducts,
    bulkSortProducts,
    
    addLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
    
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    
    addSupplier,
    updateSupplier,
    deleteSupplier,
    reorderSuppliers,
    
    addUser,
    updateUser,
    deleteUser,
    generateLoginCode
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Location, Category, Supplier, InventoryCount, User } from '../types';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { emailService } from '../services/email';
import { supabaseService } from '../services/supabase';
import { useAuth } from './AuthContext';
import { getRoleForCode } from '../constants/roles';
import { getPrimarySupplier, getProductSuppliers, getProductCategories } from '../utils/productHelpers';

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
      console.log('🚀 Starting data load...');
      
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      if (!supabase) {
        console.error('❌ No Supabase client available');
        throw new Error('Database not configured');
      }
      
      console.log('🔄 Loading data from Supabase...');
      
      // Load all data using the service layer
      const [locationsResult, categoriesResult, suppliersResult, productsResult, usersResult] = await Promise.all([
        supabase.from('locations').select('*').order('sort_order'),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('suppliers').select('*').order('sort_order'),
        // Use service layer for products to handle the new structure
        supabaseService.getProducts().then((data: any) => ({ data, error: null })).catch((error: any) => ({ data: null, error })),
        supabase.from('users').select('*').order('created_at', { ascending: false })
      ]);

      console.log('📊 Raw results:', {
        locations: { count: locationsResult?.data?.length || 0, error: locationsResult.error },
        categories: { count: categoriesResult?.data?.length || 0, error: categoriesResult.error },
        suppliers: { count: suppliersResult?.data?.length || 0, error: suppliersResult.error },
        products: { count: productsResult?.data?.length || 0, error: productsResult.error },
        users: { count: usersResult?.data?.length || 0, error: usersResult.error }
      });      // Check for errors
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
      
      // Process users and ensure they have roles
      const users = (usersResult.data || []).map((user: any) => ({
        ...user,
        role: user.role || getRoleForCode(user.login_code)
      }));
      
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
      
      // Fall back to empty arrays for most data, but provide mock users for user management
      setLocations([]);
      setCategories([]);
      setSuppliers([]);
      setProducts([]);
      
      // Set mock users so user management works even when database is unavailable
      const mockUsers = [
        {
          id: '2',
          first_name: 'Manager',
          last_name: 'Admin',
          login_code: '622366',
          email: 'admin2@morninglavender.com',
          role: 'admin' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          first_name: 'Super',
          last_name: 'Admin',
          login_code: '054673',
          email: 'admin3@morninglavender.com',
          role: 'admin' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          first_name: 'Staff',
          last_name: 'Member',
          login_code: '222222',
          email: 'staff@morninglavender.com',
          role: 'staff' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setUsers(mockUsers);
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
      
      // Prepare ONLY actually counted items (for complete inventory record)
      // This includes:
      // 1. Non-checkbox items that were counted (quantity > 0)
      // 2. Checkbox-only items that were checked (should_order = true)
      const allCountedItems = Object.entries(inventoryCount.products)
        .map(([productId, data]) => {
          const product = products.find(p => p.id === productId);
          if (!product) return null;

          // Use helper functions to get suppliers and categories
          const productSuppliers = getProductSuppliers(product, suppliers);
          const productCategories = getProductCategories(product, categories);
          const primarySupplier = getPrimarySupplier(product, suppliers);
          
          return {
            product_id: productId,
            product_name: product.name || '',
            quantity_ordered: data.quantity, // The counted quantity
            current_quantity: data.quantity,
            minimum_threshold: product.minimum_threshold || 0,
            checkbox_only: product.checkbox_only || false,
            unit: product.unit || '',
            supplier_name: primarySupplier?.name || 'Unknown Supplier',
            all_suppliers: productSuppliers.map(ps => ps.supplier.name),
            category_names: productCategories.map(cat => cat.name),
            needs_ordering: data.should_order, // Flag to indicate if this item needs ordering
            was_actually_counted: !product.checkbox_only || data.should_order // Track if this was actually counted
          };
        })
        .filter(item => item !== null); // Remove null items

      // Prepare items that need ordering (for email notification)
      const itemsToOrder = allCountedItems.filter(item => item.needs_ordering);

      if (itemsToOrder.length === 0) {
        alert('No items need to be ordered.');
        return;
      }

      // Create main order record
      const orderNotes = inventoryCount.notes 
        ? `Order submitted by ${inventoryCount.user_name}\n\nNote: ${inventoryCount.notes}`
        : `Order submitted by ${inventoryCount.user_name}`;

      // Try to insert with user_name field first, fall back without it if column doesn't exist
      let orderData;
      let orderError;
      
      // First attempt with user_name
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          location_id: inventoryCount.location_id,
          status: 'pending', // New orders start as pending
          notes: orderNotes,
          user_name: inventoryCount.user_name, // Store user name as separate field
          order_date: new Date().toISOString()
        }])
        .select()
        .single();
      
      orderData = data;
      orderError = error;
      
      // If user_name column doesn't exist, try without it
      if (orderError && (orderError.message?.includes('user_name') || orderError.message?.includes('column'))) {
        console.warn('user_name column not found, inserting without it');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .insert([{
            order_number: orderNumber,
            location_id: inventoryCount.location_id,
            status: 'pending', // New orders start as pending
            notes: orderNotes,
            order_date: new Date().toISOString()
          }])
          .select()
          .single();
        
        orderData = fallbackData;
        orderError = fallbackError;
      }

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Create order items - store ALL counted items (complete inventory record)
      const orderItems = allCountedItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.current_quantity, // actual counted quantity
        needs_ordering: item.needs_ordering // flag indicating if this item needs to be ordered
        // Note: was_actually_counted is not stored in DB, just used for filtering
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
        console.log('📧 Attempting to send email notification...');
        console.log('📧 Email data:', {
          user_name: inventoryCount.user_name,
          location_id: inventoryCount.location_id,
          notes: inventoryCount.notes,
          productsCount: products.length,
          locationsCount: locations.length,
          itemsToOrderCount: itemsToOrder.length
        });
        
        const emailResult = await emailService.sendOrderEmail(inventoryCount, products, locations, categories, suppliers);
        console.log('✅ Email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('❌ Email failed (order still saved):', emailError);
        console.error('❌ Email error details:', {
          message: (emailError as any)?.message,
          stack: (emailError as any)?.stack,
          name: (emailError as any)?.name,
          fullError: emailError
        });
        
        // Show alert to user about email failure
        alert('Order saved successfully, but email notification failed. Please check console for details.');
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
      // Separate junction table data from product data
      const { categories, suppliers, ...productData } = product as any;
      
      // Get the highest sort_order value
      const maxSortOrder = products.length > 0 ? Math.max(...products.map(p => p.sort_order)) : -1;
      
      const productWithSort = {
        ...productData,
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

      // Handle category relationships if provided
      if (categories && Array.isArray(categories) && categories.length > 0) {
        const categoryInserts = categories.map((cat: any) => ({
          product_id: data.id,
          category_id: cat.id,
          is_primary: cat.is_primary || false
        }));

        const { error: categoryError } = await supabase
          .from('product_categories')
          .insert(categoryInserts);

        if (categoryError) {
          console.error('Error adding product categories:', categoryError);
          throw categoryError;
        }
      }

      // Handle supplier relationships if provided
      if (suppliers && Array.isArray(suppliers) && suppliers.length > 0) {
        const supplierInserts = suppliers.map((sup: any) => ({
          product_id: data.id,
          supplier_id: sup.id,
          is_primary: sup.is_primary || false,
          cost_override: sup.cost_override || null
        }));

        const { error: supplierError } = await supabase
          .from('product_suppliers')
          .insert(supplierInserts);

        if (supplierError) {
          console.error('Error adding product suppliers:', supplierError);
          throw supplierError;
        }
      }

      // Reload data to get updated relationships
      await loadData();
      
      console.log('✅ Product added successfully:', data);
    } catch (error) {
      console.error('❌ Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // Separate junction table data from product data
      const { categories, suppliers, ...productUpdates } = updates as any;
      
      console.log('🔍 updateProduct called with:', {
        id,
        categories: categories?.length || 'undefined',
        suppliers: suppliers?.length || 'undefined',
        productUpdates: Object.keys(productUpdates)
      });
      
      // Map is_checkbox_only back to checkbox_only for database
      const dbUpdates = { ...productUpdates };
      if ('is_checkbox_only' in dbUpdates) {
        (dbUpdates as any).checkbox_only = dbUpdates.is_checkbox_only;
        delete (dbUpdates as any).is_checkbox_only;
      }

      // Update the main product record
      const { data: productData, error: productError } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (productError) {
        console.error('Error updating product:', productError);
        throw productError;
      }

      console.log('✅ Product record updated:', productData);

      // Handle category relationships if provided
      if (categories && Array.isArray(categories)) {
        console.log('🏷️ Updating categories:', categories);
        
        // Delete existing category relationships
        const { error: deleteCatError } = await supabase
          .from('product_categories')
          .delete()
          .eq('product_id', id);

        if (deleteCatError) {
          console.error('Error deleting existing categories:', deleteCatError);
          throw deleteCatError;
        }

        // Insert new category relationships
        if (categories.length > 0) {
          const categoryInserts = categories.map((cat: any) => ({
            product_id: id,
            category_id: cat.id,
            is_primary: cat.is_primary || false
          }));

          console.log('📝 Inserting categories:', categoryInserts);

          const { error: categoryError } = await supabase
            .from('product_categories')
            .insert(categoryInserts);

          if (categoryError) {
            console.error('Error updating product categories:', categoryError);
            throw categoryError;
          }
          
          console.log('✅ Categories updated successfully');
        }
      }

      // Handle supplier relationships if provided
      if (suppliers && Array.isArray(suppliers)) {
        console.log('🚚 Updating suppliers:', suppliers);
        
        // Delete existing supplier relationships
        const { error: deleteSupError } = await supabase
          .from('product_suppliers')
          .delete()
          .eq('product_id', id);

        if (deleteSupError) {
          console.error('Error deleting existing suppliers:', deleteSupError);
          throw deleteSupError;
        }

        // Insert new supplier relationships
        if (suppliers.length > 0) {
          const supplierInserts = suppliers.map((sup: any) => ({
            product_id: id,
            supplier_id: sup.id,
            is_primary: sup.is_primary || false,
            cost_override: sup.cost_override || null
          }));

          console.log('📝 Inserting suppliers:', supplierInserts);

          const { error: supplierError } = await supabase
            .from('product_suppliers')
            .insert(supplierInserts);

          if (supplierError) {
            console.error('Error updating product suppliers:', supplierError);
            throw supplierError;
          }
          
          console.log('✅ Suppliers updated successfully');
        }
      }

      // Reload data to get updated relationships
      console.log('🔄 Reloading data to refresh UI...');
      await loadData();
      
      console.log('✅ Product updated successfully:', productData);
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
    
    try {
      // First, try to insert with the role field
      let { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      // If there's a column error for 'role', try without it
      if (error && error.message?.includes('role')) {
        console.warn('Role column not found in database, inserting without role field');
        const userWithoutRole = { ...userData };
        delete (userWithoutRole as any).role;
        
        const result = await supabase
          .from('users')
          .insert([userWithoutRole])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error adding user:', error);
        throw error;
      }

      // Process the new user data and ensure role is properly set
      const newUser = {
        ...data,
        role: userData.role || data.role || getRoleForCode(data.login_code)
      };
      
      setUsers(prev => [...prev, newUser]);
      
      console.log('✅ User added successfully:', newUser);
    } catch (error) {
      console.error('❌ Failed to add user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      // First, try to update with the role field
      let { data, error } = await supabase
        .from('users')
        .update(user)
        .eq('id', id)
        .select()
        .single();

      // If there's a column error for 'role', try without it
      if (error && error.message?.includes('role')) {
        console.warn('Role column not found in database, updating without role field');
        const userWithoutRole = { ...user };
        delete (userWithoutRole as any).role;
        
        const result = await supabase
          .from('users')
          .update(userWithoutRole)
          .eq('id', id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      // Process the updated user data and ensure role is properly set
      const updatedUser = {
        ...data,
        role: user.role || data.role || getRoleForCode(data.login_code)
      };
      
      setUsers(prev => prev.map(existingUser => existingUser.id === id ? updatedUser : existingUser));
      
      // 🔥 CRITICAL: Check if we updated the currently logged-in user's role
      const currentUser = JSON.parse(localStorage.getItem('inventory_user') || '{}');
      if (currentUser.id === id && user.role && user.role !== currentUser.role) {
        console.log('🔄 Current user role changed, updating localStorage cache');
        
        // Update the cached user data with the new role
        const updatedCurrentUser = { ...currentUser, role: user.role };
        localStorage.setItem('inventory_user', JSON.stringify(updatedCurrentUser));
        
        // Show notification that user needs to refresh or their session will be updated
        console.log('⚠️ User role updated. Changes will take effect immediately.');
        
        // Force a page reload to ensure all components get the new role
        // This ensures the navigation and access controls are immediately updated
        window.location.reload();
      }
      
      console.log('✅ User updated successfully:', updatedUser);
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
      
      setUsers(prev => prev.filter(user => user.id !== id));
      
      console.log('✅ User deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      throw error;
    }
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

import { createClient } from '@supabase/supabase-js';
import { config, isDevelopment } from '../config/env';

// Initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabase) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      if (isDevelopment) {
        console.warn('Supabase credentials not configured. Using mock data.');
        return null;
      }
      throw new Error('Supabase credentials are required in production');
    }
    
    supabase = createClient(config.supabase.url, config.supabase.anonKey);
  }
  
  return supabase;
};

// Example database operations (to be implemented)
export const supabaseService = {
  // Products - fetch with junction table relationships
  async getProducts() {
    const client = getSupabaseClient();
    if (!client) {
      console.log('🔄 No Supabase client - using development mode');
      return []; // Return empty array in development
    }
    
    console.log('🔍 Fetching products with relationships from database...');
    
    try {
      // Fetch products with junction table relationships (excluding soft-deleted)
      const { data, error } = await client
        .from('products')
        .select(`
          *,
          product_categories (
            id,
            category_id,
            is_primary,
            created_at,
            categories (*)
          ),
          product_suppliers (
            id,
            supplier_id,
            is_primary,
            cost_override,
            created_at,
            suppliers (*)
          )
        `)
        .is('deleted_at', null) // Only fetch non-deleted products
        .order('sort_order');
      
      if (error) {
        console.error('❌ Error fetching products:', error);
        throw error;
      }
      
      console.log(`✅ Products fetched successfully: ${data?.length || 0} products found`);
      
      // Transform data to include convenience properties for backward compatibility
      const transformedData = data?.map((product: any) => {
        const productCategories = Array.isArray(product.product_categories) ? product.product_categories : [];
        const productSuppliers = Array.isArray(product.product_suppliers) ? product.product_suppliers : [];
        
        return {
          ...product,
          // Add backward compatibility fields
          category_id: productCategories.find((pc: any) => pc.is_primary)?.category_id,
          supplier_id: productSuppliers.find((ps: any) => ps.is_primary)?.supplier_id,
          primary_category: productCategories.find((pc: any) => pc.is_primary)?.categories,
          primary_supplier: productSuppliers.find((ps: any) => ps.is_primary)?.suppliers,
        };
      }) || [];
      
      if (transformedData.length > 0) {
        console.log('Sample transformed product structure:', {
          id: transformedData[0].id,
          name: transformedData[0].name,
          category_id: transformedData[0].category_id,
          supplier_id: transformedData[0].supplier_id,
          product_categories_count: transformedData[0].product_categories?.length || 0,
          product_suppliers_count: transformedData[0].product_suppliers?.length || 0,
          keys: Object.keys(transformedData[0])
        });
      }
      
      return transformedData;
    } catch (err) {
      console.error('❌ Exception in getProducts:', err);
      throw err;
    }
  },

  async getProductById(id: string) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data, error } = await client
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          category_id,
          is_primary,
          created_at,
          categories (*)
        ),
        product_suppliers (
          id,
          supplier_id,
          is_primary,
          cost_override,
          created_at,
          suppliers (*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    const productCategories = Array.isArray(data.product_categories) ? data.product_categories : [];
    const productSuppliers = Array.isArray(data.product_suppliers) ? data.product_suppliers : [];
    
    // Transform data to include convenience properties
    return {
      ...data,
      category_id: productCategories.find((pc: any) => pc.is_primary)?.category_id,
      supplier_id: productSuppliers.find((ps: any) => ps.is_primary)?.supplier_id,
      primary_category: productCategories.find((pc: any) => pc.is_primary)?.categories,
      primary_supplier: productSuppliers.find((ps: any) => ps.is_primary)?.suppliers,
    };
  },
  
  async createProduct(product: any) {
    const client = getSupabaseClient();
    if (!client) return { id: Date.now().toString(), ...product }; // Mock in development
    
    const { data, error } = await client
      .from('products')
      .insert([{
        name: product.name,
        description: product.description,
        unit: product.unit,
        cost: product.cost,
        minimum_threshold: product.minimum_threshold,
        checkbox_only: product.checkbox_only,
        hidden: product.hidden || false,
        sort_order: product.sort_order || 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // If categories or suppliers are provided, create junction table entries
    if (data && (product.categories || product.suppliers)) {
      const productId = data.id;
      
      // Handle categories
      if (product.categories && product.categories.length > 0) {
        const categoryInserts = product.categories.map((cat: any, index: number) => ({
          product_id: productId,
          category_id: cat.id,
          is_primary: index === 0 || cat.is_primary // First one is primary by default
        }));
        
        await client.from('product_categories').insert(categoryInserts);
      }
      
      // Handle suppliers
      if (product.suppliers && product.suppliers.length > 0) {
        const supplierInserts = product.suppliers.map((sup: any, index: number) => ({
          product_id: productId,
          supplier_id: sup.id,
          is_primary: index === 0 || sup.is_primary, // First one is primary by default
          cost_override: sup.cost_override
        }));
        
        await client.from('product_suppliers').insert(supplierInserts);
      }
    }
    
    return data;
  },
  
  async updateProduct(id: string, updates: any) {
    const client = getSupabaseClient();
    if (!client) return { id, ...updates };
    
    // Update main product record
    const { data, error } = await client
      .from('products')
      .update({
        name: updates.name,
        description: updates.description,
        unit: updates.unit,
        cost: updates.cost,
        minimum_threshold: updates.minimum_threshold,
        checkbox_only: updates.checkbox_only,
        hidden: updates.hidden,
        sort_order: updates.sort_order
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Handle category updates if provided
    if (updates.categories) {
      // Delete existing category relationships
      await client.from('product_categories').delete().eq('product_id', id);
      
      // Insert new category relationships
      if (updates.categories.length > 0) {
        const categoryInserts = updates.categories.map((cat: any, index: number) => ({
          product_id: id,
          category_id: cat.id,
          is_primary: index === 0 || cat.is_primary
        }));
        
        await client.from('product_categories').insert(categoryInserts);
      }
    }
    
    // Handle supplier updates if provided
    if (updates.suppliers) {
      // Delete existing supplier relationships
      await client.from('product_suppliers').delete().eq('product_id', id);
      
      // Insert new supplier relationships
      if (updates.suppliers.length > 0) {
        const supplierInserts = updates.suppliers.map((sup: any, index: number) => ({
          product_id: id,
          supplier_id: sup.id,
          is_primary: index === 0 || sup.is_primary,
          cost_override: sup.cost_override
        }));
        
        await client.from('product_suppliers').insert(supplierInserts);
      }
    }
    
    return data;
  },
  
  async deleteProduct(id: string) {
    const client = getSupabaseClient();
    if (!client) return;
    
    // Junction table entries will be deleted automatically due to CASCADE
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // Locations
  async getLocations() {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('locations')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },
  
  // Categories
  async getCategories() {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('categories')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },
  
  // Suppliers
  async getSuppliers() {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('suppliers')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },
  
  // Orders
  async createOrder(order: any) {
    const client = getSupabaseClient();
    if (!client) return { id: Date.now().toString(), ...order };
    
    const { data, error } = await client
      .from('orders')
      .insert([order])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async getOrders() {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `);
    
    if (error) throw error;
    return data || [];
  }
};

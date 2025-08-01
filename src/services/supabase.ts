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
  // Products
  async getProducts() {
    const client = getSupabaseClient();
    if (!client) return []; // Return empty array in development
    
    const { data, error } = await client
      .from('products')
      .select('*');
    
    if (error) throw error;
    return data || [];
  },
  
  async createProduct(product: any) {
    const client = getSupabaseClient();
    if (!client) return { id: Date.now().toString(), ...product }; // Mock in development
    
    const { data, error } = await client
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    return data;
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

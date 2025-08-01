import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Test database connection
export const testDatabaseConnection = async () => {
  console.log('🔌 Testing database connection...');
  
  try {
    // Check if credentials are provided
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.warn('⚠️ Supabase credentials not configured');
      return {
        success: false,
        error: 'Missing Supabase credentials',
        usingMockData: true
      };
    }

    console.log('📡 Supabase URL:', config.supabase.url);
    console.log('🔑 Anon Key (first 20 chars):', config.supabase.anonKey.substring(0, 20) + '...');

    // Create Supabase client
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);

    // Test basic connection with a simple query
    console.log('🧪 Testing connection...');
    const { data, error } = await supabase
      .from('locations')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection failed:', error);
      
      // Check for common errors
      if (error.message.includes('relation "locations" does not exist')) {
        return {
          success: false,
          error: 'Tables not created yet - need to run database setup',
          needsSetup: true
        };
      }
      
      if (error.message.includes('Invalid API key')) {
        return {
          success: false,
          error: 'Invalid Supabase credentials',
          checkCredentials: true
        };
      }

      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Location count:', data || 0);

    return {
      success: true,
      message: 'Database connection working',
      count: data || 0
    };

  } catch (error) {
    console.error('💥 Connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
      details: error
    };
  }
};

// Test all database tables
export const testAllTables = async () => {
  console.log('📋 Testing all database tables...');
  
  const supabase = createClient(config.supabase.url, config.supabase.anonKey);
  const tables = ['locations', 'categories', 'suppliers', 'products', 'orders', 'order_items'];
  const results: Record<string, { success: boolean; error?: string; count?: number }> = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        results[table] = { success: false, error: error.message };
      } else {
        results[table] = { success: true, count: Array.isArray(data) ? data.length : 0 };
      }
    } catch (error) {
      results[table] = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  console.log('📊 Table test results:', results);
  return results;
};

// Create basic test data
export const createTestData = async () => {
  console.log('🛠️ Creating test data...');
  
  const supabase = createClient(config.supabase.url, config.supabase.anonKey);
  
  try {
    // Create test location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert([
        { name: 'Test Location', address: '123 Test St' }
      ])
      .select()
      .single();

    if (locationError) throw locationError;

    // Create test category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert([
        { name: 'Test Category', color: '#ff6b6b' }
      ])
      .select()
      .single();

    if (categoryError) throw categoryError;

    // Create test supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert([
        { name: 'Test Supplier', contact_info: 'test@supplier.com' }
      ])
      .select()
      .single();

    if (supplierError) throw supplierError;

    console.log('✅ Test data created successfully!');
    return { success: true, location, category, supplier };

  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

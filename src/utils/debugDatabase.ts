import { supabaseService, getSupabaseClient } from '../services/supabase';

export const debugDatabase = {
  async testConnection() {
    console.log('🔍 Testing database connection...');
    
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ No Supabase client - running in development mode');
      return false;
    }
    
    try {
      // Test basic connection
      const { error } = await client
        .from('products')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Database connection error:', error);
        return false;
      }
      
      console.log('✅ Database connection successful');
      return true;
    } catch (err) {
      console.error('❌ Connection test failed:', err);
      return false;
    }
  },

  async testBasicQueries() {
    console.log('🔍 Testing basic queries...');
    
    try {
      // Test products
      console.log('Testing products query...');
      const products = await supabaseService.getProducts();
      console.log(`✅ Products: ${products.length} found`);
      
      // Test categories
      console.log('Testing categories query...');
      const categories = await supabaseService.getCategories();
      console.log(`✅ Categories: ${categories.length} found`);
      
      // Test suppliers
      console.log('Testing suppliers query...');
      const suppliers = await supabaseService.getSuppliers();
      console.log(`✅ Suppliers: ${suppliers.length} found`);
      
      // Test locations
      console.log('Testing locations query...');
      const locations = await supabaseService.getLocations();
      console.log(`✅ Locations: ${locations.length} found`);
      
      return { products, categories, suppliers, locations };
    } catch (err) {
      console.error('❌ Query test failed:', err);
      throw err;
    }
  },

  async testProductStructure() {
    console.log('🔍 Testing product structure...');
    
    const client = getSupabaseClient();
    if (!client) {
      console.error('❌ No client available');
      return;
    }
    
    try {
      // Test if junction tables exist
      const { error: junctionError } = await client
        .from('product_categories')
        .select('count')
        .limit(1);
      
      if (junctionError) {
        console.warn('⚠️ Junction tables not found:', junctionError.message);
        
        // Test old structure
        const { data: oldStructure, error: oldError } = await client
          .from('products')
          .select('id, name, category_id, supplier_id')
          .limit(3);
        
        if (oldError) {
          console.error('❌ Old structure also failed:', oldError);
        } else {
          console.log('✅ Old structure works, sample products:', oldStructure);
        }
      } else {
        console.log('✅ Junction tables exist');
        
        // Test new structure query
        const { data: newStructure, error: newError } = await client
          .from('products')
          .select(`
            id, name,
            product_categories (
              category_id,
              is_primary
            ),
            product_suppliers (
              supplier_id,
              is_primary
            )
          `)
          .limit(3);
        
        if (newError) {
          console.error('❌ New structure query failed:', newError);
        } else {
          console.log('✅ New structure works, sample products:', newStructure);
        }
      }
    } catch (err) {
      console.error('❌ Structure test failed:', err);
    }
  }
};

// Auto-run debug on import in development
if (import.meta.env.DEV) {
  console.log('🚀 Debug Database - Auto-running tests...');
  setTimeout(() => {
    debugDatabase.testConnection()
      .then(connected => {
        if (connected) {
          return debugDatabase.testProductStructure();
        }
      })
      .catch(err => console.error('Debug failed:', err));
  }, 1000);
}

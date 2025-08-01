import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 Checking table schemas...\n');
  
  // Check if sort_order columns exist
  const tables = ['locations', 'categories', 'suppliers', 'products'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Error querying ${table}:`, error.message);
        continue;
      }
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`📋 ${table} columns:`, columns);
        console.log(`   ✅ Has sort_order: ${columns.includes('sort_order')}`);
        
        // Check if checkbox_only exists for products
        if (table === 'products') {
          console.log(`   ✅ Has checkbox_only: ${columns.includes('checkbox_only')}`);
        }
      } else {
        console.log(`📋 ${table}: No data to check schema`);
      }
      console.log('');
    } catch (err) {
      console.log(`❌ Error checking ${table}:`, err.message);
    }
  }
  
  // Check orders table structure
  try {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('📋 orders columns:', columns);
    }
  } catch (err) {
    console.log('❌ Error checking orders:', err.message);
  }
  
  // Check order_items table structure
  try {
    const { data, error } = await supabase.from('order_items').select('*').limit(1);
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('📋 order_items columns:', columns);
    }
  } catch (err) {
    console.log('❌ Error checking order_items:', err.message);
  }
}

checkSchema().catch(console.error);

// Simple Node.js script to test database connection and table existence
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Read environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Testing Database Connection...');
console.log('URL:', supabaseUrl);
console.log('Key Preview:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('\n🌐 Testing basic connection...');
    const { data, error } = await supabase.from('locations').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Locations table count:', data);

    console.log('\n📋 Checking required tables...');
    const tables = ['locations', 'categories', 'suppliers', 'products', 'orders', 'order_items'];
    
    for (const table of tables) {
      try {
        const { error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n🔍 Testing order creation...');
    try {
      // Try to create a test order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: `TEST-${Date.now()}`,
          location_id: null, // Will fail if locations don't exist
          status: 'pending',
          notes: 'Test order from diagnostic script',
          order_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (orderError) {
        console.log('⚠️  Order creation test failed:', orderError.message);
      } else {
        console.log('✅ Order creation test successful:', orderData.order_number);
        
        // Clean up test order
        await supabase.from('orders').delete().eq('id', orderData.id);
        console.log('🧹 Test order cleaned up');
      }
    } catch (err) {
      console.log('⚠️  Order creation test failed:', err.message);
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabase();

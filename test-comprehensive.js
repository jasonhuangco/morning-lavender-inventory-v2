import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function comprehensiveTest() {
  console.log('🔍 Running comprehensive database validation...\n');
  
  try {
    // 1. Test all tables exist and have correct structure
    console.log('1️⃣ Testing table structure...');
    
    const tables = [
      { name: 'locations', requiredColumns: ['id', 'name', 'sort_order'] },
      { name: 'categories', requiredColumns: ['id', 'name', 'sort_order'] },
      { name: 'suppliers', requiredColumns: ['id', 'name', 'sort_order'] },
      { name: 'products', requiredColumns: ['id', 'name', 'checkbox_only', 'sort_order'] },
      { name: 'orders', requiredColumns: ['id', 'order_number', 'location_id', 'status'] },
      { name: 'order_items', requiredColumns: ['id', 'order_id', 'product_id', 'quantity'] }
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table.name).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table.name}: ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const missingColumns = table.requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length === 0) {
          console.log(`✅ ${table.name}: All required columns present`);
        } else {
          console.log(`⚠️ ${table.name}: Missing columns: ${missingColumns.join(', ')}`);
        }
      } else {
        console.log(`🔍 ${table.name}: Empty table`);
      }
    }
    
    // 2. Test checkbox_only products exist
    console.log('\n2️⃣ Testing checkbox_only functionality...');
    
    const { data: checkboxProducts } = await supabase
      .from('products')
      .select('*')
      .eq('checkbox_only', true);
    
    console.log(`✅ Found ${checkboxProducts?.length || 0} checkbox-only products`);
    
    // 3. Test sort_order functionality
    console.log('\n3️⃣ Testing sort_order functionality...');
    
    const { data: sortedCategories } = await supabase
      .from('categories')
      .select('name, sort_order')
      .order('sort_order', { ascending: true });
    
    if (sortedCategories?.length) {
      console.log('✅ Categories sorted by sort_order:');
      sortedCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.sort_order})`);
      });
    }
    
    // 4. Test order creation and retrieval (like OrderHistoryPage)
    console.log('\n4️⃣ Testing order workflow...');
    
    const { data: location } = await supabase.from('locations').select('*').limit(1).single();
    const { data: product } = await supabase.from('products').select('*').limit(1).single();
    
    if (location && product) {
      // Create test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: `TEST-FINAL-${Date.now()}`,
          location_id: location.id,
          status: 'pending',
          notes: 'Order submitted by Final Test'
        })
        .select()
        .single();
      
      if (!orderError) {
        // Add test item
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: product.id,
          quantity: 5
        });
        
        // Test retrieval with joins (like OrderHistoryPage does)
        const { data: orderWithDetails, error: retrieveError } = await supabase
          .from('orders')
          .select(`
            *,
            locations(name),
            order_items(
              *,
              products(
                name,
                minimum_threshold,
                checkbox_only,
                categories(name),
                suppliers(name)
              )
            )
          `)
          .eq('id', order.id)
          .single();
        
        if (!retrieveError && orderWithDetails) {
          console.log('✅ Order creation and retrieval successful');
          console.log(`   Order: ${orderWithDetails.order_number}`);
          console.log(`   Location: ${orderWithDetails.locations?.name}`);
          console.log(`   Items: ${orderWithDetails.order_items?.length}`);
          console.log(`   Product: ${orderWithDetails.order_items?.[0]?.products?.name}`);
          console.log(`   Checkbox-only: ${orderWithDetails.order_items?.[0]?.products?.checkbox_only}`);
          
          // Clean up
          await supabase.from('orders').delete().eq('id', order.id);
          console.log('🧹 Test order cleaned up');
        } else {
          console.log('❌ Order retrieval failed:', retrieveError?.message);
        }
      } else {
        console.log('❌ Order creation failed:', orderError.message);
      }
    }
    
    // 5. Test reorder function
    console.log('\n5️⃣ Testing reorder function...');
    
    const { data: reorderTest, error: reorderError } = await supabase.rpc('reorder_items', {
      table_name: 'categories',
      item_id: sortedCategories?.[0]?.name ? 
        (await supabase.from('categories').select('id').eq('name', sortedCategories[0].name).single())?.data?.id : 
        null,
      new_position: 0 // Move to same position (no-op)
    });
    
    if (!reorderError) {
      console.log('✅ Reorder function working');
    } else {
      console.log('❌ Reorder function failed:', reorderError.message);
    }
    
    console.log('\n🎉 Comprehensive test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

comprehensiveTest();

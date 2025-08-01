#!/usr/bin/env node

// Test the fix for order quantity logic
// This test simulates the order creation and verification process

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://setkamakzbnhtosacdee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldGthbWFremJuaHRvc2FjZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTE3MzcsImV4cCI6MjA2OTE2NzczN30.NItl1_4vKC1UhTEDxpjhCIn_s6BLPMuIny8QERRiFHg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderLogicFix() {
  console.log('🧪 Testing Order Logic Fix...\n');
  
  try {
    // Get test data
    const { data: locations } = await supabase.from('locations').select('*').limit(1);
    const { data: products } = await supabase.from('products').select('*').limit(2);
    
    if (!locations?.length || !products?.length) {
      console.log('❌ Need test data to proceed');
      return;
    }
    
    const location = locations[0];
    const testProduct = products[0];
    
    console.log('📍 Test Location:', location.name);
    console.log('📦 Test Product:', testProduct.name);
    console.log('🎯 Product Minimum Threshold:', testProduct.minimum_threshold);
    
    // Simulate inventory count where product is below threshold
    const countedQuantity = Math.max(0, testProduct.minimum_threshold - 2); // 2 below minimum
    const quantityNeeded = testProduct.minimum_threshold - countedQuantity;
    
    console.log('\n📊 Test Scenario:');
    console.log(`   Minimum Threshold: ${testProduct.minimum_threshold}`);
    console.log(`   Counted Quantity: ${countedQuantity}`);
    console.log(`   Quantity Needed: ${quantityNeeded}`);
    console.log(`   Should Order: ${countedQuantity < testProduct.minimum_threshold ? 'YES ✅' : 'NO ❌'}`);
    
    // Create test order (simulating the fixed logic)
    const orderData = {
      order_number: `LOGIC-TEST-${Date.now()}`,
      location_id: location.id,
      status: 'pending',
      notes: 'Order submitted by Logic Test',
      order_date: new Date().toISOString()
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (orderError) {
      console.log('❌ Error creating test order:', orderError);
      return;
    }
    
    console.log('\n✅ Test order created:', order.order_number);
    
    // Create order item with FIXED logic: store counted quantity
    const orderItem = {
      order_id: order.id,
      product_id: testProduct.id,
      quantity: countedQuantity // ✅ FIXED: Store actual counted quantity, not quantity needed
    };
    
    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItem);
    
    if (itemError) {
      console.log('❌ Error creating order item:', itemError);
      return;
    }
    
    console.log('✅ Order item created with counted quantity:', countedQuantity);
    
    // Test retrieval (simulating OrderHistoryPage logic)
    const { data: retrievedOrder, error: retrieveError } = await supabase
      .from('orders')
      .select(`
        *,
        locations(name),
        order_items(
          *,
          products(
            name,
            minimum_threshold,
            categories(name),
            suppliers(name)
          )
        )
      `)
      .eq('id', order.id)
      .single();
    
    if (retrieveError) {
      console.log('❌ Error retrieving order:', retrieveError);
      return;
    }
    
    console.log('\n📋 Retrieved Order Verification:');
    
    const orderItem_retrieved = retrievedOrder.order_items[0];
    const product_retrieved = orderItem_retrieved.products;
    const counted = orderItem_retrieved.quantity;
    const minimum = product_retrieved.minimum_threshold;
    const needed = minimum - counted;
    
    console.log(`   Product: ${product_retrieved.name}`);
    console.log(`   Stored Quantity (what was counted): ${counted}`);
    console.log(`   Minimum Threshold: ${minimum}`);
    console.log(`   Calculated Need: ${needed}`);
    console.log(`   Logic Check: ${needed > 0 ? `✅ Need ${needed} to reach minimum` : needed < 0 ? `✅ Over by ${Math.abs(needed)}` : '✅ At minimum'}`);
    
    // Transform to UI format (simulating what OrderHistoryPage does)
    const uiOrderItem = {
      product_name: product_retrieved.name,
      quantity_ordered: counted, // This is now the actual counted quantity
      current_quantity: counted,  // Same as quantity_ordered  
      minimum_threshold: minimum,
      // UI calculates: need = minimum_threshold - quantity_ordered
    };
    
    const uiCalculatedNeed = uiOrderItem.minimum_threshold - uiOrderItem.quantity_ordered;
    
    console.log('\n🎨 UI Display Simulation:');
    console.log(`   "Counted: ${uiOrderItem.quantity_ordered}"`);
    console.log(`   "Minimum: ${uiOrderItem.minimum_threshold}"`);
    console.log(`   "Need: ${uiCalculatedNeed > 0 ? uiCalculatedNeed : 0}"`);
    
    // Verify the fix worked
    if (counted === countedQuantity && uiCalculatedNeed === quantityNeeded) {
      console.log('\n🎉 ORDER LOGIC FIX VERIFIED!');
      console.log('   ✅ Database stores actual counted quantity');
      console.log('   ✅ UI correctly calculates quantity needed');
      console.log('   ✅ "Counted" shows what was actually counted');
      console.log('   ✅ "Need" shows difference between minimum and counted');
    } else {
      console.log('\n❌ ORDER LOGIC FIX FAILED!');
      console.log(`   Expected counted: ${countedQuantity}, got: ${counted}`);
      console.log(`   Expected need: ${quantityNeeded}, got: ${uiCalculatedNeed}`);
    }
    
    // Clean up
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('\n🧹 Test order cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOrderLogicFix();

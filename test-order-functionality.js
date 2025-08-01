import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testOrderCreation() {
  console.log('🧪 Testing order creation and retrieval...\n');
  
  try {
    // First, get some test data
    const { data: locations } = await supabase.from('locations').select('*').limit(1);
    const { data: products } = await supabase.from('products').select('*').limit(2);
    
    if (!locations?.length || !products?.length) {
      console.log('❌ Need at least 1 location and 2 products to test');
      return;
    }
    
    const location = locations[0];
    const testProducts = products.slice(0, 2);
    
    console.log('📍 Using location:', location.name);
    console.log('📦 Using products:', testProducts.map(p => p.name).join(', '));
    
    // Create a test order
    const orderData = {
      order_number: `TEST-${Date.now()}`,
      location_id: location.id,
      status: 'pending',
      notes: 'Order submitted by Test User',
      order_date: new Date().toISOString()
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (orderError) {
      console.log('❌ Error creating order:', orderError);
      return;
    }
    
    console.log('✅ Order created:', order.order_number);
    
    // Add order items
    const orderItems = testProducts.map(product => ({
      order_id: order.id,
      product_id: product.id,
      quantity: 5,
      unit_cost: 10.00,
      total_cost: 50.00
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.log('❌ Error creating order items:', itemsError);
      return;
    }
    
    console.log('✅ Order items created');
    
    // Test the order retrieval (like in OrderHistoryPage)
    const { data: ordersData, error: retrieveError } = await supabase
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
      .eq('id', order.id);
    
    if (retrieveError) {
      console.log('❌ Error retrieving order:', retrieveError);
      return;
    }
    
    console.log('✅ Order retrieved successfully');
    console.log('📊 Order details:');
    console.log('   Order Number:', ordersData[0].order_number);
    console.log('   Location:', ordersData[0].locations?.name);
    console.log('   Items:', ordersData[0].order_items?.length);
    console.log('   Status:', ordersData[0].status);
    
    // Verify the data structure matches what OrderHistoryPage expects
    const transformedOrder = {
      id: ordersData[0].id,
      user_name: ordersData[0].notes?.replace('Order submitted by ', '') || 'Unknown User',
      location_id: ordersData[0].location_id,
      location_name: ordersData[0].locations?.name || 'Unknown Location',
      status: ordersData[0].status === 'pending' ? 'submitted' : ordersData[0].status,
      created_at: ordersData[0].created_at,
      updated_at: ordersData[0].updated_at,
      notes: ordersData[0].notes,
      items: (ordersData[0].order_items || []).map((item) => ({
        product_id: item.product_id,
        product_name: item.products?.name || 'Unknown Product',
        quantity_ordered: item.quantity || 0,
        current_quantity: 0,
        minimum_threshold: item.products?.minimum_threshold || 0,
        supplier_name: item.products?.suppliers?.name || 'Unknown Supplier',
        category_names: item.products?.categories?.name ? [item.products.categories.name] : []
      }))
    };
    
    console.log('✅ Data transformation successful');
    console.log('📋 Transformed items:', transformedOrder.items.length);
    
    // Clean up test order
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('🧹 Test order cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOrderCreation();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testReorderFunctionality() {
  console.log('🔄 Testing reorder functionality...\n');
  
  try {
    // Test with categories
    console.log('📂 Testing category reordering...');
    
    // Get current categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (catError) {
      console.log('❌ Error fetching categories:', catError);
      return;
    }
    
    console.log('✅ Current categories order:');
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (sort_order: ${cat.sort_order})`);
    });
    
    if (categories.length >= 2) {
      // Test reordering - move first item to second position
      const firstItem = categories[0];
      const targetPosition = 1; // 0-based index
      
      console.log(`\n🔄 Moving "${firstItem.name}" to position ${targetPosition + 1}...`);
      
      // Call the reorder function (simulating what the frontend does)
      const { error: reorderError } = await supabase.rpc('reorder_items', {
        table_name: 'categories',
        item_id: firstItem.id,
        new_position: targetPosition
      });
      
      if (reorderError) {
        console.log('❌ Reorder function error:', reorderError);
      } else {
        console.log('✅ Reorder function called successfully');
        
        // Verify the new order
        const { data: newOrder } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        
        console.log('📋 New categories order:');
        newOrder.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name} (sort_order: ${cat.sort_order})`);
        });
      }
    }
    
    // Test products with checkbox_only functionality
    console.log('\n📦 Testing products with checkbox_only...');
    
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(5);
    
    if (products?.length) {
      console.log('✅ Sample products:');
      products.forEach(product => {
        console.log(`   • ${product.name} (checkbox_only: ${product.checkbox_only})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReorderFunctionality();

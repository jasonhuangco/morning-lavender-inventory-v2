// Test script to check order loading
import { createClient } from '@supabase/supabase-js';

const config = {
  supabase: {
    url: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || ''
  }
};

async function testOrderLoading() {
  console.log('Testing order loading...');
  console.log('Config check:', {
    hasUrl: !!config.supabase.url,
    hasKey: !!config.supabase.anonKey,
    urlPreview: config.supabase.url ? config.supabase.url.substring(0, 30) + '...' : 'none'
  });

  try {
    const supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
    
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading orders:', error);
    } else {
      console.log('✅ Orders loaded successfully:', orders?.length || 0);
      if (orders && orders.length > 0) {
        console.log('First order:', orders[0]);
      }
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
}

// Export for manual testing in browser console
(window as any).testOrderLoading = testOrderLoading;

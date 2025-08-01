// Simple database connection test
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

export const quickDatabaseTest = async () => {
  console.log('🔌 Quick database test...');
  
  if (!config.supabase.url || !config.supabase.anonKey) {
    return { success: false, error: 'No Supabase credentials found' };
  }

  try {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    // Try a simple query
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "locations" does not exist')) {
        return { success: false, error: 'Database tables not created yet' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

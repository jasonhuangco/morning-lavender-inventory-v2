import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

export const debugDatabaseConnection = async () => {
  const results = {
    step1_config: null as any,
    step2_client: null as any,
    step3_connection: null as any,
    step4_tables: null as any,
    step5_data: null as any,
  };

  // Step 1: Check configuration
  console.log('🔧 Step 1: Checking configuration...');
  results.step1_config = {
    hasUrl: !!config.supabase.url,
    hasKey: !!config.supabase.anonKey,
    url: config.supabase.url,
    keyPreview: config.supabase.anonKey ? config.supabase.anonKey.substring(0, 20) + '...' : 'MISSING',
    envVars: {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'MISSING',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'MISSING',
    }
  };

  if (!config.supabase.url || !config.supabase.anonKey) {
    results.step1_config.error = 'Missing Supabase credentials';
    return results;
  }

  // Step 2: Create client
  console.log('🔌 Step 2: Creating Supabase client...');
  try {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    results.step2_client = { success: true, client: 'Created successfully' };

    // Step 3: Test basic connection
    console.log('🌐 Step 3: Testing connection...');
    try {
      const { data, error } = await supabase.auth.getSession();
      results.step3_connection = {
        success: !error,
        session: data?.session ? 'Session exists' : 'No session (OK for public access)',
        error: error?.message || null
      };
    } catch (connError) {
      results.step3_connection = {
        success: false,
        error: connError instanceof Error ? connError.message : 'Connection failed'
      };
      return results;
    }

    // Step 4: Check if tables exist
    console.log('📋 Step 4: Checking tables...');
    const tables = ['locations', 'categories', 'suppliers', 'products', 'orders', 'order_items', 'inventory_counts'];
    const tableResults: Record<string, any> = {};

    for (const table of tables) {
      try {
        const { error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          tableResults[table] = {
            exists: false,
            error: error.message,
            code: error.code
          };
        } else {
          tableResults[table] = {
            exists: true,
            count: count || 0
          };
        }
      } catch (tableError) {
        tableResults[table] = {
          exists: false,
          error: tableError instanceof Error ? tableError.message : 'Unknown error'
        };
      }
    }

    results.step4_tables = tableResults;

    // Step 5: Try to read some actual data
    console.log('📊 Step 5: Testing data access...');
    try {
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .limit(3);

      if (locationError) {
        results.step5_data = {
          success: false,
          error: locationError.message,
          code: locationError.code
        };
      } else {
        results.step5_data = {
          success: true,
          sampleData: locationData,
          count: locationData?.length || 0
        };
      }
    } catch (dataError) {
      results.step5_data = {
        success: false,
        error: dataError instanceof Error ? dataError.message : 'Data access failed'
      };
    }

  } catch (clientError) {
    results.step2_client = {
      success: false,
      error: clientError instanceof Error ? clientError.message : 'Client creation failed'
    };
  }

  return results;
};

export const printDiagnostics = (results: any) => {
  console.log('\n🔍 DATABASE CONNECTION DIAGNOSTICS');
  console.log('=====================================');
  
  console.log('\n1️⃣ Configuration:');
  console.log('URL:', results.step1_config?.url || 'MISSING');
  console.log('Key:', results.step1_config?.keyPreview || 'MISSING');
  console.log('Has URL:', results.step1_config?.hasUrl ? '✅' : '❌');
  console.log('Has Key:', results.step1_config?.hasKey ? '✅' : '❌');
  
  if (results.step2_client) {
    console.log('\n2️⃣ Client Creation:', results.step2_client.success ? '✅' : '❌');
    if (results.step2_client.error) console.log('Error:', results.step2_client.error);
  }
  
  if (results.step3_connection) {
    console.log('\n3️⃣ Connection Test:', results.step3_connection.success ? '✅' : '❌');
    if (results.step3_connection.error) console.log('Error:', results.step3_connection.error);
  }
  
  if (results.step4_tables) {
    console.log('\n4️⃣ Table Status:');
    Object.entries(results.step4_tables).forEach(([table, status]: [string, any]) => {
      console.log(`${table}: ${status.exists ? '✅' : '❌'} ${status.exists ? `(${status.count} records)` : `- ${status.error}`}`);
    });
  }
  
  if (results.step5_data) {
    console.log('\n5️⃣ Data Access:', results.step5_data.success ? '✅' : '❌');
    if (results.step5_data.error) console.log('Error:', results.step5_data.error);
    if (results.step5_data.sampleData) console.log('Sample data count:', results.step5_data.count);
  }
};

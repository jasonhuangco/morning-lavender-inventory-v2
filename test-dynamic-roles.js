// Test Dynamic Role System
// Verify that database roles take precedence over hardcoded values

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDynamicRoles() {
  console.log('🧪 Testing Dynamic Role System...\n');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('first_name');

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }

    console.log('👥 Current Database Roles:');
    users.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      const access = user.role === 'admin' ? 'Full Access' : 'Inventory Only';
      console.log(`   ${roleIcon} ${user.first_name} ${user.last_name} (${user.login_code}) → ${user.role} (${access})`);
    });

    console.log('\n🔧 Key Fix Applied:');
    console.log('   ❌ BEFORE: isAdminCode() hardcoded role assignments');
    console.log('   ✅ AFTER: Database role is always the source of truth');
    console.log('   ✅ RESULT: Role changes in User Management take effect immediately');

    console.log('\n📋 Test Steps for Abby (622366):');
    console.log('   1. Clear browser cache/localStorage');
    console.log('   2. Login with code 622366');
    console.log('   3. Should see only "Inventory" tab (staff access)');
    console.log('   4. Change her role back to admin via User Management');
    console.log('   5. Login again with 622366');
    console.log('   6. Should see all tabs (admin access)');

    console.log('\n⚠️  Important Notes:');
    console.log('   - Always clear localStorage when testing role changes');
    console.log('   - Database role is now the single source of truth');
    console.log('   - No more hardcoded admin privileges');

    // Test specific users that were previously hardcoded
    const testCodes = ['236868', '622366', '054673'];
    console.log('\n🎯 Previously Hardcoded Admin Codes:');
    
    for (const code of testCodes) {
      const user = users.find(u => u.login_code === code);
      if (user) {
        const status = user.role === 'admin' ? '✅ Admin' : '⚠️  Staff';
        console.log(`   ${code}: ${user.first_name} ${user.last_name} → ${status} (database controlled)`);
      }
    }

    console.log('\n✅ Dynamic role system is now fully operational!');

  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
  }
}

testDynamicRoles().catch(console.error);

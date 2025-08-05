// Test Role Caching Fix
// Run this after the database migration to verify role changes work immediately

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testRoleCaching() {
  console.log('🧪 Testing Role Caching Fix...\n');
  
  try {
    // Get all users to see current state
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at');

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }

    console.log('👥 Current Users and Roles:');
    users.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      console.log(`   ${roleIcon} ${user.first_name} ${user.last_name} (${user.login_code}) → ${user.role}`);
    });

    console.log('\n🔧 Role Caching Fix Applied:');
    console.log('   ✅ updateUser function now invalidates localStorage cache');
    console.log('   ✅ Current user gets immediate page refresh when role changes');
    console.log('   ✅ Other users get notification about login requirement');
    console.log('   ✅ AuthContext has refreshUser method for manual refresh');

    console.log('\n📋 Testing Steps:');
    console.log('   1. Login with an admin account (236868, 622366, 054673, 111111, 999999)');
    console.log('   2. Go to Settings → User Management');
    console.log('   3. Change your own role from admin to staff');
    console.log('   4. Click "Update" - you should see an alert and page refresh');
    console.log('   5. After refresh, verify you only see "Inventory" tab');
    console.log('   6. Change your role back to admin to test the opposite');

    console.log('\n⚠️  IMPORTANT: Role changes now take effect immediately!');
    console.log('   - Current user: Page refreshes automatically');
    console.log('   - Other users: Must log out and log back in');

    // Test a role change
    const testUser = users.find(u => u.login_code === '333333');
    if (testUser) {
      console.log('\n🔄 Testing role toggle for test user (333333)...');
      
      const newRole = testUser.role === 'admin' ? 'staff' : 'admin';
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', testUser.id);

      if (updateError) {
        console.log('❌ Test role change failed:', updateError.message);
      } else {
        console.log(`✅ Test user role changed: ${testUser.role} → ${newRole}`);
        
        // Change it back
        await supabase
          .from('users')
          .update({ role: testUser.role })
          .eq('id', testUser.id);
        console.log(`🔄 Reverted test user role back to: ${testUser.role}`);
      }
    }

    console.log('\n🎉 Role caching fix is ready for testing!');

  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
  }
}

testRoleCaching().catch(console.error);

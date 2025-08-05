// Verify Role-Based Access Control Database Migration
// Run this after executing the SQL migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyRoleMigration() {
  console.log('🔍 Verifying Role-Based Access Control Migration...\n');
  
  try {
    // Check if role column exists and get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: false });

    if (error) {
      console.log('❌ Error accessing users table:', error.message);
      return;
    }

    console.log('✅ Users table accessible with role column');
    console.log(`👥 Total users: ${users.length}\n`);

    // Check role distribution
    const adminUsers = users.filter(u => u.role === 'admin');
    const staffUsers = users.filter(u => u.role === 'staff');

    console.log('🔐 ROLE DISTRIBUTION:');
    console.log(`   Admin users: ${adminUsers.length}`);
    console.log(`   Staff users: ${staffUsers.length}\n`);

    // Show all users with their roles
    console.log('👤 ALL USERS:');
    users.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      const accessLevel = user.role === 'admin' ? 'Full Access' : 'Inventory Only';
      console.log(`   ${roleIcon} ${user.first_name} ${user.last_name}`);
      console.log(`      Code: ${user.login_code} | Role: ${user.role} | Access: ${accessLevel}`);
      console.log(`      Email: ${user.email || 'Not set'} | Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Verify expected admin codes
    console.log('🎯 ADMIN CODE VERIFICATION:');
    const expectedAdminCodes = ['236868', '622366', '054673', '111111', '999999'];
    expectedAdminCodes.forEach(code => {
      const user = users.find(u => u.login_code === code);
      if (user) {
        const status = user.role === 'admin' ? '✅' : '❌';
        console.log(`   ${status} Code ${code}: ${user.first_name} ${user.last_name} (${user.role})`);
      } else {
        console.log(`   ⚠️  Code ${code}: User not found`);
      }
    });

    // Verify expected staff codes
    console.log('\n📋 STAFF CODE VERIFICATION:');
    const expectedStaffCodes = ['222222', '333333'];
    expectedStaffCodes.forEach(code => {
      const user = users.find(u => u.login_code === code);
      if (user) {
        const status = user.role === 'staff' ? '✅' : '❌';
        console.log(`   ${status} Code ${code}: ${user.first_name} ${user.last_name} (${user.role})`);
      } else {
        console.log(`   ⚠️  Code ${code}: User not found`);
      }
    });

    console.log('\n🎉 Migration verification complete!');
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Test admin login with codes: 236868, 622366, 054673, 111111, 999999');
    console.log('   2. Test staff login with codes: 222222, 333333');
    console.log('   3. Verify navigation filtering works correctly');
    console.log('   4. Test user management role updates');

  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
  }
}

verifyRoleMigration().catch(console.error);

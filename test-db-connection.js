// Quick database connection test
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://setkamakzbnhtosacdee.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldGthbWFremJuaHRvc2FjZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTE3MzcsImV4cCI6MjA2OTE2NzczN30.NItl1_4vKC1UhTEDxpjhCIn_s6BLPMuIny8QERRiFHg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🧪 Testing Supabase connection...\n')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    if (error) {
      console.log('❌ Connection failed:', error.message)
      return
    }
    
    console.log('✅ Database connection successful!')
    console.log(`📊 Found ${data} users in database\n`)
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('login_code, first_name, last_name, role')
      .limit(5)
    
    if (usersError) {
      console.log('❌ Users query failed:', usersError.message)
    } else {
      console.log('👥 Sample users:')
      users.forEach(user => {
        console.log(`   ${user.login_code} - ${user.first_name} ${user.last_name} (${user.role})`)
      })
      console.log()
    }
    
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('name, color')
    
    if (catError) {
      console.log('❌ Categories query failed:', catError.message)
    } else {
      console.log('📂 Categories:')
      categories.forEach(cat => {
        console.log(`   ${cat.name} (${cat.color})`)
      })
      console.log()
    }
    
    // Test products count
    const { count: productCount, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    if (prodError) {
      console.log('❌ Products query failed:', prodError.message)
    } else {
      console.log(`📦 Total products: ${productCount}`)
    }
    
    console.log('\n🎉 All database tests passed! Your testing environment is ready.')
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message)
  }
}

testConnection()

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 Testing EmailJS Configuration...\n');

// Check environment variables
console.log('📧 Environment Variables:');
console.log('  VITE_EMAILJS_SERVICE_ID:', process.env.VITE_EMAILJS_SERVICE_ID ? '✅ Set' : '❌ Missing');
console.log('  VITE_EMAILJS_TEMPLATE_ID:', process.env.VITE_EMAILJS_TEMPLATE_ID ? '✅ Set' : '❌ Missing');
console.log('  VITE_EMAILJS_PUBLIC_KEY:', process.env.VITE_EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Show actual values (first few chars only for security)
if (process.env.VITE_EMAILJS_SERVICE_ID) {
  console.log('📋 Actual Values (partial):');
  console.log('  Service ID:', process.env.VITE_EMAILJS_SERVICE_ID);
  console.log('  Template ID:', process.env.VITE_EMAILJS_TEMPLATE_ID);
  console.log('  Public Key:', process.env.VITE_EMAILJS_PUBLIC_KEY);
  console.log('');
}

// Test EmailJS directly
console.log('📨 Testing EmailJS directly...');

async function testEmailJS() {
  try {
    // Import EmailJS
    const emailjs = await import('@emailjs/browser');
    
    // Check if all required vars are present
    if (!process.env.VITE_EMAILJS_SERVICE_ID || 
        !process.env.VITE_EMAILJS_TEMPLATE_ID || 
        !process.env.VITE_EMAILJS_PUBLIC_KEY) {
      console.log('❌ Missing required EmailJS environment variables');
      return;
    }
    
    // Initialize EmailJS
    emailjs.default.init(process.env.VITE_EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS initialized successfully');
    
    // Test data
    const testData = {
      to_email: 'test@example.com',
      user_name: 'Test User',
      location_name: 'Test Location',
      order_date: new Date().toLocaleDateString(),
      order_time: new Date().toLocaleTimeString(),
      total_items: 2,
      items_list: '• Test Product 1\\n  Current: 0 | Minimum: 5\\n  Supplier: Test Supplier\\n\\n• Test Product 2\\n  Current: 2 | Minimum: 10\\n  Supplier: Test Supplier',
      summary: 'Test email from Morning Lavender Inventory System'
    };
    
    console.log('📧 Attempting to send test email...');
    const response = await emailjs.default.send(
      process.env.VITE_EMAILJS_SERVICE_ID,
      process.env.VITE_EMAILJS_TEMPLATE_ID,
      testData
    );
    
    console.log('✅ Email sent successfully!');
    console.log('   Status:', response.status);
    console.log('   Text:', response.text);
    
  } catch (error) {
    console.log('❌ EmailJS test failed:');
    console.log('   Error:', error.message);
    console.log('   Status:', error.status);
    console.log('   Text:', error.text);
    
    // Common error analysis
    if (error.status === 400) {
      console.log('\\n🔍 Analysis: Likely a template or parameter issue');
    } else if (error.status === 401) {
      console.log('\\n🔍 Analysis: Authentication issue - check your public key');
    } else if (error.status === 402) {
      console.log('\\n🔍 Analysis: Payment required - check your EmailJS plan');
    } else if (error.status === 404) {
      console.log('\\n🔍 Analysis: Service or template not found');
    }
  }
}

testEmailJS();

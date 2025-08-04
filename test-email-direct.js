import emailjs from '@emailjs/browser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailDirectly() {
  console.log('🧪 Testing EmailJS directly...\n');
  
  // Check environment variables
  console.log('📧 Environment Variables:');
  console.log('  Service ID:', process.env.VITE_EMAILJS_SERVICE_ID);
  console.log('  Template ID:', process.env.VITE_EMAILJS_TEMPLATE_ID);
  console.log('  Public Key:', process.env.VITE_EMAILJS_PUBLIC_KEY);
  console.log('');
  
  if (!process.env.VITE_EMAILJS_SERVICE_ID || 
      !process.env.VITE_EMAILJS_TEMPLATE_ID || 
      !process.env.VITE_EMAILJS_PUBLIC_KEY) {
    console.log('❌ Missing EmailJS environment variables');
    return;
  }

  try {
    // Initialize EmailJS
    emailjs.init(process.env.VITE_EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS initialized');
    
    // Test data matching the template
    const testData = {
      to_email: 'orders@morninglavender.com',
      user_name: 'Test User',
      location_name: 'Test Location',
      order_date: new Date().toLocaleDateString(),
      order_time: new Date().toLocaleTimeString(),
      total_items: 2,
      items_list: '• Test Coffee Beans (lbs)\n  Current: 0 | Minimum: 10\n  Supplier: Test Coffee Supplier\n  Categories: Coffee\n\n• Test Milk (gallons)\n  Current: 3 | Minimum: 5\n  Supplier: Test Dairy Supplier\n  Categories: Dairy',
      summary: '2 items need restocking at Test Location',
      order_note: 'This is a test order note',
      has_note: 'yes'
    };

    console.log('📧 Sending test email...');
    console.log('   Data keys:', Object.keys(testData));
    
    const response = await emailjs.send(
      process.env.VITE_EMAILJS_SERVICE_ID,
      process.env.VITE_EMAILJS_TEMPLATE_ID,
      testData
    );

    console.log('✅ Email sent successfully!');
    console.log('   Status:', response.status);
    console.log('   Text:', response.text);
    
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log('   Error message:', error.message);
    console.log('   Status:', error.status);
    console.log('   Text:', error.text);
    console.log('   Full error:', error);
    
    // Provide helpful debugging
    if (error.status === 400) {
      console.log('\n🔍 Analysis: Bad request - likely template variable mismatch');
    } else if (error.status === 401) {
      console.log('\n🔍 Analysis: Unauthorized - check your public key');
    } else if (error.status === 402) {
      console.log('\n🔍 Analysis: Payment required - check your EmailJS plan');
    } else if (error.status === 404) {
      console.log('\n🔍 Analysis: Service or template not found');
    }
  }
}

testEmailDirectly();

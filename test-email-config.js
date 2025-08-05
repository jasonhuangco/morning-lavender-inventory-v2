// Test EmailJS Configuration and Functionality
// Run this to diagnose email issues

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailConfiguration() {
  console.log('📧 Testing EmailJS Configuration...\n');
  
  // Check environment variables
  const emailjsConfig = {
    serviceId: process.env.VITE_EMAILJS_SERVICE_ID,
    templateId: process.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY
  };

  console.log('🔧 Environment Variables:');
  console.log('   Service ID:', emailjsConfig.serviceId || '❌ MISSING');
  console.log('   Template ID:', emailjsConfig.templateId || '❌ MISSING');
  console.log('   Public Key:', emailjsConfig.publicKey ? (emailjsConfig.publicKey.substring(0, 8) + '...') : '❌ MISSING');
  console.log('');

  const missingVars = [];
  if (!emailjsConfig.serviceId) missingVars.push('VITE_EMAILJS_SERVICE_ID');
  if (!emailjsConfig.templateId) missingVars.push('VITE_EMAILJS_TEMPLATE_ID');
  if (!emailjsConfig.publicKey) missingVars.push('VITE_EMAILJS_PUBLIC_KEY');

  if (missingVars.length > 0) {
    console.log('❌ Missing EmailJS variables:', missingVars.join(', '));
    console.log('');
    console.log('🔧 To fix this:');
    console.log('1. Check your .env.local file');
    console.log('2. Verify EmailJS credentials are correct');
    console.log('3. Make sure variables start with VITE_');
    return false;
  }

  console.log('✅ All EmailJS environment variables are configured');
  console.log('');

  // Test if we can access the EmailJS service in Node.js (this will fail, but we can check the config)
  console.log('📝 EmailJS Service Configuration:');
  console.log('   Service ID:', emailjsConfig.serviceId);
  console.log('   Template ID:', emailjsConfig.templateId);
  console.log('   Public Key Preview:', emailjsConfig.publicKey.substring(0, 12) + '...');
  console.log('');

  console.log('🔍 Debugging Steps:');
  console.log('1. ✅ Environment variables are configured');
  console.log('2. 🔍 Check browser console when submitting an order');
  console.log('3. 🔍 Look for "📧 EmailJS configured" messages');
  console.log('4. 🔍 Check for "✅ Email sent successfully" or "❌ Failed to send email"');
  console.log('5. 🔍 Verify EmailJS dashboard has correct template and service');
  console.log('');

  console.log('📧 Template Variables Expected:');
  console.log('   - to_email, user_name, location_name, order_date, order_time');
  console.log('   - total_items, items_list, summary, order_note, has_note');
  console.log('');

  console.log('🎯 Most Likely Issues:');
  console.log('1. EmailJS template not configured correctly');
  console.log('2. Service not connected to email provider');
  console.log('3. Browser blocking EmailJS requests');
  console.log('4. EmailJS account limits reached');
  console.log('5. Template variables mismatch');

  return true;
}

testEmailConfiguration().catch(console.error);

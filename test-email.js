import { emailService } from './src/services/email.js';
import { config } from './src/config/env.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailFunctionality() {
  console.log('🧪 Testing Email Functionality...\n');
  
  // Check environment variables
  console.log('📧 EmailJS Configuration:');
  console.log('  Service ID:', process.env.VITE_EMAILJS_SERVICE_ID ? '✅ Set' : '❌ Missing');
  console.log('  Template ID:', process.env.VITE_EMAILJS_TEMPLATE_ID ? '✅ Set' : '❌ Missing');
  console.log('  Public Key:', process.env.VITE_EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // Test the config object
  console.log('🔧 Config Object:');
  console.log('  Service ID:', config.emailjs.serviceId || '❌ Empty');
  console.log('  Template ID:', config.emailjs.templateId || '❌ Empty');
  console.log('  Public Key:', config.emailjs.publicKey || '❌ Empty');
  console.log('');
  
  // Check if all credentials are present
  const hasAllCredentials = config.emailjs.serviceId && 
                          config.emailjs.templateId && 
                          config.emailjs.publicKey;
  
  if (!hasAllCredentials) {
    console.log('❌ Missing EmailJS credentials. Cannot send emails.');
    console.log('');
    console.log('🔧 To fix this:');
    console.log('1. Check your .env.local file has all EmailJS variables');
    console.log('2. Ensure variable names start with VITE_');
    console.log('3. Restart your development server after adding variables');
    return;
  }
  
  console.log('✅ All EmailJS credentials present');
  
  // Create mock data for testing
  const mockInventoryCount = {
    user_name: 'Test User',
    location_id: 'test-location-id',
    products: {
      'product-1': {
        quantity: 0,
        should_order: true
      },
      'product-2': {
        quantity: 3,
        should_order: true
      }
    }
  };
  
  const mockProducts = [
    {
      id: 'product-1',
      name: 'Test Coffee Beans',
      minimum_threshold: 10,
      supplier_id: 'supplier-1',
      category_id: 'category-1',
      unit: 'lbs'
    },
    {
      id: 'product-2',
      name: 'Test Milk',
      minimum_threshold: 5,
      supplier_id: 'supplier-2',
      category_id: 'category-2',
      unit: 'gallons'
    }
  ];
  
  const mockLocations = [
    {
      id: 'test-location-id',
      name: 'Test Café Location'
    }
  ];
  
  const mockCategories = [
    {
      id: 'category-1',
      name: 'Coffee'
    },
    {
      id: 'category-2',
      name: 'Dairy'
    }
  ];
  
  const mockSuppliers = [
    {
      id: 'supplier-1',
      name: 'Test Coffee Supplier'
    },
    {
      id: 'supplier-2',
      name: 'Test Dairy Supplier'
    }
  ];
  
  // Test sending email
  try {
    console.log('📨 Testing email send...');
    const result = await emailService.sendOrderEmail(
      mockInventoryCount,
      mockProducts,
      mockLocations,
      mockCategories,
      mockSuppliers
    );
    
    console.log('✅ Email sent successfully!');
    console.log('   Response:', result);
    
  } catch (error) {
    console.log('❌ Email sending failed:');
    console.log('   Error:', error.message);
    console.log('   Details:', error);
  }
}

testEmailFunctionality();

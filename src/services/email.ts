import emailjs from '@emailjs/browser';
import { config } from '../config/env';
import { InventoryCount, Product, Location, Category, Supplier } from '../types';

// Initialize EmailJS
let isInitialized = false;

const initializeEmailJS = () => {
  console.log('🔧 Initializing EmailJS...', {
    isInitialized,
    hasPublicKey: !!config.emailjs.publicKey,
    publicKeyPreview: config.emailjs.publicKey ? config.emailjs.publicKey.substring(0, 5) + '...' : 'none'
  });
  
  if (!isInitialized && config.emailjs.publicKey) {
    emailjs.init(config.emailjs.publicKey);
    isInitialized = true;
    console.log('✅ EmailJS initialized successfully');
  } else if (!config.emailjs.publicKey) {
    console.log('❌ EmailJS public key missing');
  } else {
    console.log('ℹ️ EmailJS already initialized');
  }
};

export const emailService = {
  async sendOrderEmail(
    inventoryCount: InventoryCount,
    products: Product[],
    locations: Location[],
    categories: Category[],
    suppliers: Supplier[]
  ) {
    // Check if EmailJS is configured
    if (!config.emailjs.serviceId || !config.emailjs.templateId || !config.emailjs.publicKey) {
      console.log('❌ EmailJS not configured. Missing credentials:', {
        serviceId: !!config.emailjs.serviceId,
        templateId: !!config.emailjs.templateId,
        publicKey: !!config.emailjs.publicKey
      });
      
      // Always return success when credentials are missing instead of throwing error
      // This allows orders to be saved even without email configuration
      console.log('📧 Email disabled - no credentials provided. Order will still be saved.');
      return { success: false, message: 'Email disabled - no credentials provided' };
    }

    console.log('📧 EmailJS configured, attempting to send email...');
    console.log('📧 Config values:', {
      serviceId: config.emailjs.serviceId,
      templateId: config.emailjs.templateId,
      publicKey: config.emailjs.publicKey.substring(0, 5) + '...'
    });
    
    initializeEmailJS();

    // Find location name
    const location = locations.find(l => l.id === inventoryCount.location_id);
    
    // Prepare items that need ordering
    const itemsToOrder = Object.entries(inventoryCount.products)
      .filter(([_, data]) => data.should_order)
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        const supplier = suppliers.find(s => s.id === product?.supplier_id);
        const productCategories = product?.category_id ? 
          [categories.find(c => c.id === product.category_id)?.name || ''] : [];

        return {
          name: product?.name || '',
          currentQuantity: data.quantity,
          minimumThreshold: product?.minimum_threshold || 0,
          supplier: supplier?.name || '',
          categories: productCategories.join(', '),
          unit: product?.unit || ''
        };
      });

    // Create email content
    const now = new Date();
    const pstDate = now.toLocaleDateString('en-US', { 
      timeZone: 'America/Los_Angeles',
      month: 'long',
      day: 'numeric', 
      year: 'numeric'
    });
    const pstTime = now.toLocaleTimeString('en-US', { 
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const emailData = {
      to_email: 'orders@morninglavender.com', // Replace with actual email
      user_name: inventoryCount.user_name,
      location_name: location?.name || 'Unknown Location',
      order_date: pstDate,
      order_time: pstTime,
      total_items: itemsToOrder.length,
      order_note: inventoryCount.notes || '', // Add the order note
      has_note: inventoryCount.notes ? 'yes' : 'no', // Helper for conditional display
      
      // Create formatted list of items
      items_list: itemsToOrder.map(item => 
        `• ${item.name}${item.unit ? ` (${item.unit})` : ''}\n` +
        `  Current: ${item.currentQuantity} ${item.unit} | Minimum: ${item.minimumThreshold} ${item.unit}\n` +
        `  Supplier: ${item.supplier}\n` +
        `  Categories: ${item.categories}\n`
      ).join('\n'),
      
      // Summary for email subject/header
      summary: `${itemsToOrder.length} items need restocking at ${location?.name || 'Unknown Location'}`
    };

    console.log('📧 Email data prepared:', {
      serviceId: config.emailjs.serviceId,
      templateId: config.emailjs.templateId,
      itemCount: itemsToOrder.length,
      location: location?.name,
      emailDataKeys: Object.keys(emailData),
      emailDataSample: {
        user_name: emailData.user_name,
        location_name: emailData.location_name,
        total_items: emailData.total_items,
        summary: emailData.summary,
        itemsListPreview: emailData.items_list.substring(0, 100) + '...'
      }
    });

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('⚠️ EmailJS requires browser environment, skipping email send');
      return { success: true, message: 'Email skipped - not in browser environment' };
    }

    try {
      console.log('📧 Attempting to send email via EmailJS...');
      const response = await emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        emailData
      );

      console.log('✅ Email sent successfully:', response);
      
      return {
        success: true,
        message: 'Order email sent successfully',
        response
      };
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);
      console.error('   Error details:', {
        message: error?.message,
        status: error?.status,
        text: error?.text,
        name: error?.name,
        stack: error?.stack,
        fullError: JSON.stringify(error, null, 2)
      });
      
      // More specific error message
      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.text) {
        errorMessage = error.text;
      } else if (error?.status) {
        errorMessage = `EmailJS error ${error.status}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = `EmailJS error: ${JSON.stringify(error)}`;
      }
      
      throw new Error(`Failed to send order email: ${errorMessage}`);
    }
  },

  // Simple test with minimal data
  async sendSimpleTest() {
    if (!config.emailjs.serviceId || !config.emailjs.templateId || !config.emailjs.publicKey) {
      return { success: false, message: 'EmailJS credentials not configured' };
    }

    initializeEmailJS();

    // Minimal test data
    const simpleData = {
      to_email: 'test@morninglavender.com',
      user_name: 'Test User',
      message: 'This is a simple test email from Morning Lavender Inventory System'
    };

    console.log('📧 Sending simple test email...');
    console.log('   Data:', simpleData);

    try {
      const response = await emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        simpleData
      );

      console.log('✅ Simple test email sent successfully:', response);
      return {
        success: true,
        message: 'Simple test email sent successfully',
        response
      };
    } catch (error: any) {
      console.error('❌ Simple test email failed:', error);
      console.error('   Full error:', JSON.stringify(error, null, 2));
      throw new Error(`Simple test failed: ${error?.message || error?.text || JSON.stringify(error)}`);
    }
  },

  // Test email functionality
  async sendTestEmail(userEmail: string) {
    if (!config.emailjs.serviceId || !config.emailjs.templateId || !config.emailjs.publicKey) {
      return { success: false, message: 'EmailJS credentials not configured' };
    }

    initializeEmailJS();

    const testData = {
      to_email: userEmail,
      user_name: 'Test User',
      location_name: 'Test Location',
      order_date: new Date().toLocaleDateString(),
      order_time: new Date().toLocaleTimeString(),
      total_items: 2,
      items_list: '• Test Product 1\n  Current: 0 | Minimum: 5\n  Supplier: Test Supplier\n\n• Test Product 2\n  Current: 2 | Minimum: 10\n  Supplier: Test Supplier',
      summary: 'Test email from Morning Lavender Inventory System'
    };

    try {
      const response = await emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        testData
      );

      return {
        success: true,
        message: 'Test email sent successfully',
        response
      };
    } catch (error) {
      console.error('Failed to send test email:', error);
      throw new Error(`Failed to send test email: ${error}`);
    }
  }
};

import emailjs from '@emailjs/browser';
import { config, isDevelopment } from '../config/env';
import { InventoryCount, Product, Location, Category, Supplier } from '../types';

// Initialize EmailJS
let isInitialized = false;

const initializeEmailJS = () => {
  if (!isInitialized && config.emailjs.publicKey) {
    emailjs.init(config.emailjs.publicKey);
    isInitialized = true;
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
    if (!config.emailjs.serviceId || !config.emailjs.templateId || !config.emailjs.publicKey) {
      if (isDevelopment) {
        console.log('EmailJS not configured. Order email would be sent:', {
          user: inventoryCount.user_name,
          location: inventoryCount.location_id,
          itemsToOrder: Object.keys(inventoryCount.products).length
        });
        return { success: true, message: 'Email simulation (dev mode)' };
      }
      throw new Error('EmailJS credentials are required');
    }

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
    const emailData = {
      to_email: 'orders@morninglavender.com', // Replace with actual email
      user_name: inventoryCount.user_name,
      location_name: location?.name || 'Unknown Location',
      order_date: new Date().toLocaleDateString(),
      order_time: new Date().toLocaleTimeString(),
      total_items: itemsToOrder.length,
      
      // Create formatted list of items
      items_list: itemsToOrder.map(item => 
        `• ${item.name}${item.unit ? ` (${item.unit})` : ''}\n` +
        `  Current: ${item.currentQuantity} | Minimum: ${item.minimumThreshold}\n` +
        `  Supplier: ${item.supplier}\n` +
        `  Categories: ${item.categories}\n`
      ).join('\n'),
      
      // Summary for email subject/header
      summary: `${itemsToOrder.length} items need restocking at ${location?.name || 'Unknown Location'}`
    };

    try {
      const response = await emailjs.send(
        config.emailjs.serviceId,
        config.emailjs.templateId,
        emailData
      );

      return {
        success: true,
        message: 'Order email sent successfully',
        response
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send order email: ${error}`);
    }
  },

  // Test email functionality
  async sendTestEmail(userEmail: string) {
    if (!config.emailjs.serviceId || !config.emailjs.templateId || !config.emailjs.publicKey) {
      throw new Error('EmailJS credentials are required');
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

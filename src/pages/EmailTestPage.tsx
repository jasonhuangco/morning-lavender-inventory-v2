import { useState } from 'react';
import { emailService } from '../services/email';

export default function EmailTestPage() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSimpleEmail = async () => {
    setIsLoading(true);
    setStatus('Testing simple email...');

    try {
      const result = await emailService.sendSimpleTest();
      setStatus(`✅ Simple email sent successfully! Response: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setStatus(`❌ Simple email failed: ${error.message}`);
      console.error('Simple email test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testEmail = async () => {
    setIsLoading(true);
    setStatus('Testing email...');

    try {
      // Create mock data
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
          unit: 'lbs',
          created_at: '',
          updated_at: '',
          sort_order: 0,
          description: '',
          cost: 0,
          checkbox_only: false,
          hidden: false
        },
        {
          id: 'product-2',
          name: 'Test Milk',
          minimum_threshold: 5,
          supplier_id: 'supplier-2',
          category_id: 'category-2',
          unit: 'gallons',
          created_at: '',
          updated_at: '',
          sort_order: 0,
          description: '',
          cost: 0,
          checkbox_only: false,
          hidden: false
        }
      ];

      const mockLocations = [
        {
          id: 'test-location-id',
          name: 'Test Café Location',
          address: '',
          created_at: '',
          updated_at: '',
          sort_order: 0
        }
      ];

      const mockCategories = [
        {
          id: 'category-1',
          name: 'Coffee',
          color: '#8B4513',
          created_at: '',
          updated_at: '',
          sort_order: 0
        },
        {
          id: 'category-2',
          name: 'Dairy',
          color: '#FFD700',
          created_at: '',
          updated_at: '',
          sort_order: 0
        }
      ];

      const mockSuppliers = [
        {
          id: 'supplier-1',
          name: 'Test Coffee Supplier',
          contact_info: '',
          email: '',
          phone: '',
          created_at: '',
          updated_at: '',
          sort_order: 0
        },
        {
          id: 'supplier-2',
          name: 'Test Dairy Supplier',
          contact_info: '',
          email: '',
          phone: '',
          created_at: '',
          updated_at: '',
          sort_order: 0
        }
      ];

      const result = await emailService.sendOrderEmail(
        mockInventoryCount,
        mockProducts,
        mockLocations,
        mockCategories,
        mockSuppliers
      );

      setStatus(`✅ Email sent successfully! Response: ${JSON.stringify(result)}`);
    } catch (error: any) {
      setStatus(`❌ Email failed: ${error.message}`);
      console.error('Email test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📧 Email Test Page</h1>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          This page tests the email functionality. Click the button below to send a test order email.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={testSimpleEmail}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-4"
          >
            {isLoading ? 'Sending...' : 'Send Simple Test'}
          </button>
          
          <button
            onClick={testEmail}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Full Order Test'}
          </button>
        </div>
        
        {status && (
          <div className="p-4 bg-gray-100 rounded-md">
            <p className="text-sm font-mono whitespace-pre-wrap">{status}</p>
          </div>
        )}
        
        <div className="text-sm text-gray-500">
          <p><strong>Note:</strong> This will send a real email if EmailJS is configured correctly.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </div>
    </div>
  );
}

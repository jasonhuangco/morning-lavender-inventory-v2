import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Target,
  Activity
} from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

interface OrderAnalytics {
  productOrderRates: ProductOrderRate[];
  locationCosts: LocationCost[];
  slowMovers: SlowMover[];
  fastMovers: FastMover[];
  orderFrequency: OrderFrequency[];
  categoryAnalysis: CategoryAnalysis[];
  supplierPerformance: SupplierPerformance[];
  seasonalTrends: SeasonalTrend[];
  inventoryHealth: InventoryHealth;
}

interface ProductOrderRate {
  product_id: string;
  product_name: string;
  category_name: string;
  supplier_name: string;
  total_orders: number;
  total_quantity_ordered: number;
  avg_quantity_per_order: number;
  last_ordered: string;
  days_since_last_order: number;
  order_frequency_days: number;
  minimum_threshold: number;
  cost_per_unit: number;
  total_cost: number;
}

interface LocationCost {
  location_id: string;
  location_name: string;
  total_orders: number;
  total_cost: number;
  avg_order_cost: number;
  most_ordered_category: string;
  most_expensive_product: string;
  order_frequency_days: number;
}

interface SlowMover {
  product_id: string;
  product_name: string;
  category_name: string;
  days_since_last_order: number;
  total_lifetime_orders: number;
  minimum_threshold: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface FastMover {
  product_id: string;
  product_name: string;
  category_name: string;
  order_frequency_days: number;
  total_quantity_ordered: number;
  avg_quantity_per_order: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface OrderFrequency {
  location_name: string;
  category_name: string;
  avg_days_between_orders: number;
  predictive_next_order: string;
  consistency_score: number;
}

interface CategoryAnalysis {
  category_name: string;
  total_products: number;
  total_orders: number;
  total_cost: number;
  avg_cost_per_product: number;
  top_location: string;
  seasonal_factor: number;
}

interface SupplierPerformance {
  supplier_name: string;
  total_products: number;
  total_orders: number;
  total_cost: number;
  avg_order_value: number;
  most_ordered_product: string;
  diversification_score: number;
}

interface SeasonalTrend {
  month: string;
  total_orders: number;
  total_cost: number;
  top_category: string;
  growth_rate: number;
}

interface InventoryHealth {
  total_active_products: number;
  products_never_ordered: number;
  products_overdue: number;
  products_at_risk: number;
  avg_order_frequency: number;
  total_monthly_cost: number;
  efficiency_score: number;
}

export default function AnalyticsPage() {
  const { locations, products } = useInventory();
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30'); // days
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange, selectedLocation]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      // Get orders with related data for the selected time range
      const daysAgo = parseInt(selectedTimeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      let query = supabase
        .from('orders')
        .select(`
          *,
          locations(id, name),
          order_items(
            *,
            products(
              id, name, minimum_threshold, cost, category_id, supplier_id,
              categories(id, name),
              suppliers(id, name)
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('Error loading analytics:', error);
        return;
      }

      // Process analytics data
      const analyticsData = processAnalyticsData(orders || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (orders: any[]): OrderAnalytics => {
    // Product Order Rates
    const productStats = new Map();
    
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id;
        const product = item.products;
        
        if (!productStats.has(productId)) {
          productStats.set(productId, {
            product_id: productId,
            product_name: product?.name || 'Unknown',
            category_name: product?.categories?.name || 'Unknown',
            supplier_name: product?.suppliers?.name || 'Unknown',
            total_orders: 0,
            total_quantity_ordered: 0,
            minimum_threshold: product?.minimum_threshold || 0,
            cost_per_unit: product?.cost || 0,
            order_dates: []
          });
        }
        
        const stats = productStats.get(productId);
        stats.total_orders++;
        stats.total_quantity_ordered += item.quantity || 0;
        stats.order_dates.push(new Date(order.created_at));
      });
    });

    const productOrderRates: ProductOrderRate[] = Array.from(productStats.values()).map(stats => {
      const orderDates = stats.order_dates.sort((a: Date, b: Date) => b.getTime() - a.getTime());
      const lastOrdered = orderDates[0];
      const daysSinceLastOrder = lastOrdered ? Math.floor((Date.now() - lastOrdered.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      // Calculate average days between orders
      let avgDaysBetween = 0;
      if (orderDates.length > 1) {
        const totalDays = (orderDates[0].getTime() - orderDates[orderDates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
        avgDaysBetween = totalDays / (orderDates.length - 1);
      }

      return {
        ...stats,
        avg_quantity_per_order: stats.total_quantity_ordered / stats.total_orders,
        last_ordered: lastOrdered ? lastOrdered.toISOString() : '',
        days_since_last_order: daysSinceLastOrder,
        order_frequency_days: avgDaysBetween,
        total_cost: stats.total_quantity_ordered * stats.cost_per_unit
      };
    });

    // Location Costs
    const locationStats = new Map();
    orders.forEach(order => {
      const locationId = order.location_id;
      const locationName = order.locations?.name || 'Unknown';
      
      if (!locationStats.has(locationId)) {
        locationStats.set(locationId, {
          location_id: locationId,
          location_name: locationName,
          total_orders: 0,
          total_cost: 0,
          order_dates: [],
          categories: new Map(),
          products: new Map()
        });
      }
      
      const stats = locationStats.get(locationId);
      stats.total_orders++;
      stats.order_dates.push(new Date(order.created_at));
      
      order.order_items?.forEach((item: any) => {
        const cost = (item.quantity || 0) * (item.products?.cost || 0);
        stats.total_cost += cost;
        
        const category = item.products?.categories?.name || 'Unknown';
        stats.categories.set(category, (stats.categories.get(category) || 0) + cost);
        
        const product = item.products?.name || 'Unknown';
        stats.products.set(product, (stats.products.get(product) || 0) + cost);
      });
    });

    const locationCosts: LocationCost[] = Array.from(locationStats.values()).map(stats => {
      const categoryEntries = Array.from(stats.categories.entries()) as [string, number][];
      const mostOrderedCategory = categoryEntries
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
      
      const productEntries = Array.from(stats.products.entries()) as [string, number][];
      const mostExpensiveProduct = productEntries
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      const orderDates = stats.order_dates.sort((a: Date, b: Date) => b.getTime() - a.getTime());
      let avgDaysBetween = 0;
      if (orderDates.length > 1) {
        const totalDays = (orderDates[0].getTime() - orderDates[orderDates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
        avgDaysBetween = totalDays / (orderDates.length - 1);
      }

      return {
        location_id: stats.location_id,
        location_name: stats.location_name,
        total_orders: stats.total_orders,
        total_cost: stats.total_cost,
        avg_order_cost: stats.total_cost / stats.total_orders,
        most_ordered_category: mostOrderedCategory,
        most_expensive_product: mostExpensiveProduct,
        order_frequency_days: avgDaysBetween
      };
    });

    // Slow and Fast Movers
    const slowMovers: SlowMover[] = productOrderRates
      .filter(p => p.days_since_last_order > 14)
      .map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        category_name: p.category_name,
        days_since_last_order: p.days_since_last_order,
        total_lifetime_orders: p.total_orders,
        minimum_threshold: p.minimum_threshold,
        risk_level: (p.days_since_last_order > 60 ? 'high' : p.days_since_last_order > 30 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
      }))
      .sort((a, b) => b.days_since_last_order - a.days_since_last_order);

    const fastMovers: FastMover[] = productOrderRates
      .filter(p => p.order_frequency_days > 0 && p.order_frequency_days < 7)
      .map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        category_name: p.category_name,
        order_frequency_days: p.order_frequency_days,
        total_quantity_ordered: p.total_quantity_ordered,
        avg_quantity_per_order: p.avg_quantity_per_order,
        trend: 'stable' as 'increasing' | 'stable' | 'decreasing'
      }))
      .sort((a, b) => a.order_frequency_days - b.order_frequency_days);

    // Category Analysis
    const categoryStats = new Map();
    productOrderRates.forEach(product => {
      const category = product.category_name;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          category_name: category,
          total_products: 0,
          total_orders: 0,
          total_cost: 0,
          locations: new Map()
        });
      }
      
      const stats = categoryStats.get(category);
      stats.total_products++;
      stats.total_orders += product.total_orders;
      stats.total_cost += product.total_cost;
    });

    const categoryAnalysis: CategoryAnalysis[] = Array.from(categoryStats.values()).map(stats => ({
      category_name: stats.category_name,
      total_products: stats.total_products,
      total_orders: stats.total_orders,
      total_cost: stats.total_cost,
      avg_cost_per_product: stats.total_cost / stats.total_products,
      top_location: 'Various', // Could be enhanced with location tracking
      seasonal_factor: 1.0
    }));

    // Supplier Performance
    const supplierStats = new Map();
    productOrderRates.forEach(product => {
      const supplier = product.supplier_name;
      if (!supplierStats.has(supplier)) {
        supplierStats.set(supplier, {
          supplier_name: supplier,
          total_products: 0,
          total_orders: 0,
          total_cost: 0,
          products: new Map()
        });
      }
      
      const stats = supplierStats.get(supplier);
      stats.total_products++;
      stats.total_orders += product.total_orders;
      stats.total_cost += product.total_cost;
      stats.products.set(product.product_name, product.total_orders);
    });

    const supplierPerformance: SupplierPerformance[] = Array.from(supplierStats.values()).map(stats => {
      const productEntries = Array.from(stats.products.entries()) as [string, number][];
      return {
        supplier_name: stats.supplier_name,
        total_products: stats.total_products,
        total_orders: stats.total_orders,
        total_cost: stats.total_cost,
        avg_order_value: stats.total_cost / stats.total_orders,
        most_ordered_product: productEntries
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None',
        diversification_score: stats.total_products / Math.max(stats.total_orders, 1)
      };
    });

    // Inventory Health
    const totalActiveProducts = productOrderRates.length;
    const totalProducts = products.length;
    const productsNeverOrdered = totalProducts - totalActiveProducts;
    const productsOverdue = slowMovers.filter(p => p.days_since_last_order > 30).length;
    const productsAtRisk = slowMovers.filter(p => p.risk_level === 'high').length;
    const avgOrderFreq = productOrderRates.reduce((sum, p) => sum + p.order_frequency_days, 0) / productOrderRates.length;
    const totalMonthlyCost = locationCosts.reduce((sum, l) => sum + l.total_cost, 0);
    const efficiencyScore = Math.max(0, 100 - (productsNeverOrdered / totalProducts * 100));

    const inventoryHealth: InventoryHealth = {
      total_active_products: totalActiveProducts,
      products_never_ordered: productsNeverOrdered,
      products_overdue: productsOverdue,
      products_at_risk: productsAtRisk,
      avg_order_frequency: avgOrderFreq,
      total_monthly_cost: totalMonthlyCost,
      efficiency_score: efficiencyScore
    };

    return {
      productOrderRates: productOrderRates.sort((a, b) => b.total_orders - a.total_orders),
      locationCosts: locationCosts.sort((a, b) => b.total_cost - a.total_cost),
      slowMovers,
      fastMovers,
      orderFrequency: [], // Placeholder
      categoryAnalysis: categoryAnalysis.sort((a, b) => b.total_cost - a.total_cost),
      supplierPerformance: supplierPerformance.sort((a, b) => b.total_cost - a.total_cost),
      seasonalTrends: [], // Placeholder
      inventoryHealth
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">No Data Available</h2>
          <p className="text-gray-600">No orders found for the selected time period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 Inventory Analytics</h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'products', name: 'Product Analysis', icon: Package },
                { id: 'locations', name: 'Location Performance', icon: MapPin },
                { id: 'suppliers', name: 'Supplier Analysis', icon: Target },
                { id: 'health', name: 'Inventory Health', icon: Activity }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Products</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.inventoryHealth.total_active_products}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Spend</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(analytics.inventoryHealth.total_monthly_cost)}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Frequency</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.inventoryHealth.avg_order_frequency.toFixed(1)} days</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Efficiency Score</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.inventoryHealth.efficiency_score.toFixed(1)}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Categories by Spend</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {analytics.categoryAnalysis.slice(0, 5).map((category, index) => (
                    <div key={category.category_name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">#{index + 1}</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{category.category_name}</p>
                          <p className="text-sm text-gray-500">{category.total_products} products</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(category.total_cost)}</p>
                        <p className="text-sm text-gray-500">{category.total_orders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Fast & Slow Movers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fast Movers */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Fast Movers
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.fastMovers.slice(0, 5).map(product => (
                      <div key={product.product_id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-sm text-gray-500">{product.category_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">Every {product.order_frequency_days.toFixed(1)} days</p>
                          <p className="text-sm text-gray-500">{product.total_quantity_ordered} total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slow Movers */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Slow Movers
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.slowMovers.slice(0, 5).map(product => (
                      <div key={product.product_id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-sm text-gray-500">{product.category_name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            product.risk_level === 'high' ? 'text-red-600' : 
                            product.risk_level === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                          }`}>
                            {product.days_since_last_order} days ago
                          </p>
                          <p className="text-sm text-gray-500">{product.total_lifetime_orders} lifetime orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Order Rates */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Product Order Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Ordered</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.productOrderRates.slice(0, 10).map(product => (
                      <tr key={product.product_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                            <div className="text-sm text-gray-500">{product.category_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.total_orders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.avg_quantity_per_order.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.order_frequency_days > 0 ? `${product.order_frequency_days.toFixed(1)} days` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.total_cost)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.last_ordered ? formatDate(product.last_ordered) : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Location Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Frequency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.locationCosts.map(location => (
                    <tr key={location.location_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location.location_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.total_orders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(location.total_cost)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(location.avg_order_cost)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location.most_ordered_category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.order_frequency_days > 0 ? `${location.order_frequency_days.toFixed(1)} days` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Supplier Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Product</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.supplierPerformance.map(supplier => (
                    <tr key={supplier.supplier_name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.supplier_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.total_products}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.total_orders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(supplier.total_cost)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(supplier.avg_order_value)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.most_ordered_product}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className={`h-8 w-8 ${
                      analytics.inventoryHealth.products_at_risk > 10 ? 'text-red-600' : 
                      analytics.inventoryHealth.products_at_risk > 5 ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">At-Risk Products</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.inventoryHealth.products_at_risk}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Never Ordered</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.inventoryHealth.products_never_ordered}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Overdue Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.inventoryHealth.products_overdue}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Health Score</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${
                        analytics.inventoryHealth.efficiency_score >= 80 ? 'bg-green-500' :
                        analytics.inventoryHealth.efficiency_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analytics.inventoryHealth.efficiency_score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {analytics.inventoryHealth.efficiency_score.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Based on product utilization, order frequency, and inventory turnover
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

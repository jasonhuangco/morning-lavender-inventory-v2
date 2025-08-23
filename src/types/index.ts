export interface User {
  id: string;
  first_name: string;
  last_name: string;
  login_code: string;
  email?: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  assigned_categories?: string[]; // Array of category IDs this user can access
  created_at: string;
  updated_at: string;
}

export interface BrandingSettings {
  id: string;
  company_name: string;
  logo_url?: string;
  icon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info?: string;
  email?: string;
  phone?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Junction table types for many-to-many relationships
export interface ProductCategory {
  id: string;
  product_id: string;
  category_id: string;
  is_primary: boolean;
  created_at: string;
  category?: Category; // Populated via joins
}

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  is_primary: boolean;
  cost_override?: number;
  created_at: string;
  supplier?: Supplier; // Populated via joins
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  unit: string;
  cost?: number;
  minimum_threshold: number;
  checkbox_only: boolean;
  hidden: boolean; // Whether this product is hidden from inventory lists
  current_quantity?: number; // This will come from inventory_counts
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Many-to-many relationships
  product_categories?: ProductCategory[]; // All categories for this product
  product_suppliers?: ProductSupplier[]; // All suppliers for this product
  // Convenience properties for backward compatibility
  category_id?: string; // Primary category ID
  supplier_id?: string; // Primary supplier ID
  primary_category?: Category; // Primary category object
  primary_supplier?: Supplier; // Primary supplier object
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity_ordered: number; // Actually the counted quantity (what was counted during inventory)
  current_quantity: number; // Same as quantity_ordered - the counted quantity  
  minimum_threshold: number;
  checkbox_only: boolean; // Whether this item is checkbox-only
  unit: string; // The unit of measurement for the product
  supplier_name: string;
  category_names: string[];
  needs_ordering?: boolean; // Whether this item was flagged for ordering
  was_actually_counted?: boolean; // Whether this item was actually counted (not just a checkbox-only item that wasn't checked)
  ordered_status?: boolean; // Whether this item has been marked as ordered/purchased
  ordered_by?: string; // Who marked this item as ordered
  ordered_at?: string; // When this item was marked as ordered
}

export interface Order {
  id: string;
  user_name: string;
  location_id: string;
  location_name: string;
  items: OrderItem[];
  status: 'draft' | 'pending' | 'completed';
  archived: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryCount {
  location_id: string;
  user_name: string;
  notes?: string;
  products: {
    [productId: string]: {
      quantity: number;
      should_order: boolean;
    };
  };
}

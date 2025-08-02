export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
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

export interface Product {
  id: string;
  name: string;
  description?: string;
  unit: string;
  cost?: number;
  minimum_threshold: number;
  checkbox_only: boolean;
  hidden: boolean; // Whether this product is hidden from inventory lists
  category_id?: string;
  supplier_id?: string;
  current_quantity?: number; // This will come from inventory_counts
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity_ordered: number; // Actually the counted quantity (what was counted during inventory)
  current_quantity: number; // Same as quantity_ordered - the counted quantity  
  minimum_threshold: number;
  checkbox_only: boolean; // Whether this item is checkbox-only
  supplier_name: string;
  category_names: string[];
}

export interface Order {
  id: string;
  user_name: string;
  location_id: string;
  location_name: string;
  items: OrderItem[];
  status: 'draft' | 'submitted';
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

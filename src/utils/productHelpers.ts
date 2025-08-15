import { Product, Category, Supplier } from '../types';

/**
 * Helper functions for working with the new many-to-many product relationships
 */

/**
 * Get the primary category for a product (for backward compatibility)
 */
export const getPrimaryCategory = (product: Product, categories: Category[]): Category | null => {
  // First try the new structure
  if (product.primary_category) {
    return product.primary_category;
  }
  
  if (product.product_categories && product.product_categories.length > 0) {
    const primaryCategoryRelation = product.product_categories.find(pc => pc.is_primary);
    if (primaryCategoryRelation) {
      return primaryCategoryRelation.category || 
             categories.find(c => c.id === primaryCategoryRelation.category_id) || 
             null;
    }
    // If no primary is marked, use the first one
    const firstRelation = product.product_categories[0];
    return firstRelation.category || 
           categories.find(c => c.id === firstRelation.category_id) || 
           null;
  }
  
  // Fallback to old structure
  if (product.category_id) {
    return categories.find(c => c.id === product.category_id) || null;
  }
  
  return null;
};

/**
 * Get the primary supplier for a product (for backward compatibility)
 */
export const getPrimarySupplier = (product: Product, suppliers: Supplier[]): Supplier | null => {
  // First try the new structure
  if (product.primary_supplier) {
    return product.primary_supplier;
  }
  
  if (product.product_suppliers && product.product_suppliers.length > 0) {
    const primarySupplierRelation = product.product_suppliers.find(ps => ps.is_primary);
    if (primarySupplierRelation) {
      return primarySupplierRelation.supplier || 
             suppliers.find(s => s.id === primarySupplierRelation.supplier_id) || 
             null;
    }
    // If no primary is marked, use the first one
    const firstRelation = product.product_suppliers[0];
    return firstRelation.supplier || 
           suppliers.find(s => s.id === firstRelation.supplier_id) || 
           null;
  }
  
  // Fallback to old structure
  if (product.supplier_id) {
    return suppliers.find(s => s.id === product.supplier_id) || null;
  }
  
  return null;
};

/**
 * Get all categories for a product
 */
export const getProductCategories = (product: Product, categories: Category[]): Category[] => {
  if (product.product_categories && product.product_categories.length > 0) {
    return product.product_categories
      .map(pc => pc.category || categories.find(c => c.id === pc.category_id))
      .filter((cat): cat is Category => cat !== undefined);
  }
  
  // Fallback to old structure
  if (product.category_id) {
    const category = categories.find(c => c.id === product.category_id);
    return category ? [category] : [];
  }
  
  return [];
};

/**
 * Get all suppliers for a product
 */
export const getProductSuppliers = (product: Product, suppliers: Supplier[]): Array<{ supplier: Supplier; cost_override?: number; is_primary: boolean }> => {
  if (product.product_suppliers && product.product_suppliers.length > 0) {
    const validSuppliers: Array<{ supplier: Supplier; cost_override?: number; is_primary: boolean }> = [];
    
    for (const ps of product.product_suppliers) {
      const supplier = ps.supplier || suppliers.find(s => s.id === ps.supplier_id);
      if (supplier) {
        validSuppliers.push({
          supplier,
          cost_override: ps.cost_override,
          is_primary: ps.is_primary
        });
      }
    }
    
    return validSuppliers;
  }
  
  // Fallback to old structure
  if (product.supplier_id) {
    const supplier = suppliers.find(s => s.id === product.supplier_id);
    return supplier ? [{ supplier, is_primary: true }] : [];
  }
  
  return [];
};

/**
 * Check if a product matches any of the given category IDs
 */
export const productMatchesCategories = (product: Product, categoryIds: string[]): boolean => {
  // Check new structure first
  if (product.product_categories && product.product_categories.length > 0) {
    return product.product_categories.some(pc => categoryIds.includes(pc.category_id));
  }
  
  // Fallback to old structure
  if (product.category_id) {
    return categoryIds.includes(product.category_id);
  }
  
  return false;
};

/**
 * Check if a user has access to a product based on their assigned categories
 */
export const userCanAccessProduct = (product: Product, userCategoryIds?: string[]): boolean => {
  if (!userCategoryIds || userCategoryIds.length === 0) {
    return true; // User has access to all categories
  }
  
  return productMatchesCategories(product, userCategoryIds);
};

/**
 * Get the effective cost for a product from a specific supplier
 */
export const getProductCostFromSupplier = (product: Product, supplierId: string): number | undefined => {
  if (product.product_suppliers && product.product_suppliers.length > 0) {
    const supplierRelation = product.product_suppliers.find(ps => ps.supplier_id === supplierId);
    if (supplierRelation && supplierRelation.cost_override !== null && supplierRelation.cost_override !== undefined) {
      return supplierRelation.cost_override;
    }
  }
  
  return product.cost;
};

/**
 * Create form data for product editing that includes multiple categories/suppliers
 */
export interface ProductFormData {
  name: string;
  description: string;
  unit: string;
  cost: number;
  minimum_threshold: number;
  checkbox_only: boolean;
  hidden: boolean;
  sort_order: number;
  categories: Array<{ id: string; is_primary: boolean }>;
  suppliers: Array<{ id: string; is_primary: boolean; cost_override?: number }>;
}

/**
 * Convert a product to form data for editing
 */
export const productToFormData = (product: Product): ProductFormData => {
  const categories = product.product_categories?.map(pc => ({
    id: pc.category_id,
    is_primary: pc.is_primary
  })) || (product.category_id ? [{ id: product.category_id, is_primary: true }] : []);
  
  const suppliers = product.product_suppliers?.map(ps => ({
    id: ps.supplier_id,
    is_primary: ps.is_primary,
    cost_override: ps.cost_override
  })) || (product.supplier_id ? [{ id: product.supplier_id, is_primary: true }] : []);
  
  return {
    name: product.name || '',
    description: product.description || '',
    unit: product.unit || '',
    cost: product.cost || 0,
    minimum_threshold: product.minimum_threshold || 1,
    checkbox_only: product.checkbox_only || false,
    hidden: product.hidden || false,
    sort_order: product.sort_order || 0,
    categories,
    suppliers
  };
};

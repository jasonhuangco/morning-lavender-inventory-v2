# Purchase Tracking Enhancement - Feature Specification

## Overview
Enhancement to add comprehensive purchase order tracking to the Morning Lavender Inventory Management System, enabling accurate cost analysis and reordering spend tracking.

## Current Limitation
- System tracks **inventory counts** (what you have in stock)
- System does NOT track **purchase quantities** (what you actually buy to restock)
- Analytics show "counted value" but not "actual spending"

## Proposed Solution
Add purchase order management system to track actual purchases and spending.

## Key Features to Implement

### 1. Database Schema Changes
```sql
-- New tables needed:
- purchase_orders (PO header information)
- purchase_order_items (individual product purchases)
- Link order_items to purchase_order_items
```

### 2. UI Components
- Purchase Order creation from existing orders
- Supplier-based order grouping
- Quantity adjustment interface
- Receiving/delivery tracking
- Enhanced cost analytics

### 3. Analytics Improvements
- **Current**: Shows counted inventory value
- **Enhanced**: Shows actual purchase spending
- **New Metrics**: 
  - Real purchase costs vs. estimates
  - Supplier performance tracking
  - Purchase frequency analysis
  - Cost efficiency metrics

## Coffee Example (Current vs. Enhanced)
**Current Analytics**: "You counted 35 bags total" (inventory value)
**Enhanced Analytics**: "You purchased 47 bags for $587.50" (actual spending)

## Implementation Phases
1. **Phase 1**: Database schema + basic PO creation
2. **Phase 2**: Purchase order management UI  
3. **Phase 3**: Receiving workflow integration
4. **Phase 4**: Enhanced analytics with purchase data

## Benefits
- Accurate cost tracking and budgeting
- Better supplier relationship management
- Improved inventory planning
- Real spending analysis vs. estimations

## Priority: Medium-High
Significant business value for cost management and operational efficiency.

---
**Created**: August 23, 2025
**Status**: Planned for future implementation
**Estimated Effort**: 2-3 weeks development time

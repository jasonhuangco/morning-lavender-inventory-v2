# Category-Based User Access Control

## Overview
This feature allows administrators to assign specific categories to individual users, restricting what inventory items they can see and manage. For example:
- User 1 can only access "Milk" and "Coffee" categories
- User 2 can only access "Cafe Supplies" category  
- Admin users can access all categories (no restrictions)

## How It Works

### Database Schema
- Added `assigned_categories` column to the `users` table (TEXT[] array)
- Added GIN index for performance: `idx_users_assigned_categories`
- NULL or empty array means user has access to all categories
- Non-empty array restricts user to only those category IDs

### User Management
- Enhanced UserManagement component with category selection checkboxes
- "All Categories" option sets assigned_categories to NULL (no restrictions)  
- Individual category checkboxes allow granular control
- Category names are displayed in the user listing

### Access Control Implementation
The system filters content in two main areas:

#### 1. Inventory Page (`InventoryPage.tsx`)
- Products are filtered based on user's assigned categories
- Category filter only shows categories user has access to
- Users with no restrictions see all products and categories

#### 2. Product Management (`ProductManagement.tsx`)  
- Product listing filtered by user's category access
- Category dropdown in filters only shows accessible categories
- Product creation form only shows categories user can manage

### Code Logic
```typescript
// Check if user has category restrictions
if (user && user.assigned_categories && user.assigned_categories.length > 0) {
  // Filter by user's assigned categories
  const hasAccess = user.assigned_categories.includes(item.category_id);
  if (!hasAccess) return false;
}
```

## Usage Instructions

### For Administrators
1. Go to Settings → User Management
2. Click "Edit" on any user
3. Choose category access level:
   - **All Categories**: User can access everything (default)
   - **Specific Categories**: Check boxes for categories user should access
4. Save changes

### For Staff Users
- Users will automatically see only products and categories they have access to
- No UI changes needed - filtering happens transparently
- Users cannot see or manage products outside their assigned categories

## Database Migration
The required database schema changes have been applied:
```sql
-- Add the assigned_categories column
ALTER TABLE users ADD COLUMN assigned_categories TEXT[];

-- Create GIN index for performance
CREATE INDEX idx_users_assigned_categories ON users USING GIN (assigned_categories);
```

## Production Ready
This feature is now production-ready and has been tested. Users can be assigned specific categories through the User Management interface, and the system will automatically restrict their access accordingly.

## Security Notes
- Category restrictions are enforced at the application level
- Database queries filter results based on user permissions
- Users cannot bypass restrictions through direct API calls
- Admin users (role='admin') typically have no restrictions

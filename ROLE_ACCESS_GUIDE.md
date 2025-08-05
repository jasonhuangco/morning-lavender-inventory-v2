# Role-Based Access Control System

## Overview
The inventory system now supports two types of users with different access levels:

### User Roles

#### Admin Users
- **Full Access**: Can access all features and pages
- **Features Available**:
  - ✅ Inventory Management
  - ✅ Analytics Dashboard
  - ✅ Order History
  - ✅ Settings & User Management
- **Responsibilities**: Complete system administration and management

#### Staff Users  
- **Limited Access**: Can only access inventory management
- **Features Available**:
  - ✅ Inventory Management (Add, Edit, Update products and orders)
- **Features Restricted**:
  - ❌ Analytics Dashboard
  - ❌ Order History
  - ❌ Settings & User Management
- **Responsibilities**: Day-to-day inventory operations only

## Test Login Codes

### Admin Accounts
- `111111` - Admin User (admin@morninglavender.com)
- `999999` - Super Admin (superadmin@morninglavender.com)
- `236868` - Existing Admin (original code)
- `622366` - Existing Admin (original code)  
- `054673` - Existing Admin (original code)

### Staff Accounts
- `222222` - Staff Member (staff@morninglavender.com)
- `333333` - Store Employee (employee@morninglavender.com)

## How It Works

### Navigation
- **Admin users** see all navigation tabs: Inventory, Analytics, Orders, Settings
- **Staff users** only see: Inventory tab
- The user's role is displayed as a badge next to their name in the header

### Route Protection
- If a staff user tries to access a restricted URL directly, they are automatically redirected to the inventory page
- Admin users can access all routes without restrictions

### User Management
- Only admin users can access the Settings page to manage other users
- When creating new users, admins can assign roles:
  - **Staff**: "Staff - Inventory Access Only"
  - **Admin**: "Admin - Full Access" 

### Visual Indicators
- **Admin badge**: Purple background
- **Staff badge**: Blue background
- Role is displayed in both the header and user management interface

## Database Changes
- Added `role` column to users table with values: 'admin' or 'staff'
- Default role for new users is 'staff'
- Existing users are automatically assigned 'admin' role for the original login codes

## Security
- All route access is validated on both frontend and navigation level
- Unauthorized users are redirected to appropriate pages
- Role checking is centralized in the AuthContext for consistency

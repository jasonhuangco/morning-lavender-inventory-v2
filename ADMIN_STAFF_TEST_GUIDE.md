# Quick Test Guide for Role-Based Access Control

## Test the Admin vs Staff Access

### Admin Login Codes (Should show all tabs):
- `236868` - Admin User (original code)
- `622366` - Manager Admin (original code) 
- `054673` - Super Admin (original code)
- `111111` - Test Admin (new code)
- `999999` - Demo Admin (new code)

### Staff Login Codes (Should only show Inventory tab):
- `222222` - Staff Member
- `333333` - Store Employee

## What to Test:

### 1. Admin Access Test
1. Log in with `236868` (or any admin code)
2. You should see: **Inventory, Analytics, Orders, Settings** tabs
3. Your name should show with a **purple "Admin" badge** in the header
4. Try clicking each tab - all should work

### 2. Staff Access Test  
1. Log out and log in with `222222` (staff code)
2. You should see: **Only the Inventory** tab
3. Your name should show with a **blue "Staff" badge** in the header
4. Try navigating to `/analytics` or `/settings` directly in URL - should redirect to inventory

### 3. Navigation Test
- **Desktop**: Check sidebar navigation shows correct tabs
- **Mobile**: Check bottom navigation shows correct number of tabs
  - Admin: 4 tabs (Inventory, Analytics, Orders, Settings)
  - Staff: 1 tab (Inventory only)

### 4. User Management Test (Admin only)
1. Log in as admin (`236868`)
2. Go to Settings tab
3. Check User Management section
4. Try adding a new user - you should see role selector
5. View existing users - should show roles with colored badges

## Expected Behavior:
- **Admin users**: Full access, purple badge, all navigation tabs visible
- **Staff users**: Inventory only, blue badge, restricted navigation
- **Route protection**: Staff users automatically redirected from restricted pages
- **Visual indicators**: Role badges in header and user management

## Console Logging:
Check browser console for authentication messages:
- `✅ Authenticated with mock user: [Name] Role: [admin/staff]`
- This confirms the role assignment is working correctly

The system now supports both database and mock authentication, so admin codes should work properly with admin privileges!

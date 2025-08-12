# Complete Deployment Guide for New Business Setup

This guide provides step-by-step instructions for deploying the Morning Lavender Inventory Management System to a new business with their own accounts and branding.

## 📋 Prerequisites

Before starting, you'll need:
- GitHub account for the new business
- Vercel account for hosting
- Supabase account for database
- EmailJS account for email notifications
- Domain name (optional but recommended)

## 🔧 Step 1: GitHub Repository Setup

### 1.1 Create New Repository
1. Log into the new business's GitHub account
2. Create a new repository (e.g., `inventory-management-system`)
3. Keep it private if desired
4. Don't initialize with README (we'll push existing code)

### 1.2 Update Repository Information
1. Clone or download this repository
2. Update the following files with new business information:

**Update `package.json`:**
```json
{
  "name": "inventory-management-system",
  "description": "Inventory Management System for [Business Name]",
  "author": "[Business Name]"
}
```

**Update `public/manifest.json`:**
```json
{
  "name": "[Business Name] Inventory",
  "short_name": "[Business Name]",
  "description": "Inventory Management for [Business Name]"
}
```

### 1.3 Push to New Repository
```bash
# Remove existing git history
rm -rf .git

# Initialize new repository
git init
git add .
git commit -m "Initial commit: Inventory Management System"

# Add remote and push
git remote add origin https://github.com/[NEW_ACCOUNT]/[NEW_REPO].git
git branch -M main
git push -u origin main
```

## 🗄️ Step 2: Supabase Database Setup

### 2.1 Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with new business email
3. Create a new project
4. Choose a region close to your users
5. Set a strong database password

### 2.2 Run Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy and paste the contents of `database-schema.sql`
3. Execute the script
4. Verify all tables are created in the Table Editor

### 2.3 Set Up Row Level Security (RLS)
The schema includes RLS policies, but verify they're enabled:
1. Go to Authentication > Policies
2. Ensure policies exist for all tables
3. Test with a sample user if needed

### 2.4 Get API Credentials
1. Go to Settings > API
2. Copy the Project URL
3. Copy the anon/public key
4. Save these for environment variables

## 📧 Step 3: EmailJS Configuration

### 3.1 Create EmailJS Account
1. Go to [emailjs.com](https://emailjs.com)
2. Sign up with new business email
3. Verify email address

### 3.2 Set Up Email Service
1. Go to Email Services
2. Add service (Gmail, Outlook, etc.)
3. Follow provider-specific setup instructions
4. Test the connection

### 3.3 Create Email Template
1. Go to Email Templates
2. Create new template with this structure:

**Template Name:** `order_notification`
**Subject:** `New Inventory Order - {{order_number}}`
**Content:**
```html
<h2>New Inventory Order Submitted</h2>

<p><strong>Order Number:</strong> {{order_number}}</p>
<p><strong>Location:</strong> {{location_name}}</p>
<p><strong>Submitted by:</strong> {{user_name}}</p>
<p><strong>Date:</strong> {{order_date}}</p>

{{#if notes}}
<p><strong>Notes:</strong> {{notes}}</p>
{{/if}}

<h3>Items Ordered:</h3>
{{{order_items}}}

<p>Please review and process this order.</p>
<p>Best regards,<br>[Business Name] Inventory System</p>
```

### 3.4 Get EmailJS Credentials
1. Go to Account > General
2. Copy your Public Key
3. Go to Email Services and copy Service ID
4. Go to Email Templates and copy Template ID

## 🚀 Step 4: Vercel Deployment

### 4.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Connect to the new GitHub repository

### 4.2 Configure Environment Variables
In Vercel dashboard > Settings > Environment Variables, add:

```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_EMAILJS_SERVICE_ID=[your-service-id]
VITE_EMAILJS_TEMPLATE_ID=[your-template-id]
VITE_EMAILJS_PUBLIC_KEY=[your-public-key]
```

### 4.3 Deploy
1. Import repository in Vercel
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Deploy

## 🎨 Step 5: Customization for New Business

### 5.1 Update Branding
**Colors (`tailwind.config.js`):**
```javascript
colors: {
  primary: {
    50: '#fff7ed',   // Light background
    100: '#ffedd5',  // Lighter
    200: '#fed7aa',  // Light
    300: '#fdba74',  // Medium light
    400: '#fb923c',  // Medium
    500: '#f97316',  // Base color - CHANGE THIS
    600: '#ea580c',  // Dark
    700: '#c2410c',  // Darker
    800: '#9a3412',  // Very dark
    900: '#7c2d12',  // Darkest
  }
}
```

**Logo and Icons:**
1. Replace files in `public/` folder:
   - `favicon.ico`
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png`

**App Title (`src/components/Layout/Layout.tsx`):**
```tsx
<h1 className="text-xl font-semibold text-gray-900">
  [Business Name] Inventory
</h1>
```

### 5.2 Update Authentication Domain
**In `src/services/codeAuth.ts`:**
```typescript
// Line 165 - Update email domain restriction
if (user && user.email && !user.email.endsWith('@[newbusiness].com')) {
  throw new Error('Access restricted to [Business Name] email addresses');
}
```

### 5.3 Configure Initial Data

**Update `src/services/codeAuth.ts` with new admin codes:**
```typescript
const mockUsers = [
  {
    loginCode: '111111', // Change these codes
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@[newbusiness].com',
    role: 'admin',
  },
  // Add more users as needed
];
```

## 📊 Step 6: Initial Data Setup

### 6.1 Add Locations
Use the Settings page or directly in Supabase:
```sql
INSERT INTO locations (name, address) VALUES 
('Main Store', '123 Main St, City, State'),
('Branch Store', '456 Branch Ave, City, State');
```

### 6.2 Add Categories
```sql
INSERT INTO categories (name, description) VALUES 
('Beverages', 'Coffee, tea, and drinks'),
('Food', 'Pastries and food items'),
('Supplies', 'Cups, napkins, etc.');
```

### 6.3 Add Suppliers
```sql
INSERT INTO suppliers (name, contact_email, phone) VALUES 
('Coffee Supplier Co', 'orders@coffeesupplier.com', '555-0001'),
('Food Distributor', 'sales@fooddist.com', '555-0002');
```

## 🧪 Step 7: Testing the Deployment

### 7.1 Database Connection Test
1. Copy `test-database.js` to new project
2. Create `.env.local` with new credentials:
```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```
3. Run: `node test-database.js`

### 7.2 Application Testing
1. Visit deployed Vercel URL
2. Test login with admin code
3. Add sample products
4. Create test order
5. Verify email notification

### 7.3 User Acceptance Testing
Create a test checklist:
- [ ] Login with admin credentials
- [ ] Login with staff credentials (limited access)
- [ ] Add/edit products
- [ ] Perform inventory count
- [ ] Submit order with review modal
- [ ] Receive email notification
- [ ] View order history
- [ ] Use search functionality

## 🔒 Step 8: Security Configuration

### 8.1 Supabase Security
1. Review RLS policies
2. Set up proper user roles
3. Configure email auth if needed
4. Enable 2FA on Supabase account

### 8.2 Vercel Security
1. Set up custom domain
2. Configure SSL
3. Set up proper headers
4. Enable analytics if desired

### 8.3 EmailJS Security
1. Set up domain restrictions
2. Configure rate limiting
3. Monitor usage

## 📚 Step 9: Documentation for New Business

### 9.1 Create User Manual
Document for staff:
- How to log in
- How to perform inventory counts
- How to submit orders
- How to view order history

### 9.2 Admin Documentation
Document for administrators:
- How to add/edit products
- How to manage locations
- How to manage users
- How to view analytics

### 9.3 Technical Documentation
Document for IT:
- Environment variables
- Database schema
- API endpoints
- Troubleshooting guide

## 🚀 Step 10: Go-Live Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Initial data populated
- [ ] Email notifications working
- [ ] User accounts created
- [ ] Branding updated
- [ ] Custom domain configured (if applicable)

### Launch Day
- [ ] Final deployment
- [ ] User training completed
- [ ] Support contacts established
- [ ] Monitoring in place
- [ ] Backup procedures documented

### Post-Launch
- [ ] Monitor error logs
- [ ] Collect user feedback
- [ ] Performance optimization
- [ ] Regular backups
- [ ] Security updates

## 🛠️ Maintenance and Updates

### Regular Tasks
1. **Weekly**: Check error logs and performance
2. **Monthly**: Review user feedback and feature requests
3. **Quarterly**: Security updates and dependency updates
4. **Annually**: Review hosting costs and optimization

### Update Process
1. Test changes in staging environment
2. Create backup of production database
3. Deploy during low-usage hours
4. Monitor for issues post-deployment
5. Rollback plan ready if needed

## 💰 Cost Estimates

### Monthly Costs (Typical Small Business)
- **Vercel**: $0-20/month (hobby to pro plan)
- **Supabase**: $0-25/month (free to pro plan)
- **EmailJS**: $0-15/month (free to personal plan)
- **Domain**: $10-15/year
- **Total**: ~$15-60/month

### Scaling Considerations
- Vercel scales automatically
- Supabase offers higher tiers for more usage
- EmailJS has usage-based pricing
- Consider CDN for global deployment

## 📞 Support and Troubleshooting

### Common Issues
1. **Database connection errors**: Check environment variables
2. **Email not sending**: Verify EmailJS configuration
3. **Login issues**: Check user codes and domain restrictions
4. **Build failures**: Check dependencies and TypeScript errors

### Getting Help
1. Check application logs in Vercel
2. Check database logs in Supabase
3. Verify email service status in EmailJS
4. Review this documentation
5. Contact original developer if needed

---

This deployment guide should provide everything needed to successfully deploy the inventory management system for a new business. Make sure to test thoroughly before going live and keep all credentials secure.

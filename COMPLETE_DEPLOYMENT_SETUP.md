# 🚀 Complete Deployment Setup Guide

This is the comprehensive guide for setting up the Morning Lavender Inventory Management System for new deployments. This includes database setup, environment configuration, and deployment steps.

## 📋 Quick Deployment Checklist

- [ ] Supabase project created
- [ ] Database tables created using `database-complete-setup.sql`
- [ ] EmailJS service configured
- [ ] Environment variables set
- [ ] Application deployed to Vercel/hosting platform
- [ ] DNS configured (if using custom domain)
- [ ] SSL certificate active
- [ ] User accounts created

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose your organization
4. Fill in project details:
   - **Name**: `morning-lavender-inventory-[location]`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your target users

### 2. Run Complete Database Setup

1. In Supabase dashboard, go to **SQL Editor**
2. Open `database-complete-setup.sql` from the project files
3. Copy the entire file contents
4. Paste into SQL Editor and click **Run**

This will automatically:
- Create all tables with latest schema
- Add sample data (3 locations, 6 categories, 4 suppliers, 26+ products)
- Create 3 sample users (2 admin, 1 staff)
- Set up proper indexes and security policies
- Include all latest features (roles, needs_ordering, sorting, ordered status tracking, etc.)

### 3. Get Your Credentials

In your Supabase project:
1. Go to **Settings > API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 📧 EmailJS Setup

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up and verify email
3. Choose a plan (free tier allows 200 emails/month)

### 2. Add Email Service

1. In EmailJS dashboard → **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for @morninglavender.com)
   - **Outlook** (if using Microsoft)
   - **Custom SMTP** (for other providers)
4. Connect your business email account
5. Save the **Service ID**

### 3. Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Set the **Subject** field to:
```
Inventory Order - {{location_name}} - {{order_date}}
```

4. Set the **Message** field to the HTML template provided in `email-template.html` file, or copy this HTML:

**IMPORTANT:** Use the HTML template from the `email-template.html` file in the project root. This template includes:
- Professional Morning Lavender branding
- Responsive design for all email clients
- Proper variable substitution ({{user_name}}, {{location_name}}, etc.)
- Conditional sections for order notes
- Formatted items list with supplier and quantity details
- Clear call-to-action for order processing

The template uses these variables from the system:
- `{{user_name}}` - Staff member who submitted the order
- `{{location_name}}` - Store location name
- `{{order_date}}` - Date in PST timezone
- `{{order_time}}` - Time in PST timezone
- `{{total_items}}` - Number of items requiring restock
- `{{summary}}` - One-line order summary
- `{{items_list}}` - Detailed formatted list of items to order
- `{{order_note}}` - Optional note from staff member
- `{{has_note}}` - Conditional helper (use `{{#has_note}}...{{/has_note}}`)

5. Save the template and copy the **Template ID**

4. Save and note the **Template ID**

### 4. Get Public Key

1. Go to **Account** in EmailJS dashboard
2. Copy your **Public Key**

## 🔑 Environment Configuration

Create `.env.local` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_your_service_id
VITE_EMAILJS_TEMPLATE_ID=template_your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here

# Optional: Google OAuth (for future authentication)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **GitHub Integration:**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Vercel Setup:**
   - Go to [vercel.com](https://vercel.com)
   - Connect GitHub account
   - Import your repository
   - Set environment variables in Vercel dashboard
   - Deploy automatically

3. **Domain Setup:**
   - In Vercel → Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

### Option 2: Netlify

1. **Build Setup:**
   ```bash
   npm run build
   ```

2. **Netlify Deploy:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop `dist` folder
   - Or connect GitHub for continuous deployment

### Option 3: Custom Server

1. **Build for Production:**
   ```bash
   npm run build
   ```

2. **Server Setup:**
   - Upload `dist` folder to your server
   - Configure web server (Apache/Nginx)
   - Set up SSL certificate
   - Configure environment variables on server

## 👥 User Account Setup

After deployment, set up your actual users:

### 1. Replace Sample Users

In Supabase SQL Editor:
```sql
-- Clear sample users
DELETE FROM users;

-- Add your actual users
INSERT INTO users (first_name, last_name, login_code, email, role) VALUES 
('Your', 'Name', '123456', 'you@morninglavender.com', 'admin'),
('Staff', 'Member', '654321', 'staff@morninglavender.com', 'staff');
```

### 2. Update Sample Data

Customize the sample locations, categories, suppliers, and products:

```sql
-- Update locations
UPDATE locations SET name = 'Your Actual Location' WHERE name = 'Downtown Café';

-- Add your categories
UPDATE categories SET name = 'Your Category' WHERE name = 'Coffee';

-- Update suppliers with real contact info
UPDATE suppliers SET 
  name = 'Your Supplier Name',
  contact_info = 'Real contact info',
  email = 'supplier@company.com',
  phone = '555-0123'
WHERE name = 'Premium Coffee Co';
```

## 🧪 Testing Your Deployment

### 1. Basic Functionality Test
- [ ] Login with test codes
- [ ] Navigate through all pages
- [ ] Create inventory count
- [ ] Submit order
- [ ] Check order history
- [ ] Verify email notification

### 2. Role-Based Testing
- [ ] Test admin features (settings management)
- [ ] Test staff limitations
- [ ] Verify user display shows correct roles

### 3. Database Integration Test
- [ ] Create new products
- [ ] Update inventory
- [ ] Check data persistence
- [ ] Test filtering and search

## 🔒 Security Hardening

### For Production Use:

1. **Update RLS Policies:**
   ```sql
   -- Replace open policies with restrictive ones
   DROP POLICY "Allow all operations" ON products;
   
   -- Create role-based policies
   CREATE POLICY "Admin full access" ON products 
     FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
   
   CREATE POLICY "Staff read access" ON products 
     FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));
   ```

2. **Environment Security:**
   - Never commit `.env.local` to version control
   - Use secure hosting environment variables
   - Rotate API keys regularly

3. **Email Security:**
   - Set EmailJS domain restrictions
   - Monitor email usage and costs
   - Set up abuse monitoring

## 🆘 Troubleshooting

### Common Issues:

**Database Connection Fails:**
- Check Supabase URL and anon key
- Verify RLS policies allow access
- Check network connectivity

**Email Not Sending:**
- Verify EmailJS service is connected
- Check template ID and public key
- Review EmailJS dashboard for errors

**Build/Deploy Errors:**
- Check all environment variables are set
- Verify Node.js version compatibility
- Check for missing dependencies

**Authentication Issues:**
- Verify user login codes in database
- Check role assignments
- Ensure users table is populated

## 📞 Support

### Getting Help:
1. Check browser console for errors
2. Review Supabase logs for database issues
3. Test EmailJS from their dashboard
4. Verify all environment variables
5. Check hosting platform logs

### Resources:
- [Supabase Documentation](https://supabase.com/docs)
- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🎉 Deployment Complete!

Once all steps are complete, your Morning Lavender Inventory Management System will be fully operational with:
- ✅ Real-time database persistence
- ✅ Email notifications for orders
- ✅ Role-based access control
- ✅ Mobile-optimized interface
- ✅ Complete inventory tracking
- ✅ Order history with advanced filtering

**Default Login Codes (change these!):**
- Admin: `236868` and `998877`
- Staff: `622366`

Remember to customize the sample data and update login codes for your specific deployment!

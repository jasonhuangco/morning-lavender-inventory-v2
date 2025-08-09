# Morning Lavender Inventory Management System

A modern, mobile-first inventory management web application designed for café chains and retail businesses with multiple locations.

## 🚀 Features

- **Inventory Counting**: Track quantities across multiple locations
- **Order Management**: Generate orders based on minimum thresholds  
- **Settings Management**: Manage locations, categories, suppliers, and products
- **Order History**: View past orders and drafts
- **Email Notifications**: Send order summaries via EmailJS
- **Category-based User Access**: Restrict users to specific product categories
- **Dynamic Branding**: Customize company name, logo, colors, and app appearance
- **Mobile-First Design**: Optimized for tablets and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM
- **Database**: Supabase
- **Email**: EmailJS for notifications
- **Authentication**: Code-based login system
- **Deployment**: Vercel

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **Supabase Account** - [Create free account](https://supabase.com)
3. **EmailJS Account** - [Create free account](https://emailjs.com)
4. **Vercel Account** (optional) - [Create free account](https://vercel.com)

## 🔧 Quick Setup

### 1. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 2. Database Setup

#### Step 1: Create Supabase Project
1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project name (e.g., "inventory-management")
5. Create a strong database password
6. Select region closest to your users
7. Click "Create new project"

#### Step 2: Get Database Credentials
1. In your Supabase dashboard, go to Settings → API
2. Copy your Project URL (starts with `https://`)
3. Copy your `anon` `public` key
4. Update your `.env.local` file with these values

#### Step 3: Complete Database Setup
**Copy and paste this complete SQL script** into your Supabase SQL Editor and run it:

```sql
-- Morning Lavender Inventory Management Database - COMPLETE SETUP
-- Execute this in your Supabase SQL Editor for new deployments
-- Includes all features and category-based user access control

-- Drop existing tables if they exist (for fresh deployments)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with roles and category access
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  login_code TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  assigned_categories TEXT[], -- Array of category IDs this user can access (NULL = all categories)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT login_code_format CHECK (login_code ~ '^[0-9]{6}$')
);

-- Create locations table
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT,
  email TEXT,
  phone TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table with all latest fields
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  cost DECIMAL(10,2),
  minimum_threshold INTEGER NOT NULL DEFAULT 1,
  checkbox_only BOOLEAN DEFAULT FALSE,
  hidden BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  location_id UUID REFERENCES locations(id),
  status TEXT CHECK (status IN ('draft', 'pending', 'completed')) DEFAULT 'pending',
  notes TEXT,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table with needs_ordering column
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  needs_ordering BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default users (replace with your actual users)
INSERT INTO users (first_name, last_name, login_code, email, role) VALUES 
('Staff', 'Member', '622366', 'staff@morninglavender.com', 'staff'),
('Manager', 'Lead', '998877', 'manager@morninglavender.com', 'admin');

-- Insert sample locations
INSERT INTO locations (name, address, sort_order) VALUES 
('Downtown Café', '123 Main Street, Downtown', 1),
('University Branch', '456 College Ave, University District', 2),
('Suburban Location', '789 Oak Road, Suburbs', 3);

-- Insert sample categories
INSERT INTO categories (name, color, sort_order) VALUES 
('Coffee', '#8B4513', 1),
('Dairy', '#FFFFFF', 2),
('Pastries', '#FFD700', 3),
('Syrups', '#FF6B6B', 4),
('Cups & Lids', '#4ECDC4', 5),
('Cleaning', '#95E1D3', 6);

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_info, email, phone, sort_order) VALUES 
('Premium Coffee Co', 'Main supplier for coffee beans', 'orders@premiumcoffee.com', '555-0101', 1),
('Fresh Dairy Supply', 'Local dairy products', 'orders@freshdairy.com', '555-0102', 2),
('Bakery Wholesale', 'Fresh baked goods daily', 'orders@bakerywhol.com', '555-0103', 3),
('Restaurant Supplies Plus', 'Complete restaurant supplies', 'orders@restsupply.com', '555-0104', 4);

-- Insert sample products with realistic café inventory
DO $$
DECLARE
    coffee_cat_id UUID;
    dairy_cat_id UUID;
    pastry_cat_id UUID;
    syrup_cat_id UUID;
    cup_cat_id UUID;
    cleaning_cat_id UUID;
    coffee_supplier_id UUID;
    dairy_supplier_id UUID;
    bakery_supplier_id UUID;
    supplies_supplier_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO coffee_cat_id FROM categories WHERE name = 'Coffee';
    SELECT id INTO dairy_cat_id FROM categories WHERE name = 'Dairy';
    SELECT id INTO pastry_cat_id FROM categories WHERE name = 'Pastries';
    SELECT id INTO syrup_cat_id FROM categories WHERE name = 'Syrups';
    SELECT id INTO cup_cat_id FROM categories WHERE name = 'Cups & Lids';
    SELECT id INTO cleaning_cat_id FROM categories WHERE name = 'Cleaning';
    
    -- Get supplier IDs
    SELECT id INTO coffee_supplier_id FROM suppliers WHERE name = 'Premium Coffee Co';
    SELECT id INTO dairy_supplier_id FROM suppliers WHERE name = 'Fresh Dairy Supply';
    SELECT id INTO bakery_supplier_id FROM suppliers WHERE name = 'Bakery Wholesale';
    SELECT id INTO supplies_supplier_id FROM suppliers WHERE name = 'Restaurant Supplies Plus';

    -- Insert products
    INSERT INTO products (name, description, unit, cost, minimum_threshold, checkbox_only, category_id, supplier_id, sort_order) VALUES 
    -- Coffee Products
    ('House Blend Coffee Beans', 'Medium roast house blend', 'lbs', 12.50, 10, false, coffee_cat_id, coffee_supplier_id, 1),
    ('Dark Roast Coffee Beans', 'Bold dark roast', 'lbs', 13.00, 8, false, coffee_cat_id, coffee_supplier_id, 2),
    ('Decaf Coffee Beans', 'Swiss water process decaf', 'lbs', 14.00, 5, false, coffee_cat_id, coffee_supplier_id, 3),
    ('Espresso Beans', 'Premium espresso blend', 'lbs', 15.50, 6, false, coffee_cat_id, coffee_supplier_id, 4),
    
    -- Dairy Products
    ('Whole Milk', 'Fresh whole milk', 'gallons', 4.50, 20, false, dairy_cat_id, dairy_supplier_id, 5),
    ('2% Milk', 'Reduced fat milk', 'gallons', 4.25, 15, false, dairy_cat_id, dairy_supplier_id, 6),
    ('Oat Milk', 'Plant-based oat milk', 'cartons', 3.75, 10, false, dairy_cat_id, dairy_supplier_id, 7),
    ('Almond Milk', 'Unsweetened almond milk', 'cartons', 3.50, 8, false, dairy_cat_id, dairy_supplier_id, 8),
    ('Heavy Cream', 'Heavy whipping cream', 'quarts', 5.50, 8, false, dairy_cat_id, dairy_supplier_id, 9),
    
    -- Pastries
    ('Croissants', 'Butter croissants', 'dozen', 18.00, 5, false, pastry_cat_id, bakery_supplier_id, 10),
    ('Muffins', 'Assorted muffins', 'dozen', 15.00, 3, false, pastry_cat_id, bakery_supplier_id, 11),
    ('Scones', 'Traditional scones', 'dozen', 16.00, 4, false, pastry_cat_id, bakery_supplier_id, 12),
    ('Cookies', 'Chocolate chip cookies', 'dozen', 12.00, 4, false, pastry_cat_id, bakery_supplier_id, 13),
    
    -- Syrups
    ('Vanilla Syrup', 'Natural vanilla syrup', 'bottles', 8.50, 6, false, syrup_cat_id, supplies_supplier_id, 14),
    ('Caramel Syrup', 'Rich caramel syrup', 'bottles', 8.75, 6, false, syrup_cat_id, supplies_supplier_id, 15),
    ('Hazelnut Syrup', 'Hazelnut flavored syrup', 'bottles', 8.50, 4, false, syrup_cat_id, supplies_supplier_id, 16),
    ('Lavender Syrup', 'Signature lavender syrup', 'bottles', 9.50, 8, false, syrup_cat_id, supplies_supplier_id, 17),
    ('Rose Syrup', 'Delicate rose syrup', 'bottles', 9.25, 6, false, syrup_cat_id, supplies_supplier_id, 18),
    
    -- Cups & Supplies
    ('12oz Paper Cups', 'Biodegradable paper cups', 'sleeves', 25.00, 20, false, cup_cat_id, supplies_supplier_id, 19),
    ('16oz Paper Cups', 'Large paper cups', 'sleeves', 28.00, 15, false, cup_cat_id, supplies_supplier_id, 20),
    ('Cup Lids', 'Dome lids for hot drinks', 'sleeves', 15.00, 25, false, cup_cat_id, supplies_supplier_id, 21),
    ('Cup Carriers', '4-cup carriers', 'packs', 12.00, 10, false, cup_cat_id, supplies_supplier_id, 22),
    
    -- Cleaning (some checkbox-only)
    ('Sanitizer', 'Food-safe sanitizer', 'bottles', 12.00, 8, true, cleaning_cat_id, supplies_supplier_id, 23),
    ('Paper Towels', 'Commercial paper towels', 'cases', 35.00, 3, false, cleaning_cat_id, supplies_supplier_id, 24),
    ('Dish Soap', 'Commercial dish soap', 'gallons', 18.00, 4, false, cleaning_cat_id, supplies_supplier_id, 25),
    ('Floor Cleaner', 'Commercial floor cleaner', 'bottles', 15.00, 2, true, cleaning_cat_id, supplies_supplier_id, 26);
END $$;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for development/testing (allow all operations)
-- NOTE: In production, restrict these policies based on user authentication
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON order_items FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_sort_order ON products(sort_order);
CREATE INDEX idx_orders_location ON orders(location_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_users_login_code ON users(login_code);
CREATE INDEX idx_users_assigned_categories ON users USING GIN (assigned_categories);

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE '🎉 Morning Lavender Inventory Database Setup Complete!';
    RAISE NOTICE '📊 Created: % users, % locations, % categories, % suppliers, % products', 
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM locations), 
        (SELECT COUNT(*) FROM categories),
        (SELECT COUNT(*) FROM suppliers),
        (SELECT COUNT(*) FROM products);
    RAISE NOTICE '🔑 Default login codes: 622366 (staff), 998877 (admin)';
    RAISE NOTICE '⚠️  Remember to update RLS policies for production use!';
END $$;

-- ================================================
-- BRANDING SETTINGS TABLE (OPTIONAL - v2.1 Feature)
-- ================================================
-- Run this additional script to enable dynamic branding features
-- Allows customization of company name, logo, colors, etc.

-- Create branding_settings table for storing company branding information
CREATE TABLE IF NOT EXISTS public.branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'Morning Lavender',
    logo_url TEXT DEFAULT '',
    icon_url TEXT DEFAULT '',
    primary_color TEXT NOT NULL DEFAULT '#8B4513',
    secondary_color TEXT NOT NULL DEFAULT '#E6E6FA',
    accent_color TEXT NOT NULL DEFAULT '#DDA0DD',
    text_color TEXT NOT NULL DEFAULT '#374151',
    background_color TEXT NOT NULL DEFAULT '#F9FAFB',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branding_settings_updated_at 
    BEFORE UPDATE ON branding_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default branding settings (let UUID be auto-generated)
INSERT INTO public.branding_settings (company_name, logo_url, icon_url, primary_color, secondary_color, accent_color, text_color, background_color)
VALUES ('Morning Lavender', '', '', '#8B4513', '#E6E6FA', '#DDA0DD', '#374151', '#F9FAFB');

-- Enable Row Level Security (RLS)
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.branding_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.branding_settings TO authenticated;
GRANT ALL ON public.branding_settings TO anon;

-- Display branding setup completion
DO $$
BEGIN
    RAISE NOTICE '🎨 Branding Settings Table Created Successfully!';
    RAISE NOTICE '✨ Features enabled: Dynamic company branding, custom colors, logo support';
    RAISE NOTICE '🛠️ Access via: Settings → Branding in the application';
END $$;
```

**This single script will:**
- ✅ Create all required tables with proper relationships
- ✅ Set up category-based user access control
- ✅ Insert realistic sample data for a café business
- ✅ Configure performance indexes
- ✅ Enable Row Level Security
- ✅ Display a completion summary

### 3. EmailJS Setup

#### Step 1: Create EmailJS Account
1. Go to [EmailJS](https://emailjs.com) and sign up
2. Verify your email address
3. Login to your EmailJS dashboard

#### Step 2: Add Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Test the connection
6. Copy the Service ID

#### Step 3: Create Email Template
1. Go to "Email Templates" in EmailJS dashboard
2. Click "Create New Template"
3. Use this template structure:

```
Subject: New Inventory Order - {{location_name}}

Hello,

A new inventory order has been submitted:

Location: {{location_name}}
Submitted by: {{user_name}}
Date: {{order_date}}
Total Items: {{total_items}}

Order Details:
{{order_items}}

{{#if notes}}
Notes: {{notes}}
{{/if}}

Please process this order at your earliest convenience.

Best regards,
Inventory Management System
```

4. Save the template and copy the Template ID

#### Step 4: Get Public Key
1. Go to "Account" in EmailJS dashboard
2. Copy your Public Key
3. Update your `.env.local` file with all EmailJS credentials

### 4. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Default Login

The system includes default admin users for initial setup:
- Manager: `622366`
- Super Admin: `998877`

## 📱 Usage

1. **Login** with a 6-digit code
2. **Select location** from the dropdown
3. **Count inventory** by entering quantities or checking boxes
4. **Submit orders** based on minimum thresholds
5. **Manage settings** through the admin panel

### 🎨 Branding Customization (Admin Feature)

Access **Settings → Branding** to customize:
- **Company Name**: Updates page title, login page, and app header
- **Logo & Icon**: Upload custom branding images
- **Color Scheme**: 5-color palette (primary, secondary, accent, text, background)
- **Reset to Default**: Restore original Morning Lavender branding

Changes apply immediately across the entire application.

## 🔐 User Access Control

- **Admin users**: Full access to all features and categories
- **Staff users**: Can be restricted to specific product categories
- **Category assignment**: Done through Settings → User Management

## 🚀 Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Repository
1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

#### Step 2: Deploy to Vercel
1. Go to [Vercel](https://vercel.com) and login
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 3: Add Environment Variables
In Vercel dashboard, go to your project settings:
1. Click "Environment Variables"
2. Add each variable from your `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Test your live application

### Option 2: Manual Deployment

#### Build the Application
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test the build locally (optional)
npm run preview
```

#### Deploy to Hosting Provider
1. Upload the contents of the `dist/` folder to your web server
2. Configure your hosting provider to:
   - Set the document root to the uploaded `dist` folder
   - Enable SPA routing (redirect all routes to `index.html`)
   - Set up HTTPS (recommended)

#### Popular Hosting Options:
- **Netlify**: Drag and drop the `dist` folder
- **Firebase Hosting**: Use `firebase deploy`
- **AWS S3 + CloudFront**: Upload to S3 bucket
- **DigitalOcean App Platform**: Connect GitHub repository

## 📞 Support & Troubleshooting

### Common Issues

#### Database Connection Issues
- **Error**: "Failed to fetch" or connection timeouts
- **Solution**: 
  1. Verify Supabase URL and anon key in `.env.local`
  2. Check if your Supabase project is active
  3. Ensure database tables are created correctly

#### Email Not Sending
- **Error**: EmailJS fails to send orders
- **Solution**:
  1. Verify all EmailJS credentials in `.env.local`
  2. Check EmailJS service is connected and active
  3. Ensure email template variables match the application

#### Login Issues
- **Error**: "Invalid code" when trying to login
- **Solution**:
  1. Verify users are inserted in the database
  2. Check that the `code` field matches exactly
  3. Ensure the users table has the correct structure

#### Build/Deployment Issues
- **Error**: Build fails or white screen after deployment
- **Solution**:
  1. Check all environment variables are set correctly
  2. Ensure the build command uses `npm run build`
  3. Verify the output directory is set to `dist`

### Environment Variables Checklist

Ensure these variables are set in your deployment:
```env
✓ VITE_SUPABASE_URL=https://your-project.supabase.co
✓ VITE_SUPABASE_ANON_KEY=eyJ...
✓ VITE_EMAILJS_SERVICE_ID=service_...
✓ VITE_EMAILJS_TEMPLATE_ID=template_...
✓ VITE_EMAILJS_PUBLIC_KEY=...
```

### Getting Help

This system is designed to be self-contained and easy to manage. For technical issues:

1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Ensure Supabase database is properly configured
4. Test EmailJS configuration in their dashboard
5. Check network connectivity and CORS settings

### Performance Tips

1. **Database Optimization**: 
   - Ensure indexes are created (especially on frequently queried fields)
   - Use Row Level Security for better performance and security

2. **Caching**:
   - Enable browser caching for static assets
   - Consider using Vercel's edge caching features

3. **Mobile Performance**:
   - Test on actual mobile devices
   - Ensure touch targets are large enough (minimum 44px)
   - Optimize images and assets for mobile networks

## 📄 License

This software is licensed for use by Morning Lavender and authorized resellers only.

---

Built with ❤️ for efficient inventory management

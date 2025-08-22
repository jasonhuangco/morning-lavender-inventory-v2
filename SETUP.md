# 🔧 Setup Guide: Supabase & EmailJS Integration

This guide will walk you through setting up your Supabase database and EmailJS email service for the Morning Lavender Inventory Management System.

> **🎯 Quick Start:** Use `database-complete-setup.sql` for instant database setup with all features included!

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account
- An EmailJS account
- Access to @morninglavender.com email domain

## 🗄️ Supabase Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `morning-lavender-inventory`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location

### 2. Get Your Credentials

1. In your project dashboard, go to **Settings > API**
2. Copy these values to your `.env.local` file:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Create Database Tables

Instead of running multiple SQL commands, use our comprehensive setup script:

1. In Supabase, go to **SQL Editor**
2. Copy the entire contents of `database-complete-setup.sql`
3. Paste into the SQL Editor and click **Run**

This single script will:
- Create all necessary tables with the latest schema
- Add sample data (locations, categories, suppliers, products, users)
- Set up proper indexes and relationships
- Configure Row Level Security policies
- Include all recent features (user roles, needs_ordering column, etc.)

**Alternative Manual Setup:**

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Locations table
CREATE TABLE locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table  
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    minimum_threshold INTEGER NOT NULL DEFAULT 1,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    category_ids UUID[] NOT NULL DEFAULT '{}',
    location_ids UUID[] NOT NULL DEFAULT '{}',
    supplier_id UUID REFERENCES suppliers(id),
    is_checkbox_only BOOLEAN DEFAULT FALSE,
    unit TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT NOT NULL,
    location_id UUID REFERENCES locations(id),
    status TEXT CHECK (status IN ('draft', 'submitted')) DEFAULT 'submitted',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    current_quantity INTEGER NOT NULL,
    minimum_threshold INTEGER NOT NULL,
    supplier_name TEXT,
    category_names TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations (you'll restrict this when you add auth)
CREATE POLICY "Allow all for authenticated users" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON order_items FOR ALL USING (true);
```

## 📧 EmailJS Setup

### 1. Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up with your email
3. Verify your email address

### 2. Create Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended)
4. Connect your @morninglavender.com email
5. Note the **Service ID**

### 3. Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Set the **Subject** field to:
```
Inventory Order - {{location_name}} - {{order_date}}
```

4. For the **Message** field, use the HTML template from the `email-template.html` file in the project root.

**Key Variables Used:**
- `{{user_name}}` - Staff member name
- `{{location_name}}` - Store location
- `{{order_date}}` - Order date (PST)
- `{{order_time}}` - Order time (PST)  
- `{{total_items}}` - Number of items to restock
- `{{items_list}}` - Formatted list of items
- `{{summary}}` - Order summary
- `{{order_note}}` - Optional staff note
- `{{has_note}}` - Conditional for notes (use `{{#has_note}}...{{/has_note}}`)

4. Save the template and note the **Template ID**

### 4. Get Public Key

1. Go to **Account** in EmailJS dashboard
2. Find your **Public Key**
3. Copy this value

## 🔑 Environment Configuration

Create a `.env.local` file in your project root with your credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# EmailJS  
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Google OAuth (for later)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🧪 Testing Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The app will automatically detect if credentials are missing and show helpful warnings

3. Once configured, test:
   - Create some categories, suppliers, and locations in Settings
   - Add products
   - Try submitting an inventory count
   - Check if the email is sent

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Use Row Level Security in Supabase for production
- Restrict EmailJS usage to your domain
- Set up proper authentication before production use

## 🆘 Troubleshooting

### Supabase Issues
- **Connection fails**: Check URL and anon key
- **Database errors**: Verify table creation
- **Permission denied**: Check RLS policies

### EmailJS Issues  
- **Emails not sending**: Verify service connection
- **Template errors**: Check variable names match
- **Rate limits**: EmailJS has monthly limits on free tier

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Test Supabase connection in their dashboard
4. Send a test email through EmailJS dashboard

Once everything is configured, your inventory management system will be fully functional with real-time data persistence and email notifications!

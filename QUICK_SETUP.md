# Quick Deployment Checklist for Business Owners

This is a simplified checklist for deploying the inventory management system. Follow this if you want the essential steps without technical details.

## 🎯 Essential Services You Need

1. **GitHub Account** (Free) - To store your code
2. **Vercel Account** (Free tier available) - To host your website
3. **Supabase Account** (Free tier available) - For your database
4. **EmailJS Account** (Free tier available) - For email notifications
5. **Business Email Address** - For admin access

## ✅ 30-Minute Setup Checklist

### 1. GitHub Setup (5 minutes)
- [ ] Create GitHub account with business email
- [ ] Create new repository called `inventory-system`
- [ ] Upload/push the code to this repository

### 2. Database Setup (10 minutes)
- [ ] Create Supabase account
- [ ] Create new project
- [ ] Copy and paste the database schema (from `database-schema.sql`)
- [ ] Note down your Project URL and API Key

### 3. Email Setup (5 minutes)
- [ ] Create EmailJS account
- [ ] Connect your email service (Gmail/Outlook)
- [ ] Create email template for order notifications
- [ ] Note down Service ID, Template ID, and Public Key

### 4. Website Deployment (5 minutes)
- [ ] Create Vercel account and connect to GitHub
- [ ] Import your repository
- [ ] Add environment variables (URLs and keys from steps 2-3)
- [ ] Deploy

### 5. Customization (5 minutes)
- [ ] Update business name in the app
- [ ] Change colors to match your brand
- [ ] Add your logo files
- [ ] Create admin login codes

## 🔑 Environment Variables Needed

When setting up Vercel, you'll need these 5 variables:

```
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-long-supabase-key]
VITE_EMAILJS_SERVICE_ID=[your-emailjs-service]
VITE_EMAILJS_TEMPLATE_ID=[your-emailjs-template]
VITE_EMAILJS_PUBLIC_KEY=[your-emailjs-public-key]
```

## 🏪 Initial Setup for Your Business

### Add Your Locations
1. Log into your deployed app
2. Go to Settings > Locations
3. Add each of your store locations

### Add Your Product Categories
1. Go to Settings > Categories
2. Add categories like "Beverages", "Food", "Supplies"

### Add Your Suppliers
1. Go to Settings > Suppliers
2. Add each supplier with contact information

### Add Your Products
1. Go to Settings > Product Management
2. Add each product with minimum stock levels

### Create User Accounts
1. Go to Settings > User Management
2. Add staff and admin users
3. Share login codes with your team

## 💡 Quick Tips

- **Start with free tiers** of all services - upgrade only if needed
- **Test everything** with sample data before going live
- **Train one admin user first**, then they can train others
- **Keep login codes secure** - they're like passwords
- **Regular backups** - Supabase handles this automatically
- **Mobile-friendly** - works great on tablets and phones

## 🆘 If You Get Stuck

### Common Solutions
- **Can't login?** Check that your email domain matches the one in settings
- **No emails?** Verify EmailJS is connected and template is created
- **Database errors?** Make sure the schema was copied completely
- **Build errors?** Check that all environment variables are set correctly

### Quick Fixes
1. **Double-check all environment variables** - most issues are here
2. **Try incognito mode** - clears cache issues
3. **Check service status** of Vercel, Supabase, EmailJS
4. **Review the detailed guide** in `DEPLOYMENT_GUIDE.md`

## 📱 Using the System

### For Staff
- Log in with provided code
- Count inventory by location
- Submit orders when stock is low
- View previous orders

### For Admins
- Everything staff can do, plus:
- Add/edit products and suppliers
- Manage user accounts
- View analytics and reports
- Manage system settings

## 💰 Cost Breakdown

### Free Tier Limits
- **Vercel**: 100GB bandwidth/month
- **Supabase**: 2 projects, 500MB database
- **EmailJS**: 200 emails/month
- **Total**: $0/month for small businesses

### When to Upgrade
- More than 200 orders per month → EmailJS paid plan
- More than 500MB of data → Supabase paid plan
- High traffic website → Vercel paid plan
- Typical cost: $20-50/month for growing businesses

---

**Need help?** Keep the detailed `DEPLOYMENT_GUIDE.md` handy for technical steps, or contact a developer if you get stuck!

# Branding Customization Guide

This guide shows you how to customize the inventory system with your business branding.

## 🎨 Color Scheme Customization

### Primary Colors
Edit `tailwind.config.js` to change the main color scheme:

```javascript
// Current Morning Lavender colors (orange theme)
primary: {
  50: '#fef7ee',
  100: '#fdecd7', 
  200: '#fad5ae',
  300: '#f6b67a',
  400: '#f18b44',
  500: '#ed6c1f',  // Main brand color
  600: '#de5315',  // Slightly darker
  700: '#b83e14',  // Much darker  
  800: '#933218',  // Very dark
  900: '#762b16',  // Darkest
}
```

### Popular Color Schemes for Different Businesses

**Coffee Shop (Brown/Warm)**
```javascript
primary: {
  50: '#fdf8f6',
  100: '#f2e8e5', 
  200: '#eaddd7',
  300: '#e0c2b4',
  400: '#d2a48c',
  500: '#a0522d',
  600: '#8b4513',
  700: '#723b0f',
  800: '#5d2f0c',
  900: '#4a250a',
}
```

**Restaurant (Red/Warm)**
```javascript
primary: {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca', 
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
}
```

**Retail Store (Blue/Professional)**
```javascript
primary: {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd', 
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
}
```

**Spa/Wellness (Green/Calming)**
```javascript
primary: {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80', 
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
}
```

## 🖼️ Logo and Icons

### Replace These Files in the `public/` folder:

1. **favicon.ico** (32x32 pixels) - Shows in browser tab
2. **favicon-16x16.png** (16x16 pixels) - Small browser icon
3. **favicon-32x32.png** (32x32 pixels) - Standard browser icon  
4. **apple-touch-icon.png** (180x180 pixels) - iOS home screen icon

### Logo Requirements:
- **Format**: PNG with transparent background preferred
- **Style**: Simple, readable at small sizes
- **Colors**: Should work with your chosen color scheme

### Free Logo Resources:
- **Canva**: Free logo maker with business templates
- **LogoMakr**: Simple online logo creator
- **Hatchful**: Shopify's free logo maker
- **Tailor Brands**: AI-powered logo generator

## 📝 Text and Business Name

### Update Business Name
Edit `src/components/Layout/Layout.tsx`:

```tsx
// Find this line (around line 42):
<h1 className="text-xl font-semibold text-gray-900">
  Morning Lavender Inventory  {/* Change this */}
</h1>

// Change to:
<h1 className="text-xl font-semibold text-gray-900">
  [Your Business Name] Inventory
</h1>
```

### Update Page Title
Edit `index.html`:

```html
<!-- Find this line: -->
<title>Morning Lavender Inventory</title>

<!-- Change to: -->
<title>[Your Business Name] Inventory</title>
```

### Update App Manifest
Edit `public/manifest.json`:

```json
{
  "name": "[Your Business Name] Inventory",
  "short_name": "[Your Business Name]", 
  "description": "Inventory Management for [Your Business Name]"
}
```

## 🔐 Email Domain Configuration

### Update Authentication Domain
Edit `src/services/codeAuth.ts` (around line 165):

```typescript
// Find this line:
if (user && user.email && !user.email.endsWith('@morninglavender.com')) {

// Change to:
if (user && user.email && !user.email.endsWith('@yourbusiness.com')) {
```

## 🏷️ Business Information Templates

### For Restaurants
- **Business Name**: "Tony's Italian Kitchen"
- **Colors**: Red/white/green (Italian flag)
- **Categories**: "Appetizers", "Entrees", "Beverages", "Desserts"
- **Suppliers**: "Food Distributor", "Beverage Co", "Local Produce"

### For Coffee Shops  
- **Business Name**: "Central Perk Coffee"
- **Colors**: Brown/cream/warm orange
- **Categories**: "Coffee", "Tea", "Pastries", "Supplies"
- **Suppliers**: "Coffee Roasters", "Bakery Supply", "Paper Goods Co"

### For Retail Stores
- **Business Name**: "Madison Boutique" 
- **Colors**: Professional blue/gray
- **Categories**: "Clothing", "Accessories", "Footwear", "Supplies"
- **Suppliers**: "Fashion Wholesale", "Accessory Imports", "Store Supplies"

### For Spa/Wellness
- **Business Name**: "Serenity Wellness Spa"
- **Colors**: Calming green/blue
- **Categories**: "Skincare", "Aromatherapy", "Massage Oils", "Linens"
- **Suppliers**: "Beauty Supply Co", "Essential Oils Direct", "Spa Linens Plus"

## 💼 Professional Customization Tips

### 1. Keep It Simple
- Use 1-2 main colors maximum
- Ensure good contrast for readability
- Test on both desktop and mobile

### 2. Brand Consistency  
- Match your existing business cards/signage
- Use the same fonts if possible
- Keep the same color scheme throughout

### 3. User Experience
- Test with actual employees
- Make sure colors work for colorblind users
- Ensure text is readable in all lighting

### 4. Testing Checklist
- [ ] Logo displays correctly on all screen sizes
- [ ] Colors look good in light and dark environments  
- [ ] Business name appears in all the right places
- [ ] Email domain restriction works with your domain
- [ ] Print a sample report to check colors

## 🛠️ Advanced Customization

### Custom Fonts
Add to `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Your+Font:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Your Font', sans-serif;
}
```

### Custom CSS Classes
Add to `src/index.css`:

```css
.company-header {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.brand-accent {
  color: #your-brand-color;
}
```

### Email Template Customization
In EmailJS, customize your email template:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #your-brand-color; color: white; padding: 20px; text-align: center;">
    <h1>[Your Business Name]</h1>
    <h2>New Inventory Order</h2>
  </div>
  
  <!-- Rest of email content -->
</div>
```

## 🚀 Quick Brand Update Checklist

- [ ] Update primary colors in `tailwind.config.js`
- [ ] Replace logo files in `public/` folder
- [ ] Update business name in `Layout.tsx`
- [ ] Update page title in `index.html` 
- [ ] Update manifest.json
- [ ] Update email domain in `codeAuth.ts`
- [ ] Test on mobile and desktop
- [ ] Train staff on new branding

Remember: Keep backups of your original files before making changes!

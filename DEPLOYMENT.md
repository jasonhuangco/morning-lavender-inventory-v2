# Vercel Deployment Guide for Morning Lavender Inventory Management

## 🚀 Quick Deployment Steps

### Prerequisites
1. **GitHub Account**: Your code should be pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **Environment Variables**: You'll need your Supabase and EmailJS credentials

### Step 1: Prepare Your Repository
```bash
# If you haven't already, initialize git and push to GitHub
git init
git add .
git commit -m "Initial commit - Morning Lavender Inventory Management"
git branch -M main
git remote add origin https://github.com/your-username/morning-lavender-inventory.git
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: morning-lavender-inventory
# - In which directory is your code located? ./
```

### Step 3: Configure Environment Variables

In your Vercel dashboard, go to your project → Settings → Environment Variables and add:

```
VITE_SUPABASE_URL=https://setkamakzbnhtosacdee.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_EMAILJS_SERVICE_ID=service_oyxw87u
VITE_EMAILJS_TEMPLATE_ID=template_irdg0hr
VITE_EMAILJS_PUBLIC_KEY=yZ-ZP7pDY4Rzfcs1Br
```

**Important**: 
- Add these for all environments (Production, Preview, Development)
- Never commit your `.env.local` file to GitHub
- Your Supabase database is already configured and working

### Step 4: Enable Automatic Deployments

Vercel will automatically deploy when you push to your main branch. Every push creates a new deployment!

### Step 5: Custom Domain (Optional)

1. In Vercel dashboard → Domains
2. Add your custom domain (e.g., `inventory.morninglavender.com`)
3. Configure DNS records as instructed by Vercel

## 🔧 Project Configuration

### Build Settings
- **Framework**: Vite
- **Node.js Version**: 18.x (automatic)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Features Included
✅ Single Page Application (SPA) routing  
✅ Environment variables support  
✅ Automatic HTTPS  
✅ Global CDN  
✅ Serverless functions ready  
✅ Mobile-optimized  

### Performance Optimizations
- Vite's built-in code splitting
- Tree shaking for smaller bundles
- CSS optimization
- Asset compression

## 🎯 Post-Deployment Checklist

1. ✅ Test all major features:
   - Login/authentication flow
   - Inventory counting
   - Order submission
   - Order history
   - Settings management
   - Manual reordering

2. ✅ Verify database connections:
   - Data loads correctly
   - Orders save to Supabase
   - Email notifications work

3. ✅ Mobile testing:
   - Touch interactions work
   - Responsive design
   - Large buttons for mobile

4. ✅ Performance check:
   - Fast initial load
   - Smooth interactions
   - No console errors

## 🚨 Troubleshooting

### Common Issues

**Build Fails**: 
```bash
# Test build locally first
npm run build
```

**Environment Variables Not Working**:
- Ensure they start with `VITE_`
- Check they're added to all environments in Vercel
- Redeploy after adding variables

**Routing Issues**:
- The `vercel.json` file handles SPA routing
- All routes redirect to `index.html`

**Database Connection Issues**:
- Verify Supabase URL and key are correct
- Check Supabase dashboard for connection logs
- Ensure RLS policies allow public access for your use case

## 🔄 Updates and Maintenance

### Deploying Updates
```bash
# Make changes, commit, and push
git add .
git commit -m "Update: description of changes"
git push origin main
# Vercel automatically deploys!
```

### Monitoring
- Check Vercel dashboard for deployment status
- Monitor Supabase dashboard for database usage
- EmailJS dashboard for email delivery status

## 📱 Expected Performance
- **First Load**: ~2-3 seconds
- **Subsequent Navigation**: ~200-500ms
- **Mobile Optimized**: Touch-friendly, large buttons
- **Offline Ready**: Service worker can be added later

Your Morning Lavender Inventory Management System is production-ready with:
- Secure environment variables
- Optimized build process
- Mobile-first design
- Real-time database integration
- Email notifications
- Manual reordering capabilities

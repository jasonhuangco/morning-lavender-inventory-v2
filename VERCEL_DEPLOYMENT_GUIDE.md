# Vercel Deployment Guide

## 🚀 Deploying to Vercel

Follow these steps to deploy the Morning Lavender Inventory Management System to Vercel:

### 1. Environment Variables Setup

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following environment variables:

#### Required Supabase Variables
```
Variable Name: VITE_SUPABASE_URL
Value: https://your-project-id.supabase.co

Variable Name: VITE_SUPABASE_ANON_KEY  
Value: your_supabase_anon_key_here
```

#### Required EmailJS Variables
```
Variable Name: VITE_EMAILJS_SERVICE_ID
Value: your_emailjs_service_id_here

Variable Name: VITE_EMAILJS_TEMPLATE_ID
Value: your_emailjs_template_id_here

Variable Name: VITE_EMAILJS_PUBLIC_KEY
Value: your_emailjs_public_key_here
```

#### Optional Google OAuth Variable
```
Variable Name: VITE_GOOGLE_CLIENT_ID
Value: your_google_oauth_client_id_here
```

### 2. Important Notes

- **CRITICAL**: All environment variables MUST start with `VITE_` prefix for Vite to expose them to the client-side build
- Environment variables are case-sensitive
- Make sure to set them for the correct environment (Production, Preview, Development)
- After adding environment variables, you must redeploy your application

### 3. Getting Your Credentials

#### Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

#### EmailJS Credentials
1. Go to [EmailJS Dashboard](https://www.emailjs.com/)
2. Create an account and email service
3. Create an email template
4. Get your:
   - **Service ID** → `VITE_EMAILJS_SERVICE_ID`
   - **Template ID** → `VITE_EMAILJS_TEMPLATE_ID`
   - **Public Key** → `VITE_EMAILJS_PUBLIC_KEY`

### 4. Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Vercel
2. **Add Environment Variables**: Follow step 1 above
3. **Deploy**: Trigger a deployment
4. **Verify**: Check the deployment logs for any environment variable errors

### 5. Troubleshooting

#### "supabaseUrl is required" Error
- Verify `VITE_SUPABASE_URL` is set correctly in Vercel dashboard
- Ensure the variable name has the exact `VITE_` prefix
- Redeploy after adding environment variables

#### Build Errors
- Check the build logs in Vercel dashboard
- Verify all required environment variables are set
- Make sure there are no typos in variable names

#### Runtime Errors
- Open browser developer tools to see detailed error messages
- Check if environment variables are properly loaded (they should be visible in the browser's network requests)

### 6. Testing Deployment

After successful deployment:

1. **Test Login**: Try logging in with a 6-digit code
2. **Test Database Connection**: Go to Settings → Database Test to verify Supabase connection
3. **Test Email**: Go to Settings → Email Test to verify EmailJS integration
4. **Check Console**: Open browser developer tools to see if there are any environment variable warnings

### 7. Security Notes

- Environment variables starting with `VITE_` are exposed to the client-side
- Never put sensitive server-only secrets in `VITE_` variables
- The anon key from Supabase is safe to expose client-side as it has Row Level Security (RLS) policies

### 8. Vercel Configuration

The `vercel.json` file is already configured with:
- Correct build command (`npm run build`)
- Output directory (`dist`)
- SPA routing support

No additional configuration should be needed.

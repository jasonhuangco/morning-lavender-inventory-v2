#!/bin/bash

# Morning Lavender Inventory - Quick Deployment Script
echo "🚀 Morning Lavender Inventory Management - Quick Deploy"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run:"
    echo "   git init"
    echo "   git remote add origin YOUR_GITHUB_REPO_URL"
    echo "   Then run this script again."
    exit 1
fi

# Test build first
echo "🔧 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

# Check for environment variables
echo "🔍 Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "✅ Environment file found"
else
    echo "⚠️  No .env.local file found. Make sure to set environment variables in Vercel dashboard."
fi

# Add and commit changes
echo "📝 Committing changes..."
git add .
echo "Enter commit message (or press Enter for default):"
read commit_message
if [ -z "$commit_message" ]; then
    commit_message="Deploy: Morning Lavender Inventory Management"
fi

git commit -m "$commit_message"

# Push to main branch
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to https://vercel.com/new"
    echo "2. Import your GitHub repository"
    echo "3. Add environment variables:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - VITE_EMAILJS_SERVICE_ID"
    echo "   - VITE_EMAILJS_TEMPLATE_ID"
    echo "   - VITE_EMAILJS_PUBLIC_KEY"
    echo "4. Deploy!"
    echo ""
    echo "📚 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Push failed. Please check your GitHub configuration."
fi

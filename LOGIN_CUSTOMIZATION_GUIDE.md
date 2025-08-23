# Login Screen Customization Guide

This guide explains how to customize the login/home screen for your Morning Lavender Inventory Management deployment.

## Overview

The login screen customization feature allows you to:
- Set a custom title that overrides the company name
- Add a custom subtitle below the main title
- Customize the instruction text above the login form
- Add a background image for a branded look
- Set a specific background color for the login screen

## Accessing Login Screen Settings

1. Sign in to your inventory system as an admin user
2. Navigate to **Settings** → **Branding Management**
3. Scroll down to the **Login Screen Customization** section

## Available Customization Options

### Custom Login Title
- **Purpose**: Override the main title shown on the login screen
- **Default**: Uses your company name from branding settings
- **Example**: "Welcome to Store Portal" instead of "Morning Lavender"

### Login Subtitle
- **Purpose**: Text displayed below the main title
- **Default**: "Inventory Management System"
- **Example**: "Staff Portal", "Store Management", "POS System"

### Login Description
- **Purpose**: Instructions shown above the login form
- **Default**: "Enter your 6-digit homebase code to continue"
- **Example**: "Enter your staff code", "Use your assigned PIN"

### Background Image URL
- **Purpose**: Add a branded background image
- **Format**: Full URL to an image (HTTPS recommended)
- **Best practices**: 
  - Use high-resolution images (1920x1080 or higher)
  - Ensure good contrast with white text overlay
  - Keep file size reasonable for fast loading

### Background Color Override
- **Purpose**: Set a specific background color for login screen
- **Default**: Uses main background color from branding settings
- **Format**: Hex color code (e.g., #1a365d)

## Design Tips

### For Background Images:
- Use darker images or images with dark overlays for better text readability
- The system automatically adds a 30% dark overlay when background images are used
- Text automatically switches to white/light colors when background images are present

### For Colors:
- Ensure good contrast between background and text colors
- Test on different devices and screen sizes
- Consider your brand colors for consistency

### For Text Content:
- Keep titles concise and memorable
- Make instructions clear and actionable
- Consider your staff/user audience when writing copy

## Preview Feature

The branding management page includes a live preview of your login screen customizations:
- Shows how the login screen will appear with your settings
- Updates in real-time as you make changes
- Includes the dark overlay effect for background images

## Database Storage

Login customization settings are stored in the `branding_settings` table with these fields:
- `login_title` - Custom title text
- `login_subtitle` - Subtitle text
- `login_description` - Instruction text
- `login_background_url` - Background image URL
- `login_background_color` - Background color override

## Migration for Existing Deployments

If you're upgrading an existing deployment, run the migration script:
```sql
-- File: add-login-customization.sql
ALTER TABLE branding_settings 
ADD COLUMN IF NOT EXISTS login_title TEXT,
ADD COLUMN IF NOT EXISTS login_subtitle TEXT,
ADD COLUMN IF NOT EXISTS login_description TEXT,
ADD COLUMN IF NOT EXISTS login_background_url TEXT,
ADD COLUMN IF NOT EXISTS login_background_color TEXT;
```

## Technical Implementation

The login screen customization works by:
1. Loading branding settings from the database via BrandingContext
2. Applying custom styles and content to the LoginPage component
3. Using fallback values when custom settings are empty
4. Automatically adjusting text colors for better readability with background images

## Example Configurations

### Coffee Shop Theme:
- **Title**: "Brew & Bean Staff Portal"
- **Subtitle**: "Inventory & POS System"
- **Description**: "Enter your 6-digit staff code"
- **Background**: Coffee shop interior image
- **Background Color**: #2D1B0F (dark brown)

### Retail Store Theme:
- **Title**: "Store Management Hub"
- **Subtitle**: "Team Dashboard"
- **Description**: "Access with your team ID"
- **Background**: Clean store interior
- **Background Color**: #F8F9FA (light gray)

### Minimalist Theme:
- **Title**: "" (empty - uses company name)
- **Subtitle**: "Management System"
- **Description**: "Please sign in"
- **Background**: None
- **Background Color**: #FFFFFF (white)

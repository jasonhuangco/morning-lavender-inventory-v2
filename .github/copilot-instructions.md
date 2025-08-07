<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Morning Lavender Inventory Management System

This is a mobile-first inventory management web application for a café chain with multiple locations.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM
- **Database**: Supabase (to be integrated)
- **Email**: EmailJS for notifications
- **Authentication**: Google OAuth 2.0 (to be integrated)

## Project Structure
- Mobile-first responsive design
- Multi-page application (not SPA)
- Context-based state management
- Component-driven architecture

## Key Features
1. **Inventory Counting**: Track quantities across multiple locations
2. **Order Management**: Generate orders based on minimum thresholds
3. **Settings Management**: Manage locations, categories, suppliers, and products
4. **Order History**: View past orders and drafts
5. **Email Notifications**: Send order summaries via EmailJS
6. **Category-based User Access**: Restrict users to specific product categories

## Design Principles
- Large, touch-friendly buttons for mobile use
- Clean, modern interface optimized for café staff
- Auto-check ordering logic based on minimum thresholds
- Multi-select category filtering
- Checkbox-only items for certain products

## Authentication & Access Control
- Restricted to @morninglavender.com email domain
- Google OAuth 2.0 integration (pending setup)
- Session management via localStorage (temporary)
- Category-based access control for restricting users to specific product categories

## Integration Points
- **Supabase**: All data persistence (products, locations, orders, etc.)
- **EmailJS**: Order notification emails
- **Google OAuth**: Domain-restricted authentication

## Development Notes
- Currently using mock data for development
- All external integrations are prepared but not yet configured
- Mobile-optimized with responsive design patterns
- Tailwind CSS custom color scheme based on café branding

When working on this project:
1. Maintain mobile-first approach
2. Follow existing component patterns
3. Use TypeScript strictly
4. Ensure all features work on touch devices
5. Keep accessibility in mind
6. Follow the established design system

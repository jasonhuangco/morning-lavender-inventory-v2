# Morning Lavender Inventory Management System

A mobile-first inventory management web application designed specifically for café operations across multiple locations.

## 🚀 Features

### Core Functionality
- **Multi-Location Inventory Tracking**: Count and manage inventory across different café locations
- **Smart Ordering System**: Auto-check items below minimum thresholds for ordering
- **Category-Based Organization**: Filter and organize products by categories (Coffee, Pastries, Cleaning, etc.)
- **Supplier Management**: Track which suppliers provide each product
- **Order History**: View and manage past orders and draft orders

### User Experience
- **Mobile-First Design**: Optimized for tablets and phones used by café staff
- **Large Touch Controls**: Easy-to-use interface with large buttons and touch-friendly inputs
- **Real-Time Updates**: Instant feedback on quantity changes and order status
- **Offline-Capable**: Designed to work reliably in café environments

### Administrative Features
- **Location Management**: Add and manage multiple café locations
- **Product Catalog**: Complete product management with categories, suppliers, and thresholds
- **User Management**: Domain-restricted access (@morninglavender.com only)
- **Email Notifications**: Automatic order summaries sent via EmailJS

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM (multi-page application)
- **Database**: Supabase (ready for integration)
- **Email**: EmailJS for order notifications
- **Authentication**: Google OAuth 2.0 (ready for integration)
- **Icons**: Lucide React

## 📱 Mobile Optimization

This application is built with mobile devices as the primary target:
- Touch-friendly interface with large interactive elements
- Responsive design that works on all screen sizes
- Optimized performance for mobile browsers
- Offline-first approach for reliable café operations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd inventory-ai-v3
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables (Coming Soon)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Next Steps for Production
1. **Supabase Setup**: Configure database tables and RLS policies
2. **Google OAuth**: Set up OAuth 2.0 with domain restrictions
3. **EmailJS Configuration**: Set up email templates and service
4. **Domain Deployment**: Deploy to production environment

## 📊 Database Schema (Supabase)

The application is designed to work with the following tables:
- `locations` - Café locations
- `categories` - Product categories
- `suppliers` - Product suppliers
- `products` - Inventory items
- `orders` - Order history
- `order_items` - Individual order line items

## 🎨 Design System

The application uses a custom design system built on Tailwind CSS:
- **Primary Colors**: Orange/coffee theme matching Morning Lavender branding
- **Typography**: System fonts optimized for readability
- **Components**: Reusable UI components with consistent styling
- **Mobile-First**: All components designed for mobile interaction

## 🔐 Security & Access Control

- **Domain Restriction**: Access limited to @morninglavender.com email addresses
- **Google OAuth 2.0**: Secure authentication with Google
- **Row Level Security**: Supabase RLS for data protection
- **Input Validation**: Client and server-side validation

## 📧 Email Integration

Order summaries are automatically sent via EmailJS including:
- User name and location
- Items requiring restocking
- Current quantities and minimum thresholds
- Supplier information for easy ordering

## 🤝 Contributing

This is a private project for Morning Lavender café operations. For questions or support, please contact the development team.

## 📄 License

Private software - All rights reserved.

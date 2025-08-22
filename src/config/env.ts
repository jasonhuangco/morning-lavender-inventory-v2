// Debug environment variables in development
if (import.meta.env.DEV) {
  console.log('🔧 Environment Variables Debug:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('VITE_EMAILJS_SERVICE_ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID ? '✅ Set' : '❌ Missing');
  console.log('VITE_EMAILJS_TEMPLATE_ID:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID ? '✅ Set' : '❌ Missing');
  console.log('VITE_EMAILJS_PUBLIC_KEY:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
  console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
}

// Environment configuration
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  emailjs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  },
};

// Runtime validation for critical environment variables
if (!config.supabase.url) {
  throw new Error('❌ VITE_SUPABASE_URL is required but not set. Please check your environment variables in Vercel dashboard.');
}

if (!config.supabase.anonKey) {
  throw new Error('❌ VITE_SUPABASE_ANON_KEY is required but not set. Please check your environment variables in Vercel dashboard.');
}

// Validation helper
export const validateConfig = () => {
  const missing: string[] = [];
  
  if (!config.supabase.url) missing.push('VITE_SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!config.emailjs.serviceId) missing.push('VITE_EMAILJS_SERVICE_ID');
  if (!config.emailjs.templateId) missing.push('VITE_EMAILJS_TEMPLATE_ID');
  if (!config.emailjs.publicKey) missing.push('VITE_EMAILJS_PUBLIC_KEY');
  if (!config.google.clientId) missing.push('VITE_GOOGLE_CLIENT_ID');
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Development mode check
export const isDevelopment = import.meta.env.DEV;

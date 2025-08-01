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

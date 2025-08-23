// Utility for server-side branding injection
// This helps prevent flash of default branding by injecting styles early

export interface BrandingColors {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
}

// Generate inline CSS for immediate branding application
export const generateBrandingCSS = (branding: BrandingColors): string => {
  return `
    :root {
      --primary-color: ${branding.primary_color};
      --secondary-color: ${branding.secondary_color};
      --accent-color: ${branding.accent_color};
      --text-color: ${branding.text_color};
      --background-color: ${branding.background_color};
    }
    body {
      background-color: ${branding.background_color} !important;
      color: ${branding.text_color} !important;
      transition: none !important;
    }
  `;
};

// Script to inject at build time for specific clients
export const generateBrandingScript = (branding: BrandingColors): string => {
  return `
    <script>
      (function() {
        var style = document.createElement('style');
        style.textContent = \`${generateBrandingCSS(branding).replace(/`/g, '\\`')}\`;
        document.head.insertBefore(style, document.head.firstChild);
      })();
    </script>
  `;
};

// Environment-based branding configuration
// This can be set per deployment via environment variables
export const getEnvironmentBranding = (): BrandingColors | null => {
  // Check for environment-specific branding
  if (import.meta.env.VITE_CUSTOM_PRIMARY_COLOR) {
    return {
      primary_color: import.meta.env.VITE_CUSTOM_PRIMARY_COLOR || '#8B4513',
      secondary_color: import.meta.env.VITE_CUSTOM_SECONDARY_COLOR || '#E6E6FA',
      accent_color: import.meta.env.VITE_CUSTOM_ACCENT_COLOR || '#DDA0DD',
      text_color: import.meta.env.VITE_CUSTOM_TEXT_COLOR || '#374151',
      background_color: import.meta.env.VITE_CUSTOM_BACKGROUND_COLOR || '#F9FAFB'
    };
  }
  
  return null;
};

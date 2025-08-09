import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrandingSettings } from '../types';
import { config } from '../config/env';

interface BrandingContextType {
  branding: BrandingSettings | null;
  loading: boolean;
  updateBranding: (settings: Partial<BrandingSettings>) => Promise<void>;
  applyTheme: () => void;
  resetToDefault: () => Promise<void>;
}

const defaultBranding: BrandingSettings = {
  id: 'default', // This will be replaced with actual UUID from database
  company_name: 'Morning Lavender',
  logo_url: '',
  icon_url: '',
  primary_color: '#8B4513', // Coffee brown
  secondary_color: '#E6E6FA', // Lavender
  accent_color: '#DDA0DD', // Plum
  text_color: '#374151',
  background_color: '#F9FAFB',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: ReactNode;
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  useEffect(() => {
    if (branding) {
      applyTheme();
    }
  }, [branding]);

  const loadBranding = async () => {
    try {
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      // Get the first branding record (there should only be one)
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.log('No branding settings found, using defaults');
        setBranding(defaultBranding);
      } else {
        setBranding(data);
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (settings: Partial<BrandingSettings>) => {
    try {
      const supabase = createClient(config.supabase.url, config.supabase.anonKey);
      
      // Create clean update object without invalid ID
      const cleanSettings = {
        company_name: settings.company_name || branding?.company_name || defaultBranding.company_name,
        logo_url: settings.logo_url !== undefined ? settings.logo_url : (branding?.logo_url || defaultBranding.logo_url),
        icon_url: settings.icon_url !== undefined ? settings.icon_url : (branding?.icon_url || defaultBranding.icon_url),
        primary_color: settings.primary_color || branding?.primary_color || defaultBranding.primary_color,
        secondary_color: settings.secondary_color || branding?.secondary_color || defaultBranding.secondary_color,
        accent_color: settings.accent_color || branding?.accent_color || defaultBranding.accent_color,
        text_color: settings.text_color || branding?.text_color || defaultBranding.text_color,
        background_color: settings.background_color || branding?.background_color || defaultBranding.background_color,
        updated_at: new Date().toISOString()
      };

      let data;
      if (branding?.id && branding.id !== 'default') {
        // Update existing record
        const { data: updateData, error } = await supabase
          .from('branding_settings')
          .update(cleanSettings)
          .eq('id', branding.id)
          .select()
          .single();

        if (error) throw error;
        data = updateData;
      } else {
        // Insert new record (first time setup or reset)
        const { data: insertData, error } = await supabase
          .from('branding_settings')
          .insert(cleanSettings)
          .select()
          .single();

        if (error) throw error;
        data = insertData;
      }

      setBranding(data);
      applyTheme();
    } catch (error) {
      console.error('Error updating branding:', error);
      throw error;
    }
  };

  const applyTheme = () => {
    if (!branding) return;

    const root = document.documentElement;
    
    // Update CSS custom properties
    root.style.setProperty('--primary-color', branding.primary_color);
    root.style.setProperty('--secondary-color', branding.secondary_color);
    root.style.setProperty('--accent-color', branding.accent_color);
    root.style.setProperty('--text-color', branding.text_color);
    root.style.setProperty('--background-color', branding.background_color);

    // Update document title
    document.title = `${branding.company_name} - Inventory Management`;

    // Update favicon if icon_url is provided
    if (branding.icon_url) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.icon_url;
      
      // Also update apple-touch-icon if it exists
      let appleFavicon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (appleFavicon) {
        appleFavicon.href = branding.icon_url;
      }
    }

    // Force reflow to ensure styles are applied
    document.body.offsetHeight;
    
    // Trigger a custom event to notify components of theme change
    const themeChangeEvent = new CustomEvent('themeChange', {
      detail: { branding }
    });
    window.dispatchEvent(themeChangeEvent);
  };

  const resetToDefault = async () => {
    try {
      // Only pass the color and branding properties, not the ID
      const defaultSettings = {
        company_name: defaultBranding.company_name,
        logo_url: defaultBranding.logo_url,
        icon_url: defaultBranding.icon_url,
        primary_color: defaultBranding.primary_color,
        secondary_color: defaultBranding.secondary_color,
        accent_color: defaultBranding.accent_color,
        text_color: defaultBranding.text_color,
        background_color: defaultBranding.background_color
      };
      
      await updateBranding(defaultSettings);
    } catch (error) {
      console.error('Failed to reset to default branding:', error);
      throw error;
    }
  };

  return (
    <BrandingContext.Provider value={{
      branding,
      loading,
      updateBranding,
      applyTheme,
      resetToDefault
    }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

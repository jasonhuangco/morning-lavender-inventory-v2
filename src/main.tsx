import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getEnvironmentBranding } from './utils/brandingSSR.ts'

// Import debug utility (will auto-run in development)
import './utils/debugDatabase'

// Apply branding immediately before React even starts
// This prevents any flash of default colors
const envBranding = getEnvironmentBranding();
if (envBranding) {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', envBranding.primary_color);
  root.style.setProperty('--secondary-color', envBranding.secondary_color);
  root.style.setProperty('--accent-color', envBranding.accent_color);
  root.style.setProperty('--text-color', envBranding.text_color);
  root.style.setProperty('--background-color', envBranding.background_color);
  
  // Apply body styles immediately
  document.body.style.backgroundColor = envBranding.background_color;
  document.body.style.color = envBranding.text_color;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

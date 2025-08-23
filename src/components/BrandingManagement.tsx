import { useState } from 'react';
import { Upload, Palette, Image, FileImage, RotateCcw, Save } from 'lucide-react';
import { useBranding } from '../contexts/BrandingContext';

export function BrandingManagement() {
  const { branding, loading, updateBranding, resetToDefault } = useBranding();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: branding?.company_name || '',
    logo_url: branding?.logo_url || '',
    icon_url: branding?.icon_url || '',
    primary_color: branding?.primary_color || '#8B4513',
    secondary_color: branding?.secondary_color || '#E6E6FA',
    accent_color: branding?.accent_color || '#DDA0DD',
    text_color: branding?.text_color || '#374151',
    background_color: branding?.background_color || '#F9FAFB',
    // Login screen customization
    login_title: branding?.login_title || '',
    login_subtitle: branding?.login_subtitle || '',
    login_description: branding?.login_description || '',
    login_background_url: branding?.login_background_url || '',
    login_background_color: branding?.login_background_color || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBranding(formData);
      alert('Branding settings saved successfully!');
    } catch (error) {
      console.error('Error saving branding:', error);
      alert('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset to default branding? This cannot be undone.')) {
      setSaving(true);
      try {
        await resetToDefault();
        // Update form data with default values
        setFormData({
          company_name: 'Morning Lavender',
          logo_url: '',
          icon_url: '',
          primary_color: '#8B4513',
          secondary_color: '#E6E6FA',
          accent_color: '#DDA0DD',
          text_color: '#374151',
          background_color: '#F9FAFB',
          login_title: '',
          login_subtitle: '',
          login_description: '',
          login_background_url: '',
          login_background_color: ''
        });
        alert('Branding reset to defaults successfully!');
      } catch (error) {
        console.error('Error resetting branding:', error);
        alert('Failed to reset branding settings');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleImageUpload = (field: 'logo_url' | 'icon_url', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll use a data URL. In production, you'd upload to a storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        handleInputChange(field, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Branding Settings</h2>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter company name"
              />
            </div>
          </div>
        </div>

        {/* Logo & Icon Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo & Icon</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo (Header)
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain rounded" />
                  ) : (
                    <Image className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('logo_url', e)}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Logo</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Used in app header. Recommended: 200x200px, PNG or JPG</p>
                </div>
              </div>
              <div className="mt-2">
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  placeholder="Or paste logo image URL"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon/Favicon (Login & Browser)
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {formData.icon_url ? (
                    <img src={formData.icon_url} alt="Icon" className="w-full h-full object-contain rounded" />
                  ) : (
                    <FileImage className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="icon-upload"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('icon_url', e)}
                    className="hidden"
                  />
                  <label
                    htmlFor="icon-upload"
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Icon</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Used on login page and browser favicon. Recommended: 64x64px, ICO or PNG</p>
                </div>
              </div>
              <div className="mt-2">
                <input
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) => handleInputChange('icon_url', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  placeholder="Or paste icon image URL"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Scheme</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Main brand color</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Supporting color</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Buttons, highlights</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => handleInputChange('text_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.text_color}
                  onChange={(e) => handleInputChange('text_color', e.target.value)}
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Main text color</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => handleInputChange('background_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.background_color}
                  onChange={(e) => handleInputChange('background_color', e.target.value)}
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Page background</p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: formData.background_color, color: formData.text_color }}
            >
              <div className="flex items-center space-x-4 mb-3">
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: formData.primary_color }}
                ></div>
                <span className="font-semibold">{formData.company_name}</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  Primary Button
                </button>
                <button 
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: formData.accent_color }}
                >
                  Accent Button
                </button>
                <div 
                  className="px-3 py-1 rounded text-sm"
                  style={{ backgroundColor: formData.secondary_color, color: formData.text_color }}
                >
                  Secondary Element
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Screen Customization */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Screen Customization</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Login Title
              </label>
              <input
                type="text"
                value={formData.login_title}
                onChange={(e) => handleInputChange('login_title', e.target.value)}
                placeholder="Leave empty to use company name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Override the main title on login screen</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Subtitle
              </label>
              <input
                type="text"
                value={formData.login_subtitle}
                onChange={(e) => handleInputChange('login_subtitle', e.target.value)}
                placeholder="e.g., Inventory Management System"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Subtitle text below company name</p>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Description
              </label>
              <textarea
                value={formData.login_description}
                onChange={(e) => handleInputChange('login_description', e.target.value)}
                placeholder="e.g., Enter your 6-digit homebase code to continue"
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Instructions shown above login form</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Image URL
              </label>
              <input
                type="url"
                value={formData.login_background_url}
                onChange={(e) => handleInputChange('login_background_url', e.target.value)}
                placeholder="https://example.com/background.jpg"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Optional background image for login screen</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color Override
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.login_background_color || formData.background_color}
                  onChange={(e) => handleInputChange('login_background_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.login_background_color || formData.background_color}
                  onChange={(e) => handleInputChange('login_background_color', e.target.value)}
                  placeholder="Leave empty to use main background color"
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Specific background color for login screen</p>
            </div>
          </div>

          {/* Login Screen Preview */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Login Screen Preview</h4>
            <div 
              className="relative p-8 rounded-lg min-h-[200px] flex items-center justify-center"
              style={{ 
                backgroundColor: formData.login_background_color || formData.background_color,
                backgroundImage: formData.login_background_url ? `url(${formData.login_background_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {formData.login_background_url && (
                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg"></div>
              )}
              <div className="relative text-center max-w-md">
                <div className="flex justify-center mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: formData.primary_color + '20' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: formData.primary_color }}
                    ></div>
                  </div>
                </div>
                <h2 
                  className="text-2xl font-bold mb-2"
                  style={{ color: formData.login_background_url ? '#ffffff' : formData.text_color }}
                >
                  {formData.login_title || formData.company_name}
                </h2>
                <p 
                  className="text-sm mb-4"
                  style={{ color: formData.login_background_url ? '#e5e7eb' : formData.text_color }}
                >
                  {formData.login_subtitle || 'Inventory Management System'}
                </p>
                <p 
                  className="text-xs mb-6"
                  style={{ color: formData.login_background_url ? '#d1d5db' : '#6b7280' }}
                >
                  {formData.login_description || 'Enter your 6-digit homebase code to continue'}
                </p>
                <div className="space-y-3">
                  <div className="w-full h-12 bg-white bg-opacity-90 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 font-mono">000000</span>
                  </div>
                  <button 
                    className="w-full h-12 rounded-md text-white font-medium"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

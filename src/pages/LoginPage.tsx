import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import appleTouchIcon from '/apple-touch-icon.png';

export default function LoginPage() {
  const [loginCode, setLoginCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithCode } = useAuth();
  const { branding } = useBranding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!loginCode || loginCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await signInWithCode(loginCode);
    } catch (error: any) {
      console.error('Sign in failed:', error);
      setError(error.message || 'Invalid login code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setLoginCode(value);
      setError(''); // Clear error when user types
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: branding?.login_background_color || branding?.background_color || '#F9FAFB',
        backgroundImage: branding?.login_background_url ? `url(${branding.login_background_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background overlay for better text readability when using background image */}
      {branding?.login_background_url && (
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      )}
      
      <div className="relative max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center justify-center h-32 w-32 rounded-full bg-primary-100">
              <img 
                src={branding?.icon_url || appleTouchIcon} 
                alt={`${branding?.company_name || 'Morning Lavender'} Icon`} 
                className="h-16 w-16 object-contain rounded-full"
              />
            </div>
          </div>
          <h2 
            className="mt-6 text-center text-3xl font-extrabold" 
            style={{
              fontFamily: 'Georgia, serif',
              color: branding?.login_background_url ? '#ffffff' : branding?.text_color || '#111827'
            }}
          >
            {branding?.login_title || branding?.company_name || 'Morning Lavender'}
          </h2>
          <p 
            className="mt-2 text-center text-sm"
            style={{
              color: branding?.login_background_url ? '#e5e7eb' : branding?.text_color || '#6b7280'
            }}
          >
            {branding?.login_subtitle || 'Inventory Management System'}
          </p>
          <p 
            className="mt-4 text-center text-xs"
            style={{
              color: branding?.login_background_url ? '#d1d5db' : '#6b7280'
            }}
          >
            {branding?.login_description || 'Enter your 6-digit homebase code to continue'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="login-code" className="sr-only">
              Login Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="login-code"
                name="login-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                required
                maxLength={6}
                value={loginCode}
                onChange={handleCodeChange}
                className="appearance-none rounded-md relative block w-full px-3 py-4 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10"
                placeholder="000000"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800 text-center">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || loginCode.length !== 6}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

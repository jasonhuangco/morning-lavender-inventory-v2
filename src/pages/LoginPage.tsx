import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config/env';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100">
              <Coffee className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Morning Lavender
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inventory Management System
          </p>
          <p className="mt-4 text-center text-xs text-gray-500">
            Restricted to @morninglavender.com email addresses
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {config.google.clientId ? 'Sign in with Google' : 'Sign in with Demo Account'}
                </div>
              )}
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            {!config.google.clientId ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 font-medium">🧪 DEMO MODE ENABLED</p>
                <p className="text-blue-700 mt-1">OAuth is disabled for easier testing.</p>
                <p className="text-blue-700">Click the button above to sign in with a demo account.</p>
              </div>
            ) : (
              <div>
                <p>Sign in with your @morninglavender.com Google account</p>
                <p className="mt-1 text-yellow-600">Access is restricted to authorized domain only.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

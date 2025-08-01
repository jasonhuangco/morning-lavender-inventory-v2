import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { googleAuthService } from '../services/googleAuth';
import { config } from '../config/env';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Google OAuth
    const initializeAuth = async () => {
      if (config.google.clientId) {
        try {
          await googleAuthService.initialize();
          
          // Set up event listeners for Google OAuth
          const handleGoogleLogin = (event: CustomEvent) => {
            const { user, token } = event.detail;
            setUser(user);
            localStorage.setItem('inventory_user', JSON.stringify(user));
            localStorage.setItem('inventory_token', token);
          };

          const handleGoogleSignOut = () => {
            setUser(null);
            localStorage.removeItem('inventory_user');
            localStorage.removeItem('inventory_token');
          };

          window.addEventListener('googleLogin', handleGoogleLogin as EventListener);
          window.addEventListener('googleSignOut', handleGoogleSignOut as EventListener);

          // Cleanup function
          return () => {
            window.removeEventListener('googleLogin', handleGoogleLogin as EventListener);
            window.removeEventListener('googleSignOut', handleGoogleSignOut as EventListener);
          };
        } catch (error) {
          console.error('Failed to initialize Google OAuth:', error);
        }
      }
    };

    initializeAuth();

    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('inventory_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('inventory_user');
        localStorage.removeItem('inventory_token');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      
      if (config.google.clientId) {
        // Use Google OAuth
        await googleAuthService.signIn();
      } else {
        // Fallback to mock user for development
        const mockUser: User = {
          id: '1',
          email: 'demo@morninglavender.com',
          name: 'Demo User',
          picture: undefined
        };
        
        setUser(mockUser);
        localStorage.setItem('inventory_user', JSON.stringify(mockUser));
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('inventory_user');
    localStorage.removeItem('inventory_token');
    
    if (config.google.clientId) {
      googleAuthService.signOut();
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

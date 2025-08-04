import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { codeAuthService } from '../services/codeAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithCode: (loginCode: string) => Promise<void>;
  signOut: () => void;
  getUserDisplayName: () => string;
  getUserInitials: () => string;
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
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('inventory_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Validate that the saved user has the new structure
        if (parsedUser.first_name && parsedUser.last_name && parsedUser.login_code) {
          setUser(parsedUser);
        } else {
          // Clear old format user data
          localStorage.removeItem('inventory_user');
          localStorage.removeItem('inventory_token');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('inventory_user');
        localStorage.removeItem('inventory_token');
      }
    }
    setLoading(false);
  }, []);

  const signInWithCode = async (loginCode: string) => {
    try {
      setLoading(true);
      
      // Authenticate with the 6-digit code
      const authenticatedUser = await codeAuthService.authenticateWithCode(loginCode);
      
      // Save user to state and localStorage
      setUser(authenticatedUser);
      localStorage.setItem('inventory_user', JSON.stringify(authenticatedUser));
      
      console.log('✅ User authenticated successfully:', codeAuthService.getUserDisplayName(authenticatedUser));
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
    console.log('✅ User signed out successfully');
  };

  const getUserDisplayName = (): string => {
    if (!user) return '';
    return codeAuthService.getUserDisplayName(user);
  };

  const getUserInitials = (): string => {
    if (!user) return '';
    return codeAuthService.getUserInitials(user);
  };

  const value = {
    user,
    loading,
    signInWithCode,
    signOut,
    getUserDisplayName,
    getUserInitials
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

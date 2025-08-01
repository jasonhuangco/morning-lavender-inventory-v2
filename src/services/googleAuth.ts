import { config } from '../config/env';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = config.google.clientId;
const AUTHORIZED_DOMAIN = 'morninglavender.com';

// Types for Google OAuth response
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
  hd?: string; // Hosted domain (for Google Workspace)
}

interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

// Google OAuth service
export const googleAuthService = {
  // Initialize Google OAuth
  async initialize(): Promise<void> {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
      return;
    }

    return new Promise((resolve) => {
      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        // Initialize Google Identity Services
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        }
        resolve();
      };
      document.head.appendChild(script);
    });
  },

  // Handle the credential response from Google
  handleCredentialResponse(response: GoogleAuthResponse): void {
    try {
      // Decode the JWT token to get user info
      const userInfo = this.parseJwt(response.credential);
      
      // Validate the user's domain
      if (!this.isAuthorizedUser(userInfo)) {
        throw new Error('Access restricted to @morninglavender.com email addresses');
      }

      // Dispatch custom event with user data
      const loginEvent = new CustomEvent('googleLogin', {
        detail: {
          user: {
            id: (userInfo as any).sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          },
          token: response.credential,
        },
      });
      
      window.dispatchEvent(loginEvent);
    } catch (error) {
      console.error('OAuth error:', error);
      const errorEvent = new CustomEvent('googleLoginError', {
        detail: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      window.dispatchEvent(errorEvent);
    }
  },

  // Parse JWT token to extract user information
  parseJwt(token: string): GoogleUser {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  },

  // Check if user email is from authorized domain
  isAuthorizedUser(userInfo: GoogleUser): boolean {
    if (!userInfo.email || !userInfo.email_verified) {
      return false;
    }

    // Check if email ends with authorized domain
    const emailDomain = userInfo.email.split('@')[1];
    return emailDomain === AUTHORIZED_DOMAIN;
  },

  // Trigger Google sign-in popup
  async signIn(): Promise<void> {
    if (!window.google) {
      throw new Error('Google OAuth not initialized');
    }

    return new Promise((resolve, reject) => {
      // Set up event listeners for this sign-in attempt
      const handleLogin = (_event: CustomEvent) => {
        cleanup();
        resolve();
      };

      const handleError = (event: CustomEvent) => {
        cleanup();
        reject(new Error(event.detail.error));
      };

      const cleanup = () => {
        window.removeEventListener('googleLogin', handleLogin as EventListener);
        window.removeEventListener('googleLoginError', handleError as EventListener);
      };

      window.addEventListener('googleLogin', handleLogin as EventListener);
      window.addEventListener('googleLoginError', handleError as EventListener);

      // Trigger the Google sign-in popup
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
      } else {
        reject(new Error('Google Sign-In not properly initialized'));
      }
    });
  },

  // Sign out user
  async signOut(): Promise<void> {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    // Clear any stored tokens/session data
    const signOutEvent = new CustomEvent('googleSignOut');
    window.dispatchEvent(signOutEvent);
  },

  // Render Google Sign-In button
  renderButton(elementId: string): void {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      console.warn('Google OAuth not available');
      return;
    }

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
      }
    );
  },
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

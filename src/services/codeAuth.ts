import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { User } from '../types';

class CodeAuthService {
  private supabase = createClient(config.supabase.url, config.supabase.anonKey);

  async authenticateWithCode(loginCode: string): Promise<User> {
    // Validate code format
    if (!loginCode || !/^\d{6}$/.test(loginCode)) {
      throw new Error('Login code must be exactly 6 digits');
    }

    try {
      // Query the users table for the login code
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('login_code', loginCode)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Invalid login code');
      }

      if (!data) {
        throw new Error('Invalid login code');
      }

      // Return the user data
      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        login_code: data.login_code,
        email: data.email,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Helper function to get user's display name
  getUserDisplayName(user: User): string {
    return `${user.first_name} ${user.last_name}`;
  }

  // Helper function to get user's initials
  getUserInitials(user: User): string {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
}

export const codeAuthService = new CodeAuthService();

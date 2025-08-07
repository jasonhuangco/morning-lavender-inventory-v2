import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { User } from '../types';

class CodeAuthService {
  private supabase = createClient(config.supabase.url, config.supabase.anonKey);

  // Mock users for fallback when database is not available
  private mockUsers: User[] = [
    {
      id: '1',
      first_name: 'Admin',
      last_name: 'User',
      login_code: '236868',
      email: 'admin1@morninglavender.com',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      first_name: 'Manager',
      last_name: 'Admin',
      login_code: '622366',
      email: 'admin2@morninglavender.com',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      first_name: 'Super',
      last_name: 'Admin',
      login_code: '054673',
      email: 'admin3@morninglavender.com',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      first_name: 'Test',
      last_name: 'Admin',
      login_code: '111111',
      email: 'testadmin@morninglavender.com',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      first_name: 'Demo',
      last_name: 'Admin',
      login_code: '999999',
      email: 'demoadmin@morninglavender.com',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6',
      first_name: 'Staff',
      last_name: 'Member',
      login_code: '222222',
      email: 'staff@morninglavender.com',
      role: 'staff',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '7',
      first_name: 'Store',
      last_name: 'Employee',
      login_code: '333333',
      email: 'employee@morninglavender.com',
      role: 'staff',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  async authenticateWithCode(loginCode: string): Promise<User> {
    // Validate code format
    if (!loginCode || !/^\d{6}$/.test(loginCode)) {
      throw new Error('Login code must be exactly 6 digits');
    }

    try {
      // First try to authenticate with database
      const { data, error } = await this.supabase
        .from('users')
        .select('*, assigned_categories')
        .eq('login_code', loginCode)
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn('Database authentication failed, trying mock users:', error.message);
        
        // Fall back to mock users
        const mockUser = this.mockUsers.find(user => user.login_code === loginCode && user.is_active);
        if (mockUser) {
          console.log('✅ Authenticated with mock user:', mockUser.first_name, mockUser.last_name, 'Role:', mockUser.role);
          return mockUser;
        }
        
        throw new Error('Invalid login code');
      }

      if (!data) {
        // Try mock users as fallback
        const mockUser = this.mockUsers.find(user => user.login_code === loginCode && user.is_active);
        if (mockUser) {
          console.log('✅ Authenticated with mock user:', mockUser.first_name, mockUser.last_name, 'Role:', mockUser.role);
          return mockUser;
        }
        
        throw new Error('Invalid login code');
      }

      // Use the role from the database - this is the source of truth
      // The database role should always take precedence over any hardcoded values
      const role = data.role || 'staff';

      console.log('✅ Authenticated with database user:', data.first_name, data.last_name, 'Role:', role, '(from database)');

      // Return the user data
      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        login_code: data.login_code,
        email: data.email,
        role: role,
        assigned_categories: data.assigned_categories,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.warn('Database authentication error, trying mock users:', error);
      
      // Final fallback to mock users
      const mockUser = this.mockUsers.find(user => user.login_code === loginCode && user.is_active);
      if (mockUser) {
        console.log('✅ Authenticated with mock user (fallback):', mockUser.first_name, mockUser.last_name, 'Role:', mockUser.role);
        return mockUser;
      }
      
      console.error('Authentication failed completely:', error);
      throw new Error('Invalid login code');
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

  // Helper function to check if user is admin
  isAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  // Helper function to check if user is staff
  isStaff(user: User): boolean {
    return user.role === 'staff';
  }
}

export const codeAuthService = new CodeAuthService();

/**
 * Constants for the Role-Based Access Control System
 * 
 * NOTE: As of the latest update, roles are determined by the database, not these hardcoded arrays.
 * These constants are kept for reference and fallback purposes only.
 */

// DEPRECATED: These arrays are no longer used for role determination
// Database roles take precedence over these hardcoded values
export const ADMIN_CODES = [
  '236868', // Original admin code (now database-controlled)
  '622366', // Original admin code (now database-controlled)
  '054673', // Original admin code (now database-controlled)
  '111111', // Test admin code
  '999999'  // Demo admin code
];

export const STAFF_CODES = [
  '222222', // Staff member
  '333333'  // Store employee
];

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Check if a login code belongs to an admin user
 * @deprecated This function is deprecated. Roles are now determined by the database.
 */
export function isAdminCode(loginCode: string): boolean {
  return ADMIN_CODES.includes(loginCode);
}

/**
 * Check if a login code belongs to a staff user
 */
export function isStaffCode(loginCode: string): boolean {
  return STAFF_CODES.includes(loginCode);
}

/**
 * Get the role for a given login code
 */
export function getRoleForCode(loginCode: string): UserRole {
  if (isAdminCode(loginCode)) {
    return USER_ROLES.ADMIN;
  }
  return USER_ROLES.STAFF;
}

/**
 * Role names enum for consistent role checking across the application
 */
export enum RoleName {
  ADMIN = 'admin',
  OWNER = 'owner',
  CUSTOMER = 'customer',
}

/**
 * Helper function to check if a role name is valid
 */
export const isValidRoleName = (roleName: string): roleName is RoleName => {
  return Object.values(RoleName).includes(roleName as RoleName);
};

/**
 * Get all role names as an array
 */
export const getAllRoleNames = (): string[] => {
  return Object.values(RoleName);
};

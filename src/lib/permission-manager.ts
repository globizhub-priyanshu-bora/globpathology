/**
 * Permission Manager
 * Handles role-based and permission-based access control
 */

export type UserRole = 'admin' | 'cashier' | 'lab_tech' | 'receptionist' | 'doctor';

interface PermissionMap {
  [key: string]: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: PermissionMap | null | undefined,
  module: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean {
  if (!permissions || !permissions[module]) {
    return false;
  }
  return permissions[module][action] === true;
}

/**
 * Check if user has any permission for a module
 */
export function hasModuleAccess(
  permissions: PermissionMap | null | undefined,
  module: string
): boolean {
  if (!permissions || !permissions[module]) {
    return false;
  }
  return Object.values(permissions[module]).some(val => val === true);
}

/**
 * Check if user role is allowed to access route
 */
export function hasRoleAccess(userRole: string, requiredRoles?: string | string[]): boolean {
  // Admin has access to everything
  if (userRole === 'admin' || userRole === 'Admin') {
    return true;
  }

  // If no specific role required, allow access
  if (!requiredRoles) {
    return true;
  }

  // Check if user role matches required roles
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.some(role => 
    userRole.toLowerCase() === role.toLowerCase()
  );
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissionsForRole(role: string): PermissionMap {
  const adminPermissions: PermissionMap = {
    patients: { view: true, create: true, edit: true, delete: true },
    bills: { view: true, create: true, edit: true, delete: true },
    tests: { view: true, create: true, edit: true, delete: true },
    parameters: { view: true, create: true, edit: true, delete: true },
    doctors: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
  };

  const cashierPermissions: PermissionMap = {
    patients: { view: true, create: true, edit: false, delete: false },
    bills: { view: true, create: true, edit: true, delete: false },
    tests: { view: true, create: false, edit: false, delete: false },
    parameters: { view: true, create: false, edit: false, delete: false },
    doctors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
  };

  const labTechPermissions: PermissionMap = {
    patients: { view: true, create: false, edit: false, delete: false },
    bills: { view: true, create: false, edit: false, delete: false },
    tests: { view: true, create: true, edit: true, delete: false },
    parameters: { view: true, create: false, edit: false, delete: false },
    doctors: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: true, edit: true, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
  };

  const roleMap: { [key: string]: PermissionMap } = {
    admin: adminPermissions,
    Admin: adminPermissions,
    cashier: cashierPermissions,
    Cashier: cashierPermissions,
    lab_tech: labTechPermissions,
    'Lab Technician': labTechPermissions,
    receptionist: { 
      patients: { view: true, create: true, edit: false, delete: false },
      bills: { view: true, create: false, edit: false, delete: false },
      tests: { view: true, create: false, edit: false, delete: false },
      parameters: { view: false, create: false, edit: false, delete: false },
      doctors: { view: true, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
    },
  };

  return roleMap[role] || {};
}

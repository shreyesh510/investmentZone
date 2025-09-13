export interface UserPermissions {
  AiChat: boolean;
  investment: boolean;
  // Add more permissions here as needed in the future
  // Trading?: boolean;
  // AdminAccess?: boolean;
}

export interface Permission {
  _id?: string;
  userId: string;
  permissions: UserPermissions;
}

// Default permissions for new users
export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  AiChat: false, // Disabled by default
  investment: false, // Disabled by default
};

// Permission checker utility functions
export const hasPermission = (userPermissions: UserPermissions | null, permission: keyof UserPermissions): boolean => {
  if (!userPermissions) return false;
  return userPermissions[permission] === true;
};

export const canAccessAiChat = (userPermissions: UserPermissions | null): boolean => {
  return hasPermission(userPermissions, 'AiChat');
};

export const canAccessInvestment = (userPermissions: UserPermissions | null): boolean => {
  return hasPermission(userPermissions, 'investment');
};

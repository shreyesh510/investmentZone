export interface Permission {
  _id?: string; // MongoDB/Firestore document ID
  userId: string;
  permissions: UserPermissions;
}

export interface UserPermissions {
  AiChat: boolean;
  investment: boolean;
  // Add more permissions here as needed in the future
  // Trading?: boolean;
  // AdminAccess?: boolean;
}

export class PermissionEntity implements Permission {
  _id?: string;
  userId: string;
  permissions: UserPermissions;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}

// Default permissions for new users
export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  AiChat: false, // Disabled by default
  investment: false, // Disabled by default
};

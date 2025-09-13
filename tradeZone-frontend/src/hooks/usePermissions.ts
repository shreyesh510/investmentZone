import { useAppSelector } from '../redux/hooks';
import { canAccessAiChat, canAccessInvestment, hasPermission, type UserPermissions, DEFAULT_USER_PERMISSIONS } from '../types/permissions';

export const usePermissions = () => {
  const user = useAppSelector((state) => state.auth.user);
  // Use permissions from user, fallback to defaults if not available
  const permissions = user?.permissions || DEFAULT_USER_PERMISSIONS;

  return {
    permissions,
    hasPermission: (permission: keyof UserPermissions) => hasPermission(permissions, permission),
    canAccessAiChat: () => canAccessAiChat(permissions),
    canAccessInvestment: () => canAccessInvestment(permissions),
    // Add more permission checkers as needed
  };
};
    
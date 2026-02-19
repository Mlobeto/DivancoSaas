import { useAuthStore } from "@/store/auth.store";
import { useMemo } from "react";

/**
 * Hook to check user permissions
 *
 * @example
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
 *
 * if (hasPermission("users:create")) {
 *   // Show create button
 * }
 */
export function usePermissions() {
  const { permissions, role } = useAuthStore();

  const permissionUtils = useMemo(() => {
    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: string): boolean => {
      if (!permissions) return false;

      // SUPER_ADMIN and OWNER have all permissions
      if (role === "SUPER_ADMIN" || role === "OWNER") return true;

      return permissions.includes(permission);
    };

    /**
     * Check if user has ANY of the specified permissions
     */
    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
      if (!permissions) return false;

      // SUPER_ADMIN and OWNER have all permissions
      if (role === "SUPER_ADMIN" || role === "OWNER") return true;

      return requiredPermissions.some((perm) => permissions.includes(perm));
    };

    /**
     * Check if user has ALL of the specified permissions
     */
    const hasAllPermissions = (requiredPermissions: string[]): boolean => {
      if (!permissions) return false;

      // SUPER_ADMIN and OWNER have all permissions
      if (role === "SUPER_ADMIN" || role === "OWNER") return true;

      return requiredPermissions.every((perm) => permissions.includes(perm));
    };

    return {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      permissions,
      role,
    };
  }, [permissions, role]);

  return permissionUtils;
}

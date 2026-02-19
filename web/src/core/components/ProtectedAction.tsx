import { ReactNode } from "react";
import { usePermissions } from "@/core/hooks/usePermissions";

interface ProtectedActionProps {
  /** Single permission required */
  permission?: string;

  /** Multiple permissions - user needs ANY of them */
  anyPermissions?: string[];

  /** Multiple permissions - user needs ALL of them */
  allPermissions?: string[];

  /** Content to show when user has permission */
  children: ReactNode;

  /** Optional fallback content when user lacks permission */
  fallback?: ReactNode;
}

/**
 * Component to conditionally render UI based on user permissions
 *
 * @example
 * // Single permission
 * <ProtectedAction permission="users:create">
 *   <button>Create User</button>
 * </ProtectedAction>
 *
 * @example
 * // Any permission (OR logic)
 * <ProtectedAction anyPermissions={["users:update", "users:delete"]}>
 *   <button>Edit User</button>
 * </ProtectedAction>
 *
 * @example
 * // All permissions (AND logic)
 * <ProtectedAction allPermissions={["contracts:read", "contracts:approve"]}>
 *   <button>Approve Contract</button>
 * </ProtectedAction>
 *
 * @example
 * // With fallback
 * <ProtectedAction permission="reports:create" fallback={<span>No access</span>}>
 *   <button>Create Report</button>
 * </ProtectedAction>
 */
export function ProtectedAction({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}: ProtectedActionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Any permissions check (OR)
  if (anyPermissions && anyPermissions.length > 0) {
    return hasAnyPermission(anyPermissions) ? <>{children}</> : <>{fallback}</>;
  }

  // All permissions check (AND)
  if (allPermissions && allPermissions.length > 0) {
    return hasAllPermissions(allPermissions) ? (
      <>{children}</>
    ) : (
      <>{fallback}</>
    );
  }

  // No permissions specified - render children by default
  return <>{children}</>;
}

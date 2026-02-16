/**
 * TIPOS COMPARTIDOS CON EL BACKEND
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role?: "SUPER_ADMIN" | "DEVELOPER" | "USER"; // Global role from User model
}

/**
 * User Role Permissions:
 *
 * SUPER_ADMIN:
 * - Full system access
 * - Can manage tenants and modules
 * - Can assign modules to tenants
 * - Cross-tenant access
 *
 * DEVELOPER:
 * - System inspection and debugging
 * - Access to logs, metrics, and analytics
 * - View system architecture
 * - Read-only access (cannot modify data)
 * - Useful for developers auditing the system
 *
 * USER:
 * - Standard user with role-based permissions per Business Unit
 * - Access controlled by BU roles (OWNER, ADMIN, MANAGER, etc.)
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status?: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  country?: string;
  billingEmail?: string;
  enabledModules?: string[]; // Modules assigned to this tenant
  vertical?: string | null; // Vertical assigned to this tenant
}

export interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  description?: string;
  enabledModules?: string[];
  role?: string; // Role within this BU (OWNER, ADMIN, MANAGER, etc.)
  permissions?: string[]; // User permissions in this BU from backend
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  tenant: Tenant;
  businessUnits: BusinessUnit[]; // ← El backend devuelve array con roles
  permissions?: string[]; // User permissions for the first/active BU
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterRequest {
  tenantName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}

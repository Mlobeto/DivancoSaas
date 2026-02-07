/**
 * TIPOS COMPARTIDOS CON EL BACKEND
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  description?: string;
  enabledModules?: string[];
  role?: {
    // Solo en getMyBusinessUnits()
    id: string;
    name: string;
  };
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  tenant: Tenant;
  businessUnits: BusinessUnit[]; // ← El backend devuelve array
  role?: string;
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

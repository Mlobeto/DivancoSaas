/**
 * TIPOS COMPARTIDOS DEL CORE
 */

// ============================================
// REQUEST CONTEXT
// ============================================

export interface RequestContext {
  tenantId: string;
  businessUnitId?: string;
  userId: string;
  role: string;
  permissions: string[];
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// API RESPONSE
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================
// FILTER OPERATORS
// ============================================

export type FilterOperator = 
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'like'    // contains (case insensitive)
  | 'null'    // is null
  | 'nnull';  // is not null

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

// ============================================
// AUDIT
// ============================================

export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
}

// ============================================
// TENANT & BUSINESS UNIT
// ============================================

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
}

export interface BusinessUnitContext {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  enabledModules: string[];
}

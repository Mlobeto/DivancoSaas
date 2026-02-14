/**
 * TIPOS COMPARTIDOS ENTRE BACKEND, WEB Y MOBILE
 *
 * Este paquete contiene todos los tipos y contratos que son
 * comunes entre las diferentes partes del sistema.
 */

// ============================================
// USER & AUTH
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
  tenant: Tenant;
  businessUnit?: BusinessUnit;
  role?: string;
}

// ============================================
// TENANT & BUSINESS UNIT
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED",
}

export interface BusinessUnit {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// MODULES
// ============================================

export interface Module {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  version: string;
  category?: string;
  isActive: boolean;
}

export interface BusinessUnitModule {
  id: string;
  businessUnitId: string;
  moduleId: string;
  isEnabled: boolean;
  config: Record<string, any>;
}

// ============================================
// WORKFLOWS
// ============================================

export interface Workflow {
  id: string;
  businessUnitId: string;
  moduleId: string;
  name: string;
  description?: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  isActive: boolean;
}

export interface WorkflowState {
  id: string;
  name: string;
  color: string;
  order: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  requiredRole?: string;
}

// ============================================
// ROLES & PERMISSIONS
// ============================================

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: PermissionScope;
  description?: string;
}

export enum PermissionScope {
  TENANT = "TENANT",
  BUSINESS_UNIT = "BUSINESS_UNIT",
  OWN = "OWN",
}

// ============================================
// API REQUESTS
// ============================================

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

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessUnitIds?: string[];
  roleIds?: string[];
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================
// FILTERS
// ============================================

export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "nin"
  | "like"
  | "null"
  | "nnull";

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

// ============================================
// AUDIT
// ============================================

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  entity: string;
  entityId?: string;
  action: string;
  oldData?: any;
  newData?: any;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================
// OFFLINE SYNC (Mobile)
// ============================================

export interface SyncQueueItem {
  id: string;
  tenantId: string;
  businessUnitId: string;
  entity: string;
  action: "create" | "update" | "delete";
  data: any;
  timestamp: Date;
  synced: boolean;
  error?: string;
}

export interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
  lastSyncAt?: Date;
}

// ============================================
// REQUEST CONTEXT (Multi-tenant isolation)
// ============================================

export * from "./context/request-context";

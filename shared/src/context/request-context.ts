import { AsyncLocalStorage } from "async_hooks";

/**
 * Request Context for Multi-Tenant Architecture
 *
 * This context is automatically populated by middleware and used
 * throughout the application to enforce tenant isolation.
 *
 * NEVER pass tenantId/businessUnitId manually - use this context instead.
 */
export interface RequestContextData {
  tenantId: string;
  businessUnitId?: string;
  userId: string;
  userEmail?: string;
  userRoles?: string[];
}

export const requestContext = new AsyncLocalStorage<RequestContextData>();

/**
 * Get current request context
 * @throws Error if context is not available (called outside request scope)
 */
export function getRequestContext(): RequestContextData {
  const ctx = requestContext.getStore();
  if (!ctx) {
    throw new Error(
      "Request context not available. This function must be called within an HTTP request scope.",
    );
  }
  return ctx;
}

/**
 * Get current tenant ID from context
 * @throws Error if context is not available
 */
export function getTenantId(): string {
  return getRequestContext().tenantId;
}

/**
 * Get current business unit ID from context
 * @returns Business unit ID or undefined if not set
 */
export function getBusinessUnitId(): string | undefined {
  return getRequestContext().businessUnitId;
}

/**
 * Get current business unit ID from context (strict)
 * @throws Error if business unit is not set in context
 */
export function requireBusinessUnitId(): string {
  const businessUnitId = getBusinessUnitId();
  if (!businessUnitId) {
    throw new Error(
      "Business unit ID not available in context. Ensure the request includes a valid business unit.",
    );
  }
  return businessUnitId;
}

/**
 * Get current user ID from context
 * @throws Error if context is not available
 */
export function getUserId(): string {
  return getRequestContext().userId;
}

/**
 * Check if a request context is currently available
 */
export function hasRequestContext(): boolean {
  return requestContext.getStore() !== undefined;
}

/**
 * Run a function with a specific request context (for testing/background jobs)
 */
export function runWithContext<T>(context: RequestContextData, fn: () => T): T {
  return requestContext.run(context, fn);
}

/**
 * Core Module Types
 *
 * Defines the contract for CORE modules - horizontal capabilities
 * that are reusable across different industry verticals.
 *
 * CORE modules:
 * - Do NOT know about verticals
 * - Do NOT import from verticals
 * - Only expose capabilities (CRUD, domain logic, UI screens)
 * - Can be reused by multiple verticals
 */

import type { ModuleDefinition } from "./module.types";

/**
 * Core Module Definition
 *
 * Extends base ModuleDefinition with core-specific metadata.
 * Core modules provide horizontal capabilities (inventory, clients, etc.)
 */
export interface CoreModuleDefinition extends ModuleDefinition {
  /** Mark this as a core module */
  type: "core";

  /** Core capability category */
  category: "inventory" | "maintenance" | "clients" | "purchases" | "other";

  /** Icon for UI representation */
  icon?: string;

  /** Priority for navigation ordering (lower = higher priority) */
  priority?: number;
}

/**
 * Core Module Context
 * Extended context specific to core module operations
 */
export interface CoreModuleContext {
  tenantId: string;
  businessUnitId: string;
  permissions: string[];
  featureFlags: Record<string, boolean>;
}

/**
 * Core Module Registration Result
 */
export interface CoreRegistrationResult {
  moduleId: string;
  success: boolean;
  category: string;
  routes: number;
  navigationItems: number;
  error?: Error;
}

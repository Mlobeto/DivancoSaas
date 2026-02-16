/**
 * Vertical Module Types
 *
 * Defines the contract for VERTICAL modules - industry-specific
 * business orchestration layers that compose core capabilities.
 *
 * VERTICAL modules:
 * - Can depend on core modules
 * - Can declare required core modules
 * - Implement workflows and business logic
 * - Define dashboard and navigation priorities
 *
 * Dependency direction: vertical → core (never core → vertical)
 */

import type { ComponentType } from "react";
import type { NavigationItem, ModuleContext } from "./module.types";
import type { VerticalRouteConfig } from "./route.types";

/**
 * Vertical Definition
 *
 * Defines an industry-specific vertical that orchestrates
 * multiple core modules to deliver business value.
 */
export interface VerticalDefinition {
  /** Unique vertical identifier (e.g., "rental", "healthcare") */
  id: string;

  /** Display name */
  name: string;

  /** Vertical description */
  description?: string;

  /** Version (semantic versioning) */
  version?: string;

  /** Industry this vertical serves */
  industry:
    | "construction"
    | "equipment-rental"
    | "fleet"
    | "healthcare"
    | "other";

  /**
   * Required core modules
   * Vertical will fail to load if these are not available
   */
  requiredCoreModules: string[];

  /**
   * Optional core modules
   * Vertical can enhance functionality if these are available
   */
  optionalCoreModules?: string[];

  /**
   * Dynamic route configuration
   * Defines routes with full protection/permission support
   */
  routeConfig: VerticalRouteConfig;

  /** Vertical-specific navigation (takes priority over core) */
  navigation: NavigationItem[];

  /**
   * Dashboard component for vertical home page
   * Rendered at /vertical/{id}/dashboard
   */
  dashboard?: ComponentType;

  /** Required permissions to access this vertical */
  permissions?: string[];

  /** Check if vertical is enabled for current context */
  isEnabled?: (context: ModuleContext) => boolean;

  /** Initialization function */
  onInit?: () => Promise<void>;

  /** Cleanup function */
  onDestroy?: () => Promise<void>;

  /**
   * Configuration schema (for admin UI in future)
   */
  configSchema?: Record<string, any>;
}

/**
 * Vertical Context
 * Context passed to vertical for decision-making
 */
export interface VerticalContext extends ModuleContext {
  /** Available core modules */
  availableCoreModules: string[];

  /** Vertical-specific configuration */
  config?: Record<string, any>;
}

/**
 * Vertical Registration Result
 */
export interface VerticalRegistrationResult {
  verticalId: string;
  success: boolean;
  industry: string;
  requiredCoreModules: string[];
  missingCoreModules: string[];
  routes: number;
  navigationItems: number;
  error?: Error;
}

/**
 * Active Vertical Info
 * Information about the currently active vertical for a tenant
 */
export interface ActiveVerticalInfo {
  verticalId: string;
  name: string;
  industry: string;
  enabledCoreModules: string[];
  dashboardPath?: string;
}

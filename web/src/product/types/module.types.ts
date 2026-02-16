/**
 * Core Module System Types
 *
 * These types define the contract for module registration in the SaaS platform.
 * Each business module must implement ModuleDefinition to be loaded dynamically.
 */

import type { RouteObject } from "react-router-dom";
import type { LazyExoticComponent, ReactNode } from "react";
import type { ModuleRouteConfig } from "./route.types";

/**
 * Module Route - extends RouteObject to support lazy components
 * The element can be a LazyExoticComponent which will be transformed
 * to ReactNode by the module registry
 */
export interface ModuleRoute extends Omit<RouteObject, "element" | "children"> {
  element?: ReactNode | LazyExoticComponent<any>;
  children?: ModuleRoute[];
}

/**
 * Navigation item structure for dynamic menu generation
 */
export interface NavigationItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: NavigationItem[];
  order?: number;
  permissions?: string[];
  badge?: () => string | number | null;
}

/**
 * Module definition interface
 * Each module exports an instance of this to register itself
 */
export interface ModuleDefinition {
  /** Unique module identifier */
  id: string;

  /** Display name for admin/config purposes */
  name: string;

  /** Module description */
  description?: string;

  /**
   * Dynamic route configuration
   * Defines routes with full protection/permission support
   */
  routeConfig: ModuleRouteConfig;

  /** Navigation menu items */
  navigation: NavigationItem[];

  /** Required permissions to access this module */
  permissions?: string[];

  /** Function to determine if module is enabled for current context */
  isEnabled?: (context: ModuleContext) => boolean;

  /** Module initialization function (optional) */
  onInit?: () => void | Promise<void>;

  /** Module cleanup function (optional) */
  onDestroy?: () => void;

  /** Dependencies on other modules (by module ID) */
  dependencies?: string[];

  /** Module version for compatibility checks */
  version?: string;

  /** Module vertical/industry (e.g., 'construction', 'events', 'general') */
  vertical?: string;
}

/**
 * Context provided to modules for dynamic behavior
 */
export interface ModuleContext {
  /** Current tenant information */
  tenantId: string;

  /** Current business unit */
  businessUnitId: string;

  /** User permissions */
  permissions: string[];

  /** Tenant feature flags */
  featureFlags: Record<string, boolean>;

  /** Tenant configuration */
  config?: Record<string, any>;
}

/**
 * Module loader error types
 */
export class ModuleLoadError extends Error {
  constructor(
    public moduleId: string,
    message: string,
    public cause?: Error,
  ) {
    super(`Module '${moduleId}' failed to load: ${message}`);
    this.name = "ModuleLoadError";
  }
}

/**
 * Module registration result
 */
export interface ModuleRegistrationResult {
  moduleId: string;
  success: boolean;
  error?: ModuleLoadError;
  routes: number;
  navigationItems: number;
}

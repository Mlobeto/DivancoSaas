/**
 * Route Type System for Dynamic Router
 *
 * Defines precise route contracts for fully dynamic routing system.
 * Supports lazy loading, nested routes, and protection levels.
 */

import type { LazyExoticComponent, ComponentType, ReactNode } from "react";

/**
 * Route Protection Level
 */
export enum RouteProtection {
  /** Public route - no authentication required */
  PUBLIC = "public",
  /** Protected route - requires authentication */
  AUTHENTICATED = "authenticated",
  /** Admin route - requires SUPER_ADMIN role */
  ADMIN = "admin",
  /** Owner route - requires OWNER role in business unit */
  OWNER = "owner",
}

/**
 * Route Layout Type
 */
export enum RouteLayout {
  /** No layout wrapper */
  NONE = "none",
  /** Standard app layout (Navbar + Sidebar) */
  APP = "app",
  /** Auth layout (centered content for login/register) */
  AUTH = "auth",
  /** Admin layout (special admin panel UI) */
  ADMIN = "admin",
}

/**
 * Route Element Type
 * Supports direct component, lazy component, or ReactNode
 */
export type RouteElement =
  | ComponentType<any>
  | LazyExoticComponent<ComponentType<any>>
  | ReactNode;

/**
 * Dynamic Route Definition
 *
 * Extended route definition for our dynamic router.
 * Compatible with React Router but with additional metadata.
 */
export interface DynamicRouteDefinition {
  /** Route path (relative or absolute) */
  path: string;

  /** Route element (component to render) */
  element?: RouteElement;

  /** Index route flag */
  index?: boolean;

  /** Child routes */
  children?: DynamicRouteDefinition[];

  /** Protection level (default: AUTHENTICATED for business routes) */
  protection?: RouteProtection;

  /** Layout to use (default: APP for business routes) */
  layout?: RouteLayout;

  /**
   * Required permissions (checked after authentication)
   * Format: "module:action" or role name
   */
  permissions?: string[];

  /**
   * Custom guard function
   * Return true to allow access, false to redirect
   */
  guard?: (context: GuardContext) => boolean | Promise<boolean>;

  /**
   * Redirect path if guard fails
   * Default: /login for auth failure, /dashboard for permission failure
   */
  redirectOnFail?: string;

  /**
   * Route metadata (for breadcrumbs, titles, etc)
   */
  meta?: RouteMeta;

  /**
   * Feature flag requirement
   * Route only available if feature flag is enabled
   */
  featureFlag?: string;

  /**
   * Error element (fallback for error boundary)
   */
  errorElement?: RouteElement;

  /**
   * Lazy loaded module chunk name (for debugging)
   */
  chunkName?: string;
}

/**
 * Route Metadata
 */
export interface RouteMeta {
  /** Page title */
  title?: string;

  /** Page description (for SEO) */
  description?: string;

  /** Breadcrumb label */
  breadcrumb?: string;

  /** Icon name */
  icon?: string;

  /** Hide from navigation */
  hidden?: boolean;

  /** Custom metadata */
  [key: string]: any;
}

/**
 * Guard Context
 * Provided to custom guard functions
 */
export interface GuardContext {
  /** Current user */
  user: {
    id: string;
    email: string;
    role?: "SUPER_ADMIN" | "DEVELOPER" | "USER";
  } | null;

  /** Current tenant */
  tenant: {
    id: string;
    name: string;
  } | null;

  /** Current business unit */
  businessUnit: {
    id: string;
    name: string;
    role?: string; // Role within this BU
  } | null;

  /** User permissions */
  permissions: string[];

  /** Feature flags */
  featureFlags: Record<string, boolean>;

  /** Current route path */
  path: string;

  /** Query parameters */
  query: Record<string, string>;
}

/**
 * Module Route Configuration
 *
 * Defines routes for a single module.
 * Each module exports this structure.
 */
export interface ModuleRouteConfig {
  /** Module ID (must match module definition) */
  moduleId: string;

  /** Base path for all routes in this module */
  basePath: string;

  /** Route definitions */
  routes: DynamicRouteDefinition[];

  /**
   * Default protection for all routes in this module
   * Can be overridden per route
   */
  defaultProtection?: RouteProtection;

  /**
   * Default layout for all routes in this module
   * Can be overridden per route
   */
  defaultLayout?: RouteLayout;

  /**
   * Module-level guard
   * Checked before any route in this module
   */
  moduleGuard?: (context: GuardContext) => boolean | Promise<boolean>;
}

/**
 * Vertical Route Configuration
 *
 * Defines routes for a vertical (collection of modules)
 */
export interface VerticalRouteConfig {
  /** Vertical ID */
  verticalId: string;

  /** Base path for vertical (e.g., "/rental") */
  basePath?: string;

  /** Vertical-specific routes (not in modules) */
  routes: DynamicRouteDefinition[];

  /**
   * Vertical-level guard
   * Checked before any route in this vertical
   */
  verticalGuard?: (context: GuardContext) => boolean | Promise<boolean>;
}

/**
 * Built Route
 *
 * Final route object ready for React Router
 * Result of buildDynamicRoutes()
 * Compatible with RouteObject but doesn't extend it to avoid type conflicts
 */
export interface BuiltRoute {
  /** Route path */
  path?: string;

  /** Index route */
  index?: boolean;

  /** Child routes */
  children?: BuiltRoute[];

  /** Route element */
  element?: ReactNode;

  /** Error boundary element */
  errorElement?: ReactNode;

  /** Original route definition */
  definition?: DynamicRouteDefinition;

  /** Module or vertical ID this route belongs to */
  sourceId?: string;
}

/**
 * Route Builder Options
 */
export interface RouteBuilderOptions {
  /** Include admin routes (default: false) */
  includeAdmin?: boolean;

  /** Include public routes (default: true) */
  includePublic?: boolean;

  /** Context for guard evaluation */
  context?: Partial<GuardContext>;

  /** Enable detailed logging */
  debug?: boolean;
}

/**
 * Route Tree
 *
 * Structured representation of all routes (for debugging/visualization)
 */
export interface RouteTree {
  public: BuiltRoute[];
  authenticated: BuiltRoute[];
  admin: BuiltRoute[];
  owner: BuiltRoute[];
}

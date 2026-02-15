/**
 * Dynamic Route Builder
 *
 * Builds React Router routes dynamically from module and vertical registries.
 * Handles lazy loading, route protection, and layout wrapping.
 */

import { createElement, Suspense, isValidElement, type ReactNode } from "react";
import {
  DynamicRouteDefinition,
  BuiltRoute,
  RouteProtection,
  RouteLayout,
  GuardContext,
  RouteBuilderOptions,
  RouteTree,
  ModuleRouteConfig,
  VerticalRouteConfig,
} from "./types/route.types";

/**
 * Loading fallback component
 */
const LoadingFallback = () =>
  createElement(
    "div",
    { className: "flex items-center justify-center min-h-screen" },
    createElement(
      "div",
      { className: "text-center" },
      createElement("div", {
        className:
          "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4",
      }),
      createElement("p", { className: "text-gray-600" }, "Loading..."),
    ),
  );

/**
 * Route Builder Class
 *
 * Responsible for transforming route definitions into React Router configuration.
 */
export class RouteBuilder {
  private options: RouteBuilderOptions;
  private context: Partial<GuardContext>;

  constructor(options: RouteBuilderOptions = {}) {
    this.options = {
      includeAdmin: false,
      includePublic: true,
      debug: false,
      ...options,
    };
    this.context = options.context || {};
  }

  /**
   * Build routes from module configurations
   */
  buildFromModules(modules: ModuleRouteConfig[]): BuiltRoute[] {
    const routes: BuiltRoute[] = [];

    for (const module of modules) {
      if (this.options.debug) {
        console.log(
          `[RouteBuilder] Building routes for module: ${module.moduleId}`,
        );
      }

      // Check module-level guard
      if (module.moduleGuard && this.context) {
        const allowed = module.moduleGuard(this.context as GuardContext);
        if (!allowed) {
          if (this.options.debug) {
            console.log(
              `[RouteBuilder] Module guard failed: ${module.moduleId}`,
            );
          }
          continue;
        }
      }

      // Build module routes
      for (const routeDef of module.routes) {
        const builtRoute = this.buildRoute(routeDef, {
          sourceId: module.moduleId,
          basePath: module.basePath,
          defaultProtection: module.defaultProtection,
          defaultLayout: module.defaultLayout,
        });

        if (builtRoute) {
          routes.push(builtRoute);
        }
      }
    }

    return routes;
  }

  /**
   * Build routes from vertical configuration
   */
  buildFromVertical(vertical: VerticalRouteConfig): BuiltRoute[] {
    if (this.options.debug) {
      console.log(
        `[RouteBuilder] Building routes for vertical: ${vertical.verticalId}`,
      );
    }

    // Check vertical-level guard
    if (vertical.verticalGuard && this.context) {
      const allowed = vertical.verticalGuard(this.context as GuardContext);
      if (!allowed) {
        if (this.options.debug) {
          console.log(
            `[RouteBuilder] Vertical guard failed: ${vertical.verticalId}`,
          );
        }
        return [];
      }
    }

    const routes: BuiltRoute[] = [];

    for (const routeDef of vertical.routes) {
      const builtRoute = this.buildRoute(routeDef, {
        sourceId: vertical.verticalId,
        basePath: vertical.basePath,
        defaultProtection: RouteProtection.AUTHENTICATED,
        defaultLayout: RouteLayout.APP,
      });

      if (builtRoute) {
        routes.push(builtRoute);
      }
    }

    return routes;
  }

  /**
   * Build a single route with all transformations
   */
  private buildRoute(
    routeDef: DynamicRouteDefinition,
    options: {
      sourceId?: string;
      basePath?: string;
      defaultProtection?: RouteProtection;
      defaultLayout?: RouteLayout;
    },
  ): BuiltRoute | null {
    const protection =
      routeDef.protection ||
      options.defaultProtection ||
      RouteProtection.AUTHENTICATED;

    // Apply filters based on builder options
    if (protection === RouteProtection.PUBLIC && !this.options.includePublic) {
      return null;
    }
    if (protection === RouteProtection.ADMIN && !this.options.includeAdmin) {
      return null;
    }

    // Check custom guard
    if (routeDef.guard && this.context) {
      const allowed = routeDef.guard(this.context as GuardContext);
      if (!allowed) {
        if (this.options.debug) {
          console.log(`[RouteBuilder] Route guard failed: ${routeDef.path}`);
        }
        return null;
      }
    }

    // Check feature flag
    if (routeDef.featureFlag && this.context.featureFlags) {
      const enabled = this.context.featureFlags[routeDef.featureFlag];
      if (!enabled) {
        if (this.options.debug) {
          console.log(
            `[RouteBuilder] Feature flag disabled: ${routeDef.path} (${routeDef.featureFlag})`,
          );
        }
        return null;
      }
    }

    // Build path (prepend basePath if provided)
    const fullPath = options.basePath
      ? `${options.basePath}${routeDef.path}`.replace(/\/+/g, "/")
      : routeDef.path;

    // Transform element (wrap lazy components in Suspense)
    const element = routeDef.element
      ? this.transformElement(routeDef.element)
      : undefined;

    // Build children recursively
    const children = routeDef.children
      ? routeDef.children
          .map((child) => this.buildRoute(child, options))
          .filter((r): r is BuiltRoute => r !== null)
      : undefined;

    // Create built route
    const builtRoute: BuiltRoute = {
      path: fullPath,
      element,
      children,
      index: routeDef.index,
      errorElement: routeDef.errorElement
        ? this.transformElement(routeDef.errorElement)
        : undefined,
      definition: routeDef,
      sourceId: options.sourceId,
    };

    return builtRoute;
  }

  /**
   * Transform route element (handle lazy components)
   */
  private transformElement(element: any): ReactNode {
    // If already a ReactNode, return as-is
    if (isValidElement(element)) {
      return element;
    }

    // If it's a lazy component, wrap in Suspense
    if (
      typeof element === "object" &&
      element.$$typeof === Symbol.for("react.lazy")
    ) {
      return createElement(
        Suspense,
        { fallback: createElement(LoadingFallback) },
        createElement(element),
      );
    }

    // If it's a component, wrap in Suspense anyway (could be lazy loaded elsewhere)
    if (typeof element === "function") {
      return createElement(
        Suspense,
        { fallback: createElement(LoadingFallback) },
        createElement(element),
      );
    }

    // Unknown type, log warning and return null
    console.warn(`[RouteBuilder] Unknown element type:`, element);
    return null;
  }

  /**
   * Build complete route tree (organized by protection level)
   */
  buildRouteTree(
    modules: ModuleRouteConfig[],
    verticals: VerticalRouteConfig[],
  ): RouteTree {
    const allRoutes: BuiltRoute[] = [
      ...this.buildFromModules(modules),
      ...verticals.flatMap((v) => this.buildFromVertical(v)),
    ];

    // Organize by protection level
    const tree: RouteTree = {
      public: [],
      authenticated: [],
      admin: [],
      owner: [],
    };

    for (const route of allRoutes) {
      const protection =
        route.definition?.protection || RouteProtection.AUTHENTICATED;
      switch (protection) {
        case RouteProtection.PUBLIC:
          tree.public.push(route);
          break;
        case RouteProtection.ADMIN:
          tree.admin.push(route);
          break;
        case RouteProtection.OWNER:
          tree.owner.push(route);
          break;
        default:
          tree.authenticated.push(route);
      }
    }

    return tree;
  }

  /**
   * Update context (for re-evaluation)
   */
  updateContext(context: Partial<GuardContext>) {
    this.context = { ...this.context, ...context };
  }
}

/**
 * Build dynamic routes from registries
 *
 * Main entry point for route generation.
 */
export function buildDynamicRoutes(
  modules: ModuleRouteConfig[],
  verticals: VerticalRouteConfig[],
  options?: RouteBuilderOptions,
): BuiltRoute[] {
  const builder = new RouteBuilder(options);
  return [
    ...builder.buildFromModules(modules),
    ...verticals.flatMap((v) => builder.buildFromVertical(v)),
  ];
}

/**
 * Get route statistics (for debugging)
 */
export function getRouteStats(routes: BuiltRoute[]): {
  total: number;
  byProtection: Record<string, number>;
  byLayout: Record<string, number>;
  bySource: Record<string, number>;
  lazy: number;
  withGuards: number;
} {
  const stats = {
    total: routes.length,
    byProtection: {} as Record<string, number>,
    byLayout: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    lazy: 0,
    withGuards: 0,
  };

  function countRoute(route: BuiltRoute) {
    const protection =
      route.definition?.protection || RouteProtection.AUTHENTICATED;
    const layout = route.definition?.layout || RouteLayout.APP;
    const source = route.sourceId || "unknown";

    stats.byProtection[protection] = (stats.byProtection[protection] || 0) + 1;
    stats.byLayout[layout] = (stats.byLayout[layout] || 0) + 1;
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;

    if (route.definition?.guard) {
      stats.withGuards++;
    }

    // Check if lazy (approximate check)
    if (
      route.definition?.chunkName ||
      route.definition?.element?.toString().includes("lazy")
    ) {
      stats.lazy++;
    }

    // Recurse children
    if (route.children) {
      route.children.forEach(countRoute);
    }
  }

  routes.forEach(countRoute);
  return stats;
}

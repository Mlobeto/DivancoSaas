/**
 * Vertical Registry
 *
 * Registry for VERTICAL modules - industry-specific business orchestration
 * layers that compose core capabilities.
 *
 * IMPORTANT: Verticals are locked after initialization.
 * Only ONE vertical can be active per tenant at a time (multi-vertical support is future).
 */

import type {
  VerticalDefinition,
  VerticalContext,
  VerticalRegistrationResult,
  ActiveVerticalInfo,
} from "./types/vertical.types";
import type { ModuleContext } from "./types/module.types";
import { coreRegistry } from "./core-registry";
import { createElement, isValidElement } from "react";
import type { RouteObject } from "react-router-dom";

/**
 * Vertical Registry Class
 */
class VerticalRegistry {
  private verticals: Map<string, VerticalDefinition> = new Map();
  private locked: boolean = false;
  private initialized: boolean = false;

  /**
   * Register a vertical
   * @throws Error if registry is already locked
   */
  registerVertical(vertical: VerticalDefinition): VerticalRegistrationResult {
    if (this.locked) {
      throw new Error(
        `[VerticalRegistry] Cannot register vertical '${vertical.id}': Registry is locked after initialization`,
      );
    }

    try {
      // Validate vertical definition
      this.validateVertical(vertical);

      // Check for duplicate registration
      if (this.verticals.has(vertical.id)) {
        throw new Error(`Vertical '${vertical.id}' is already registered`);
      }

      // Validate required core modules exist
      const validation = coreRegistry.validateRequiredModules(
        vertical.requiredCoreModules,
      );

      // Check if core registry is empty (migration mode)
      const coreStats = coreRegistry.getStats();
      const isMigrationMode = coreStats.totalCoreModules === 0;

      if (!validation.valid) {
        if (isMigrationMode) {
          // During migration, core modules might not be loaded yet
          console.warn(
            `[VerticalRegistry] ⚠️ MIGRATION MODE: Vertical '${vertical.id}' requires core modules that aren't loaded yet: ${validation.missing.join(", ")}`,
          );
          console.warn(
            `[VerticalRegistry] This is expected during platform architecture migration`,
          );
        } else {
          // In production, this is an error
          throw new Error(
            `Vertical '${vertical.id}' requires core modules that don't exist: ${validation.missing.join(", ")}`,
          );
        }
      }

      // Register vertical
      this.verticals.set(vertical.id, vertical);

      console.log(
        `[VerticalRegistry] Registered vertical: ${vertical.id} (${vertical.industry})`,
      );

      return {
        verticalId: vertical.id,
        success: true,
        industry: vertical.industry,
        requiredCoreModules: vertical.requiredCoreModules,
        missingCoreModules: [],
        routes: vertical.routes.length,
        navigationItems: vertical.navigation.length,
      };
    } catch (error) {
      console.error(
        `[VerticalRegistry] Failed to register vertical ${vertical.id}:`,
        error,
      );

      return {
        verticalId: vertical.id,
        success: false,
        industry: vertical.industry,
        requiredCoreModules: vertical.requiredCoreModules || [],
        missingCoreModules: [],
        error: error instanceof Error ? error : new Error(String(error)),
        routes: 0,
        navigationItems: 0,
      };
    }
  }

  /**
   * Register multiple verticals
   */
  registerAll(verticals: VerticalDefinition[]): VerticalRegistrationResult[] {
    return verticals.map((vertical) => this.registerVertical(vertical));
  }

  /**
   * Validate vertical definition
   */
  private validateVertical(vertical: VerticalDefinition): void {
    if (!vertical.id || typeof vertical.id !== "string") {
      throw new Error("Vertical must have a valid 'id'");
    }

    if (!vertical.name || typeof vertical.name !== "string") {
      throw new Error(`Vertical '${vertical.id}' must have a valid 'name'`);
    }

    if (!vertical.industry) {
      throw new Error(`Vertical '${vertical.id}' must have an industry`);
    }

    if (!Array.isArray(vertical.requiredCoreModules)) {
      throw new Error(
        `Vertical '${vertical.id}' must have requiredCoreModules array`,
      );
    }

    if (vertical.requiredCoreModules.length === 0) {
      throw new Error(
        `Vertical '${vertical.id}' must require at least one core module`,
      );
    }

    if (!Array.isArray(vertical.routes)) {
      throw new Error(`Vertical '${vertical.id}' must have routes array`);
    }

    if (!Array.isArray(vertical.navigation)) {
      throw new Error(`Vertical '${vertical.id}' must have navigation array`);
    }
  }

  /**
   * Get a specific vertical by ID
   */
  getVertical(id: string): VerticalDefinition | undefined {
    return this.verticals.get(id);
  }

  /**
   * Get all registered verticals
   */
  getAllVerticals(): VerticalDefinition[] {
    return Array.from(this.verticals.values());
  }

  /**
   * Get active vertical for context
   * Currently returns the first enabled vertical
   * TODO: In future, support tenant-specific vertical selection
   */
  getActiveVertical(context: ModuleContext): VerticalDefinition | null {
    const verticals = this.getAllVerticals();

    // Find first enabled vertical
    for (const vertical of verticals) {
      // Check if vertical is enabled
      if (vertical.isEnabled && !vertical.isEnabled(context)) {
        continue;
      }

      // Check permissions
      if (vertical.permissions && vertical.permissions.length > 0) {
        const hasPermission = vertical.permissions.some((permission) =>
          context.permissions.includes(permission),
        );
        if (!hasPermission) {
          continue;
        }
      }

      // This vertical is enabled
      return vertical;
    }

    return null;
  }

  /**
   * Get active vertical info
   */
  getActiveVerticalInfo(context: ModuleContext): ActiveVerticalInfo | null {
    const vertical = this.getActiveVertical(context);

    if (!vertical) {
      return null;
    }

    // Get enabled core modules for this vertical
    const enabledCoreModules = coreRegistry
      .getCoreModulesByIds(vertical.requiredCoreModules, context)
      .map((m) => m.id);

    return {
      verticalId: vertical.id,
      name: vertical.name,
      industry: vertical.industry,
      enabledCoreModules,
      dashboardPath: vertical.dashboard
        ? `/vertical/${vertical.id}/dashboard`
        : undefined,
    };
  }

  /**
   * Get routes from active vertical and its required core modules
   */
  getRoutes(context: ModuleContext): RouteObject[] {
    const vertical = this.getActiveVertical(context);

    if (!vertical) {
      console.warn(
        "[VerticalRegistry] No active vertical found, returning empty routes",
      );
      return [];
    }

    // Get routes from required core modules
    const coreRoutes = coreRegistry.getRoutesByIds(
      vertical.requiredCoreModules,
      context,
    );

    // Get routes from vertical
    const verticalRoutes = vertical.routes.map((route) =>
      this.transformRoute(route),
    );

    // Merge: core routes first, then vertical routes
    return [...coreRoutes, ...verticalRoutes];
  }

  /**
   * Transform a ModuleRoute to RouteObject
   */
  private transformRoute(route: any): RouteObject {
    const transformed: any = { ...route };

    if (transformed.element && !isValidElement(transformed.element)) {
      transformed.element = createElement(transformed.element);
    }

    if (route.children) {
      transformed.children = route.children.map((child: any) =>
        this.transformRoute(child),
      );
    }

    return transformed as RouteObject;
  }

  /**
   * Get navigation from active vertical and its required core modules
   */
  getNavigation(context: ModuleContext): any[] {
    const vertical = this.getActiveVertical(context);

    if (!vertical) {
      console.warn(
        "[VerticalRegistry] No active vertical found, returning empty navigation",
      );
      return [];
    }

    // Get navigation from required core modules
    const coreNavigation = coreRegistry.getNavigationByIds(
      vertical.requiredCoreModules,
      context,
    );

    // Get navigation from vertical
    const verticalNavigation = vertical.navigation;

    // Merge: vertical navigation first (priority), then core navigation
    return [...verticalNavigation, ...coreNavigation].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );
  }

  /**
   * Initialize all verticals
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("[VerticalRegistry] Already initialized");
      return;
    }

    console.log("[VerticalRegistry] Initializing verticals...");

    const verticals = this.getAllVerticals();

    for (const vertical of verticals) {
      if (vertical.onInit) {
        try {
          await vertical.onInit();
          console.log(
            `[VerticalRegistry] Initialized vertical: ${vertical.id}`,
          );
        } catch (error) {
          console.error(
            `[VerticalRegistry] Failed to initialize vertical ${vertical.id}:`,
            error,
          );
        }
      }
    }

    this.initialized = true;
    console.log("[VerticalRegistry] Verticals initialized");
  }

  /**
   * Lock the registry
   */
  lock(): void {
    if (this.locked) {
      console.warn("[VerticalRegistry] Registry is already locked");
      return;
    }

    this.locked = true;
    console.log(
      `[VerticalRegistry] Registry locked with ${this.verticals.size} verticals`,
    );
  }

  /**
   * Check if registry is locked
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const verticals = this.getAllVerticals();
    const byIndustry = verticals.reduce(
      (acc, v) => {
        acc[v.industry] = (acc[v.industry] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalVerticals: verticals.length,
      byIndustry,
      locked: this.locked,
      initialized: this.initialized,
      totalRoutes: verticals.reduce((sum, v) => sum + v.routes.length, 0),
      totalNavigationItems: verticals.reduce(
        (sum, v) => sum + v.navigation.length,
        0,
      ),
    };
  }
}

// Export singleton instance
export const verticalRegistry = new VerticalRegistry();

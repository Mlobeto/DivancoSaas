/**
 * Core Module Registry
 *
 * Central registry for CORE modules - horizontal capabilities
 * that are reusable across industry verticals.
 *
 * IMPORTANT: Registry is locked after initialization to prevent runtime mutations.
 */

import { createElement, isValidElement } from "react";
import type { RouteObject } from "react-router-dom";
import type {
  CoreModuleDefinition,
  CoreRegistrationResult,
} from "./types/core.types";
import type { ModuleContext } from "./types/module.types";
import { featureFlagService } from "./feature-flags";

/**
 * Core Module Registry Class
 */
class CoreRegistry {
  private modules: Map<string, CoreModuleDefinition> = new Map();
  private locked: boolean = false;
  private initialized: boolean = false;

  /**
   * Register a core module
   * @throws Error if registry is already locked
   */
  registerCore(module: CoreModuleDefinition): CoreRegistrationResult {
    if (this.locked) {
      throw new Error(
        `[CoreRegistry] Cannot register module '${module.id}': Registry is locked after initialization`,
      );
    }

    try {
      // Validate core module
      this.validateCoreModule(module);

      // Check for duplicate registration
      if (this.modules.has(module.id)) {
        throw new Error(`Core module '${module.id}' is already registered`);
      }

      // Register module
      this.modules.set(module.id, module);

      console.log(
        `[CoreRegistry] Registered core module: ${module.id} (${module.category})`,
      );

      return {
        moduleId: module.id,
        success: true,
        category: module.category,
        routes: module.routes.length,
        navigationItems: module.navigation.length,
      };
    } catch (error) {
      console.error(
        `[CoreRegistry] Failed to register core module ${module.id}:`,
        error,
      );

      return {
        moduleId: module.id,
        success: false,
        category: module.category,
        error: error instanceof Error ? error : new Error(String(error)),
        routes: 0,
        navigationItems: 0,
      };
    }
  }

  /**
   * Register multiple core modules
   */
  registerAll(modules: CoreModuleDefinition[]): CoreRegistrationResult[] {
    return modules.map((module) => this.registerCore(module));
  }

  /**
   * Validate core module definition
   */
  private validateCoreModule(module: CoreModuleDefinition): void {
    if (!module.id || typeof module.id !== "string") {
      throw new Error("Core module must have a valid 'id'");
    }

    if (!module.name || typeof module.name !== "string") {
      throw new Error(`Core module '${module.id}' must have a valid 'name'`);
    }

    if (!module.category) {
      throw new Error(`Core module '${module.id}' must have a category`);
    }

    if (!Array.isArray(module.routes)) {
      throw new Error(`Core module '${module.id}' must have routes array`);
    }

    if (!Array.isArray(module.navigation)) {
      throw new Error(`Core module '${module.id}' must have navigation array`);
    }

    if (module.type !== "core") {
      throw new Error(`Module '${module.id}' must have type='core'`);
    }
  }

  /**
   * Get a specific core module by ID
   */
  getCoreModule(id: string): CoreModuleDefinition | undefined {
    return this.modules.get(id);
  }

  /**
   * Get all registered core modules
   */
  getAllCoreModules(): CoreModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get enabled core modules based on context
   */
  getEnabledCoreModules(context: ModuleContext): CoreModuleDefinition[] {
    return this.getAllCoreModules().filter((module) => {
      // Check feature flag
      if (!featureFlagService.isModuleEnabled(module.id)) {
        return false;
      }

      // Check custom isEnabled function
      if (module.isEnabled && !module.isEnabled(context)) {
        return false;
      }

      // Check permissions
      if (module.permissions && module.permissions.length > 0) {
        const hasPermission = module.permissions.some((permission) =>
          context.permissions.includes(permission),
        );
        if (!hasPermission) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get core modules by IDs (for vertical dependencies)
   */
  getCoreModulesByIds(
    ids: string[],
    context: ModuleContext,
  ): CoreModuleDefinition[] {
    const enabled = this.getEnabledCoreModules(context);
    return enabled.filter((module) => ids.includes(module.id));
  }

  /**
   * Get all routes from enabled core modules
   */
  getRoutes(context: ModuleContext): RouteObject[] {
    const modules = this.getEnabledCoreModules(context);

    return modules.flatMap((module) =>
      module.routes.map((route) => this.transformRoute(route)),
    );
  }

  /**
   * Get routes from specific core modules by ID
   */
  getRoutesByIds(ids: string[], context: ModuleContext): RouteObject[] {
    const modules = this.getCoreModulesByIds(ids, context);

    return modules.flatMap((module) =>
      module.routes.map((route) => this.transformRoute(route)),
    );
  }

  /**
   * Transform a ModuleRoute to RouteObject
   * Wraps LazyExoticComponent in createElement if needed
   */
  private transformRoute(route: any): RouteObject {
    const transformed: any = { ...route };

    // If element is a LazyExoticComponent (not already a ReactElement), wrap it
    if (transformed.element && !isValidElement(transformed.element)) {
      transformed.element = createElement(transformed.element);
    }

    // Recursively transform children
    if (route.children) {
      transformed.children = route.children.map((child: any) =>
        this.transformRoute(child),
      );
    }

    return transformed as RouteObject;
  }

  /**
   * Get navigation from enabled core modules
   */
  getNavigation(context: ModuleContext): any[] {
    return this.getEnabledCoreModules(context)
      .flatMap((module) => module.navigation)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Get navigation from specific core modules by ID
   */
  getNavigationByIds(ids: string[], context: ModuleContext): any[] {
    return this.getCoreModulesByIds(ids, context)
      .flatMap((module) => module.navigation)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Initialize all core modules
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("[CoreRegistry] Already initialized");
      return;
    }

    console.log("[CoreRegistry] Initializing core modules...");

    const modules = this.getAllCoreModules();

    for (const module of modules) {
      if (module.onInit) {
        try {
          await module.onInit();
          console.log(`[CoreRegistry] Initialized core module: ${module.id}`);
        } catch (error) {
          console.error(
            `[CoreRegistry] Failed to initialize core module ${module.id}:`,
            error,
          );
        }
      }
    }

    this.initialized = true;
    console.log("[CoreRegistry] Core modules initialized");
  }

  /**
   * Lock the registry to prevent further registrations
   */
  lock(): void {
    if (this.locked) {
      console.warn("[CoreRegistry] Registry is already locked");
      return;
    }

    this.locked = true;
    console.log(
      `[CoreRegistry] Registry locked with ${this.modules.size} core modules`,
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
    const modules = this.getAllCoreModules();
    const byCategory = modules.reduce(
      (acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalCoreModules: modules.length,
      byCategory,
      locked: this.locked,
      initialized: this.initialized,
      totalRoutes: modules.reduce((sum, m) => sum + m.routes.length, 0),
      totalNavigationItems: modules.reduce(
        (sum, m) => sum + m.navigation.length,
        0,
      ),
    };
  }

  /**
   * Validate that required core modules exist
   */
  validateRequiredModules(requiredIds: string[]): {
    valid: boolean;
    missing: string[];
  } {
    const allIds = new Set(Array.from(this.modules.keys()));
    const missing = requiredIds.filter((id) => !allIds.has(id));

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

// Export singleton instance
export const coreRegistry = new CoreRegistry();

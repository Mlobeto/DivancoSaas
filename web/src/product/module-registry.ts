/**
 * Module Registry
 *
 * Central registry for all business modules in the platform.
 * Modules self-register here to be loaded dynamically.
 */

import {
  ModuleDefinition,
  ModuleContext,
  ModuleLoadError,
  ModuleRegistrationResult,
} from "./types/module.types";
import { featureFlagService } from "./feature-flags";
import { createElement, isValidElement } from "react";
import type { RouteObject } from "react-router-dom";

/**
 * Module Registry Class
 * Manages module registration, validation, and access
 *
 * IMPORTANT: Registry is locked after initialization to prevent runtime mutations.
 */
class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();
  private locked: boolean = false;
  private initialized: boolean = false;

  /**
   * Register a module
   * @throws Error if registry is already locked
   */
  register(module: ModuleDefinition): ModuleRegistrationResult {
    if (this.locked) {
      throw new Error(
        `[ModuleRegistry] Cannot register module '${module.id}': Registry is locked after initialization`,
      );
    }

    try {
      // Validate module definition
      this.validateModule(module);

      // Check for duplicate registration
      if (this.modules.has(module.id)) {
        throw new Error(`Module '${module.id}' is already registered`);
      }

      // Register module
      this.modules.set(module.id, module);

      console.log(`[ModuleRegistry] Registered module: ${module.id}`);

      return {
        moduleId: module.id,
        success: true,
        routes: module.routes.length,
        navigationItems: module.navigation.length,
      };
    } catch (error) {
      const loadError = new ModuleLoadError(
        module.id,
        error instanceof Error ? error.message : "Unknown error",
        error instanceof Error ? error : undefined,
      );

      console.error(
        `[ModuleRegistry] Failed to register module ${module.id}:`,
        loadError,
      );

      return {
        moduleId: module.id,
        success: false,
        error: loadError,
        routes: 0,
        navigationItems: 0,
      };
    }
  }

  /**
   * Register multiple modules
   */
  registerAll(modules: ModuleDefinition[]): ModuleRegistrationResult[] {
    return modules.map((module) => this.register(module));
  }

  /**
   * Lock the registry to prevent further registrations
   * Call this after all modules are loaded during app initialization
   */
  lock(): void {
    if (this.locked) {
      console.warn("[ModuleRegistry] Registry is already locked");
      return;
    }

    this.locked = true;
    console.log(
      `[ModuleRegistry] Registry locked with ${this.modules.size} modules`,
    );
  }

  /**
   * Unlock the registry (for development/HMR only)
   * WARNING: Only use this during development hot reloads
   */
  unlock(): void {
    this.locked = false;
    console.log("[ModuleRegistry] Registry unlocked (development mode)");
  }

  /**
   * Check if registry is locked
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Get a specific module by ID
   */
  getModule(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get enabled modules based on context
   */
  getEnabledModules(context: ModuleContext): ModuleDefinition[] {
    return this.getAllModules().filter((module) => {
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
   * Get all routes from enabled modules
   * Transforms lazy components into React elements
   */
  getRoutes(context: ModuleContext): RouteObject[] {
    const modules = this.getEnabledModules(context);

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
      // It's a lazy component, wrap it in createElement
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
   * Get all navigation items from enabled modules
   */
  getNavigation(context: ModuleContext) {
    return this.getEnabledModules(context)
      .flatMap((module) => module.navigation)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Initialize all modules
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("[ModuleRegistry] Already initialized");
      return;
    }

    console.log("[ModuleRegistry] Initializing modules...");

    const modules = this.getAllModules();

    for (const module of modules) {
      if (module.onInit) {
        try {
          await module.onInit();
          console.log(`[ModuleRegistry] Initialized module: ${module.id}`);
        } catch (error) {
          console.error(
            `[ModuleRegistry] Failed to initialize module ${module.id}:`,
            error,
          );
        }
      }
    }

    this.initialized = true;
    console.log(`[ModuleRegistry] Initialized ${modules.length} modules`);
  }

  /**
   * Destroy all modules (cleanup)
   */
  destroy(): void {
    const modules = this.getAllModules();

    for (const module of modules) {
      if (module.onDestroy) {
        try {
          module.onDestroy();
          console.log(`[ModuleRegistry] Destroyed module: ${module.id}`);
        } catch (error) {
          console.error(
            `[ModuleRegistry] Failed to destroy module ${module.id}:`,
            error,
          );
        }
      }
    }

    this.modules.clear();
    this.initialized = false;
  }

  /**
   * Validate module definition
   */
  private validateModule(module: ModuleDefinition): void {
    if (!module.id || typeof module.id !== "string") {
      throw new Error("Module must have a valid string ID");
    }

    if (!module.name || typeof module.name !== "string") {
      throw new Error("Module must have a valid name");
    }

    if (!Array.isArray(module.routes)) {
      throw new Error("Module routes must be an array");
    }

    if (!Array.isArray(module.navigation)) {
      throw new Error("Module navigation must be an array");
    }
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const modules = this.getAllModules();
    return {
      totalModules: modules.length,
      totalRoutes: modules.reduce((sum, m) => sum + m.routes.length, 0),
      totalNavigationItems: modules.reduce(
        (sum, m) => sum + m.navigation.length,
        0,
      ),
      moduleIds: modules.map((m) => m.id),
      initialized: this.initialized,
    };
  }
}

/**
 * Global module registry instance
 */
export const moduleRegistry = new ModuleRegistry();

/**
 * Helper function to register a module
 */
export function registerModule(
  module: ModuleDefinition,
): ModuleRegistrationResult {
  return moduleRegistry.register(module);
}

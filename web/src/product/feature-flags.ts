/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for the SaaS platform.
 * This will be extended to load from backend configuration per tenant.
 */

import { ModuleContext } from "./types/module.types";

/**
 * Feature flag definitions
 */
export interface FeatureFlags {
  // Core modules (always enabled for now)
  "module.inventory": boolean;
  "module.clients": boolean;
  "module.purchases": boolean;
  "module.rental": boolean;

  // Feature toggles
  "feature.csv-import": boolean;
  "feature.pdf-generation": boolean;
  "feature.advanced-reporting": boolean;
  "feature.contract-signatures": boolean;

  // Experimental features
  "experimental.ai-assistant": boolean;
  "experimental.mobile-app": boolean;
}

/**
 * Default feature flags (all modules enabled)
 * In production, this will be loaded from backend per tenant
 */
export const defaultFeatureFlags: FeatureFlags = {
  // Core modules
  "module.inventory": true,
  "module.clients": true,
  "module.purchases": true,
  "module.rental": true,

  // Features
  "feature.csv-import": true,
  "feature.pdf-generation": true,
  "feature.advanced-reporting": false,
  "feature.contract-signatures": false,

  // Experimental
  "experimental.ai-assistant": false,
  "experimental.mobile-app": false,
};

/**
 * Feature flag service
 * TODO: Load from backend API based on tenant configuration
 */
export class FeatureFlagService {
  private flags: FeatureFlags;

  constructor(flags: FeatureFlags = defaultFeatureFlags) {
    this.flags = flags;
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? false;
  }

  /**
   * Check if a module is enabled
   */
  isModuleEnabled(moduleId: string): boolean {
    const flag = `module.${moduleId}` as keyof FeatureFlags;
    return this.isEnabled(flag);
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update flags (for testing or after loading from backend)
   */
  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
  }

  /**
   * Load flags from backend for current tenant
   * TODO: Implement API call
   */
  async loadFromBackend(tenantId: string): Promise<void> {
    console.log(`[FeatureFlags] Loading for tenant ${tenantId}...`);
    // TODO: const response = await api.get(`/tenants/${tenantId}/feature-flags`);
    // TODO: this.updateFlags(response.data);
  }
}

/**
 * Global feature flag service instance
 */
export const featureFlagService = new FeatureFlagService();

/**
 * React hook for feature flags (future implementation)
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return featureFlagService.isEnabled(flag);
}

/**
 * Helper to create module context with feature flags
 */
export function createModuleContext(
  tenantId: string,
  businessUnitId: string,
  permissions: string[],
): ModuleContext {
  return {
    tenantId,
    businessUnitId,
    permissions,
    featureFlags: featureFlagService.getAllFlags() as unknown as Record<
      string,
      boolean
    >,
  };
}

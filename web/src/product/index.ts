/**
 * Product Layer - Public API
 *
 * This is the main entry point for the product/platform layer.
 * Import from here to use module system, feature flags, registries, etc.
 */

// Types - Base Module System
export * from "./types/module.types";

// Types - Core & Vertical
export * from "./types/core.types";
export * from "./types/vertical.types";

// Feature Flags
export {
  type FeatureFlags,
  defaultFeatureFlags,
  FeatureFlagService,
  featureFlagService,
  useFeatureFlag,
  createModuleContext,
} from "./feature-flags";

// Registries
export { moduleRegistry, registerModule } from "./module-registry"; // Legacy - will be deprecated
export { coreRegistry } from "./core-registry";
export { verticalRegistry } from "./vertical-registry";

// Navigation
export { NavigationBuilder, navigationBuilder } from "./navigation-builder";

/**
 * Product Layer - Public API
 *
 * This is the main entry point for the product/platform layer.
 * Import from here to use module system, feature flags, etc.
 */

// Types
export * from "./types/module.types";

// Feature Flags
export {
  type FeatureFlags,
  defaultFeatureFlags,
  FeatureFlagService,
  featureFlagService,
  useFeatureFlag,
  createModuleContext,
} from "./feature-flags";

// Module Registry
export { moduleRegistry, registerModule } from "./module-registry";

// Navigation
export { NavigationBuilder, navigationBuilder } from "./navigation-builder";

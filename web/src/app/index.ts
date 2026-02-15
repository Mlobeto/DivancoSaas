/**
 * App Layer - Public API
 *
 * This is the main entry point for the app infrastructure layer.
 */

// Module Loader
export { loadModules, reloadModules } from "./module-loader/loadModules";

// Router
export {
  createAppRouter,
  buildRoutes,
  rebuildRouter,
} from "./router/AppRouter";

// Navigation
export { default as DynamicNavigation } from "./navigation/DynamicNavigation";

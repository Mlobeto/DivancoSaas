/**
 * Module Loader
 *
 * Dynamically loads and initializes all business modules.
 * This is called once at app startup.
 */

import { moduleRegistry } from "@/product";

/**
 * Load all modules
 *
 * This function imports all module definitions and registers them.
 * Add new modules here as they are created.
 */
export async function loadModules(): Promise<void> {
  console.log("[ModuleLoader] Loading modules...");

  try {
    // Import all module definitions
    // These imports are done dynamically to allow for code splitting in the future
    const [
      { rentalModule },
      { inventoryModule },
      { clientsModule },
      { purchasesModule },
    ] = await Promise.all([
      import("@/modules/rental"),
      import("@/modules/inventory"),
      import("@/modules/clients"),
      import("@/modules/purchases"),
    ]);

    // Register all modules
    const results = moduleRegistry.registerAll([
      inventoryModule,
      clientsModule,
      purchasesModule,
      rentalModule,
    ]);

    // Log results
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    console.log(
      `[ModuleLoader] Loaded ${successful}/${results.length} modules`,
    );

    if (failed.length > 0) {
      console.error("[ModuleLoader] Failed modules:", failed);
    }

    // Initialize modules
    await moduleRegistry.initialize();

    // Lock registry to prevent further mutations
    moduleRegistry.lock();

    // Log statistics
    const stats = moduleRegistry.getStats();
    console.log("[ModuleLoader] Registry stats:", stats);
  } catch (error) {
    console.error("[ModuleLoader] Critical error loading modules:", error);
    throw error;
  }
}

/**
 * Reload modules (for development/testing)
 */
export async function reloadModules(): Promise<void> {
  console.log("[ModuleLoader] Reloading modules...");
  moduleRegistry.destroy();
  await loadModules();
}

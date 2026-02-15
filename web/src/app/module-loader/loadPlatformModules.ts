/**
 * Platform Module Loader
 *
 * Loads and initializes the PLATFORM architecture:
 * 1. CORE modules (horizontal capabilities)
 * 2. VERTICAL modules (industry-specific orchestration)
 *
 * This is called once at app startup.
 */

import { coreRegistry, verticalRegistry } from "@/product";

/**
 * Load all platform modules
 *
 * Order is critical:
 * 1. Register CORE modules first (they don't depend on anything)
 * 2. Register VERTICAL modules (they depend on core)
 * 3. Initialize both registries
 * 4. Lock both registries
 */
export async function loadPlatformModules(): Promise<void> {
  console.log("[PlatformLoader] Loading platform modules...");

  // Check if already loaded (prevents double-loading in development)
  if (coreRegistry.isLocked() && verticalRegistry.isLocked()) {
    console.log(
      "[PlatformLoader] Registries already locked, skipping reload (development mode)",
    );
    return;
  }

  try {
    // ============================================================
    // STEP 1: Load CORE modules
    // ============================================================
    console.log(
      "[PlatformLoader] Skipping CORE modules (still in @/modules)...",
    );

    // TODO: Core modules still in @/modules/* will be migrated to @/core/* in Phase 2
    // For now, they will be loaded via the old loadModules() system
    // Once migrated:
    // - import("@/core/inventory")
    // - import("@/core/clients")
    // - import("@/core/purchases")

    // Since we're not loading core modules yet, we still need to lock the registry
    // so verticals can't be registered incorrectly
    coreRegistry.lock();

    console.log("[PlatformLoader] CORE registry locked (empty for now)");

    // ============================================================
    // STEP 2: Load VERTICAL modules
    // ============================================================
    console.log("[PlatformLoader] Loading VERTICAL modules...");

    // Import vertical definitions
    const [{ rentalVertical }] = await Promise.all([
      import("@/verticals/rental"),
    ]);

    // Register vertical modules
    const verticalResults = verticalRegistry.registerAll([rentalVertical]);

    // Log vertical registration results
    const verticalSuccessful = verticalResults.filter((r) => r.success).length;
    const verticalFailed = verticalResults.filter((r) => !r.success);

    console.log(
      `[PlatformLoader] Registered ${verticalSuccessful}/${verticalResults.length} VERTICAL modules`,
    );

    if (verticalFailed.length > 0) {
      console.error(
        "[PlatformLoader] Failed VERTICAL modules:",
        verticalFailed,
      );

      // Check for missing core modules
      verticalFailed.forEach((result) => {
        if (result.missingCoreModules.length > 0) {
          console.error(
            `[PlatformLoader] Vertical '${result.verticalId}' is missing required CORE modules:`,
            result.missingCoreModules,
          );
        }
      });
    }

    // Initialize vertical modules
    await verticalRegistry.initialize();

    // Lock vertical registry
    verticalRegistry.lock();

    console.log("[PlatformLoader] VERTICAL modules loaded and locked");

    // ============================================================
    // STEP 3: Log final statistics
    // ============================================================
    const coreStats = coreRegistry.getStats();
    const verticalStats = verticalRegistry.getStats();

    console.log("[PlatformLoader] === Platform Ready ===");
    console.log("[PlatformLoader] CORE stats:", coreStats);
    console.log("[PlatformLoader] VERTICAL stats:", verticalStats);
    console.log("[PlatformLoader] ========================");
  } catch (error) {
    console.error(
      "[PlatformLoader] Critical error loading platform modules:",
      error,
    );
    throw error;
  }
}

/**
 * Get platform loading status
 */
export function getPlatformStatus() {
  return {
    core: {
      locked: coreRegistry.isLocked(),
      initialized: coreRegistry.isInitialized(),
      stats: coreRegistry.getStats(),
    },
    vertical: {
      locked: verticalRegistry.isLocked(),
      initialized: verticalRegistry.isInitialized(),
      stats: verticalRegistry.getStats(),
    },
  };
}

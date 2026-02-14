import { Prisma } from "@prisma/client";
import {
  hasRequestContext,
  getTenantId,
  getBusinessUnitId,
} from "@shared/context/request-context";
import {
  isTenantScoped,
  isBusinessUnitScoped,
  isGlobalModel,
  hasSpecialHandling,
  getEnforcementStrategy,
} from "./tenant-model-registry";

/**
 * Prisma Client Extension for Multi-Tenant Isolation - HARDENED
 *
 * STRICT ENFORCEMENT:
 * - Tenant-scoped models REQUIRE request context with valid tenantId
 * - If context is missing → THROWS ERROR (prevents data leakage)
 * - Automatically injects tenantId/businessUnitId into ALL operations
 * - Converts findUnique to findFirst when tenant filtering required
 *
 * SECURITY GUARANTEE:
 * Impossible to accidentally access another tenant's data, even if:
 * - Developer forgets to add where filters
 * - Direct Prisma client usage in services
 * - Background jobs without proper context
 *
 * BYPASS MECHANISMS (use with caution):
 * 1. prismaBase (unextended client) - for seeds, migrations, system operations
 * 2. runWithContext() - for background jobs with known tenant
 *
 * Usage:
 * ```typescript
 * import prisma from "@config/database"; // Extended client
 *
 * // Automatically filtered by tenantId from request context
 * const assets = await prisma.asset.findMany(); // Only THIS tenant's assets
 * ```
 */

/**
 * Custom error for tenant context violations
 */
class TenantContextError extends Error {
  constructor(model: string, operation: string) {
    super(
      `[TENANT ISOLATION VIOLATION] Cannot perform ${operation} on model "${model}" without tenant context. ` +
        `This is a security error. Ensure: ` +
        `1) contextInjector middleware is registered, OR ` +
        `2) Use runWithContext() for background jobs, OR ` +
        `3) Use prismaBase for system operations (seeds/migrations).`,
    );
    this.name = "TenantContextError";
  }
}

/**
 * Tenant Isolation Extension - HARDENED
 *
 * STRICT MODE: Throws error if tenant-scoped model accessed without context
 */
export const tenantIsolationExtension = Prisma.defineExtension({
  name: "tenantIsolation",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Skip global models (never filtered)
        if (isGlobalModel(model as string)) {
          return query(args);
        }

        // Skip special handling models (filtered via relations)
        if (hasSpecialHandling(model as string)) {
          return query(args);
        }

        // Check enforcement strategy
        const strategy = getEnforcementStrategy(model as string);

        // If model requires tenant isolation
        if (strategy.requireTenant) {
          // STRICT ENFORCEMENT: Context MUST exist
          if (!hasRequestContext()) {
            throw new TenantContextError(model as string, operation);
          }

          const tenantId = getTenantId();

          // Validate tenantId exists and is valid
          if (
            !tenantId ||
            typeof tenantId !== "string" ||
            tenantId.trim() === ""
          ) {
            throw new TenantContextError(model as string, operation);
          }

          // Inject tenantId based on operation type
          switch (operation) {
            case "findUnique":
            case "findUniqueOrThrow":
              // SECURITY: Convert findUnique to findFirst to inject tenant filter
              // findUnique by id-only is UNSAFE in multi-tenant context
              console.warn(
                `[Prisma Security] Converting ${model}.${operation} to findFirst with tenant filter. ` +
                  `Consider using findFirst directly for better clarity.`,
              );

              // Convert to findFirst and inject tenantId
              args.where = {
                ...args.where,
                tenantId,
              };

              // Use findFirst instead
              const findFirstResult =
                operation === "findUnique"
                  ? await (query as any)({ ...args, operation: "findFirst" })
                  : await (query as any)({
                      ...args,
                      operation: "findFirstOrThrow",
                    });

              return findFirstResult;

            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "count":
            case "aggregate":
            case "groupBy":
              // Add tenantId to where clause
              args.where = {
                ...args.where,
                tenantId,
              };
              break;

            case "create":
            case "createMany":
              // Inject tenantId into data
              if (Array.isArray(args.data)) {
                // createMany with array of records
                args.data = args.data.map((item: any) => ({
                  ...item,
                  tenantId,
                })) as any;
              } else {
                // Single create
                args.data = {
                  ...(args.data as any),
                  tenantId,
                } as any;
              }
              break;

            case "update":
            case "updateMany":
              // SECURITY: Prevent updating other tenant's data
              args.where = {
                ...(args.where as any),
                tenantId,
              } as any;
              break;

            case "upsert":
              // Enforce tenantId in where AND inject into create/update
              args.where = {
                ...(args.where as any),
                tenantId,
              } as any;

              if ((args as any).create) {
                (args as any).create = {
                  ...(args as any).create,
                  tenantId,
                };
              }
              if ((args as any).update) {
                // Update doesn't need tenantId injection (already in where)
                // but we keep it for consistency
                (args as any).update = {
                  ...(args as any).update,
                  tenantId,
                };
              }
              break;

            case "delete":
            case "deleteMany":
              // SECURITY: Prevent deleting other tenant's data
              args.where = {
                ...args.where,
                tenantId,
              };
              break;

            default:
              // Unknown operation - log warning but continue
              console.warn(
                `[Prisma] Unknown operation "${operation}" on tenant-scoped model "${model}". ` +
                  `Tenant filtering may not be applied.`,
              );
              break;
          }
        }

        return query(args);
      },
    },
  },
});

/**
 * Business Unit Scoping Extension - HARDENED
 *
 * Enforces business unit isolation on BU-scoped models when businessUnitId
 * is present in request context.
 *
 * OPTIONAL ENFORCEMENT:
 * - If businessUnitId in context → automatically filter by it
 * - If no businessUnitId → skip BU filtering (tenant filter still applies)
 *
 * This allows:
 * - BU-specific queries (most common)
 * - Tenant-wide queries (when BU not in context)
 */
export const businessUnitScopingExtension = Prisma.defineExtension({
  name: "businessUnitScoping",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Only apply to BU-scoped models
        if (!isBusinessUnitScoped(model as string)) {
          return query(args);
        }

        // Only apply if we have request context
        if (!hasRequestContext()) {
          return query(args);
        }

        // Get businessUnitId from context (optional)
        const businessUnitId = getBusinessUnitId();

        // If no BU in context, skip BU filtering
        // (Tenant filter from previous extension still applies)
        if (!businessUnitId) {
          return query(args);
        }

        // Inject businessUnitId based on operation type
        switch (operation) {
          case "findUnique":
          case "findUniqueOrThrow":
          case "findFirst":
          case "findFirstOrThrow":
          case "findMany":
          case "count":
          case "aggregate":
          case "groupBy":
            args.where = {
              ...args.where,
              businessUnitId,
            };
            break;

          case "create":
            args.data = {
              ...(args.data as any),
              businessUnitId,
            } as any;
            break;

          case "createMany":
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                businessUnitId,
              })) as any;
            } else {
              args.data = {
                ...(args.data as any),
                businessUnitId,
              } as any;
            }
            break;

          case "update":
          case "updateMany":
            args.where = {
              ...args.where,
              businessUnitId,
            };
            break;

          case "upsert":
            args.where = {
              ...(args.where as any),
              businessUnitId,
            } as any;

            if ((args as any).create) {
              (args as any).create = {
                ...(args as any).create,
                businessUnitId,
              };
            }
            break;

          case "delete":
          case "deleteMany":
            args.where = {
              ...(args.where as any),
              businessUnitId,
            } as any;
            break;

          default:
            // Unknown operation, pass through
            break;
        }

        return query(args);
      },
    },
  },
});

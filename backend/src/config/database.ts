import { PrismaClient } from "@prisma/client";
import {
  tenantIsolationExtension,
  businessUnitScopingExtension,
} from "./prisma-extensions";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Base Prisma Client (without extensions)
export const prismaBase =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prismaBase;
}

/**
 * Prisma Client WITH automatic tenant isolation
 *
 * Use this in your services for automatic multi-tenant filtering:
 *
 * @example
 * import { prisma } from "@config/database";
 *
 * // Automatically filtered by tenantId from request context
 * const assets = await prisma.asset.findMany();
 *
 * // No need to manually add: where: { tenantId }
 */
export const prisma = prismaBase
  .$extends(tenantIsolationExtension)
  .$extends(businessUnitScopingExtension);

/**
 * Use prismaBase for operations that should NOT be tenant-scoped:
 * - Seeds and migrations
 * - Admin operations across all tenants
 * - Background jobs with explicit tenant context
 *
 * @example
 * import { prismaBase } from "@config/database";
 *
 * // No automatic filtering - queries ALL tenants
 * const allUsers = await prismaBase.user.findMany();
 */

export default prisma;

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * NOTA: Prisma 6 eliminó prisma.$use() middleware
 *
 * La validación de multitenancy (tenantId obligatorio) se debe hacer en:
 * 1. Middlewares de Express (validateBusinessUnitContext)
 * 2. Services que siempre reciben tenantId como parámetro
 * 3. Tests que verifican aislamiento de datos
 *
 * Ver: GUARD_RAILS.md para principios de multitenancy
 */

export default prisma;

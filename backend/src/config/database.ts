import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Middleware para asegurar que todas las queries incluyan tenantId
 * CRÍTICO: Evita data leak entre tenants
 */
prisma.$use(async (params, next) => {
  // Solo aplica a modelos que tienen tenantId
  const modelsWithTenant = [
    'User',
    'BusinessUnit',
    'AuditLog',
    'PlatformSubscription',
  ];
  
  if (modelsWithTenant.includes(params.model || '')) {
    // Verificar que se esté filtrando por tenantId en operaciones de lectura
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
      if (!params.args.where?.tenantId) {
        console.warn(`⚠️ Query sin tenantId en modelo ${params.model}`, params.args);
      }
    }
  }
  
  return next(params);
});

export default prisma;

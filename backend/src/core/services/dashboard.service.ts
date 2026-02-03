/**
 * DASHBOARD SERVICE
 *
 * Servicio para obtener estadísticas y métricas del dashboard
 * para cada Business Unit y Tenant.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalBusinessUnits: number;
    activeModules: number;
  };
  equipment?: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    outOfService: number;
  };
  recentActivity: {
    eventCount: number;
    pendingEvents: number;
    failedEvents: number;
  };
}

/**
 * Obtiene estadísticas generales de un Tenant
 */
export async function getTenantStats(
  tenantId: string,
): Promise<DashboardStats> {
  const [
    totalUsers,
    activeUsers,
    totalBusinessUnits,
    enabledModules,
    eventStats,
  ] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.businessUnit.count({ where: { tenantId } }),
    prisma.businessUnitModule.count({ where: { isEnabled: true } }),
    prisma.eventQueue.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
  ]);

  const pendingEvents =
    eventStats.find((s) => s.status === "PENDING")?._count || 0;
  const failedEvents =
    eventStats.find((s) => s.status === "FAILED")?._count || 0;
  const eventCount = eventStats.reduce((sum, s) => sum + s._count, 0);

  return {
    overview: {
      totalUsers,
      activeUsers,
      totalBusinessUnits,
      activeModules: enabledModules,
    },
    recentActivity: {
      eventCount,
      pendingEvents,
      failedEvents,
    },
  };
}

/**
 * Obtiene estadísticas de un Business Unit específico
 * (incluye métricas de equipos si aplica)
 */
export async function getBusinessUnitStats(
  businessUnitId: string,
): Promise<DashboardStats> {
  const businessUnit = await prisma.businessUnit.findUnique({
    where: { id: businessUnitId },
    include: {
      userBusinessUnits: true,
      enabledModules: true,
      equipment: true,
    },
  });

  if (!businessUnit) {
    throw new Error("Business Unit not found");
  }

  const [activeUsers, eventStats] = await Promise.all([
    prisma.userBusinessUnit.count({
      where: {
        businessUnitId,
        user: { status: "ACTIVE" },
      },
    }),
    prisma.eventQueue.groupBy({
      by: ["status"],
      where: { businessUnitId },
      _count: true,
    }),
  ]);

  const pendingEvents =
    eventStats.find((s) => s.status === "PENDING")?._count || 0;
  const failedEvents =
    eventStats.find((s) => s.status === "FAILED")?._count || 0;
  const eventCount = eventStats.reduce((sum, s) => sum + s._count, 0);

  const stats: DashboardStats = {
    overview: {
      totalUsers: businessUnit.userBusinessUnits.length,
      activeUsers,
      totalBusinessUnits: 1,
      activeModules: businessUnit.enabledModules.filter((m) => m.isEnabled)
        .length,
    },
    recentActivity: {
      eventCount,
      pendingEvents,
      failedEvents,
    },
  };

  // Si tiene equipos, agregar estadísticas de equipos
  if (businessUnit.equipment && businessUnit.equipment.length > 0) {
    const equipmentByStatus = businessUnit.equipment.reduce(
      (acc, eq: any) => {
        acc[eq.status] = (acc[eq.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    stats.equipment = {
      total: businessUnit.equipment.length,
      available: equipmentByStatus.AVAILABLE || 0,
      rented: equipmentByStatus.RENTED || 0,
      maintenance: equipmentByStatus.MAINTENANCE || 0,
      outOfService: equipmentByStatus.OUT_OF_SERVICE || 0,
    };
  }

  return stats;
}

/**
 * Obtiene actividad reciente del sistema
 */
export async function getRecentActivity(tenantId: string, limit: number = 10) {
  const recentEvents = await prisma.eventQueue.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      businessUnit: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return recentEvents.map((event) => ({
    id: event.id,
    intent: event.intent,
    status: event.status,
    channel: event.channel,
    createdAt: event.createdAt,
    processedAt: event.processedAt,
    user: {
      id: event.user.id,
      email: event.user.email,
      fullName: `${event.user.firstName} ${event.user.lastName}`,
    },
    businessUnit: {
      id: event.businessUnit.id,
      name: event.businessUnit.name,
    },
  }));
}

/**
 * Obtiene métricas por módulo habilitado
 */
export async function getModuleMetrics(businessUnitId: string) {
  const enabledModules = await prisma.businessUnitModule.findMany({
    where: {
      businessUnitId,
      isEnabled: true,
    },
    include: {
      module: true,
    },
  });

  return enabledModules.map((buModule) => ({
    id: buModule.module.id,
    name: buModule.module.name,
    displayName: buModule.module.displayName,
    category: buModule.module.category,
    isEnabled: buModule.isEnabled,
  }));
}

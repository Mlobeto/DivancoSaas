/**
 * Maintenance Service
 *
 * Manages asset maintenance records
 */

import { PrismaClient, MaintenanceRecord } from "@prisma/client";
import {
  CreateMaintenanceDTO,
  UpdateMaintenanceDTO,
} from "../types/asset.types";

export class MaintenanceService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create maintenance record
   */
  async createMaintenance(
    tenantId: string,
    businessUnitId: string,
    data: CreateMaintenanceDTO,
  ): Promise<MaintenanceRecord> {
    // Verify asset exists and belongs to tenant/BU
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: data.assetId,
        tenantId,
        businessUnitId,
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    const maintenance = await this.prisma.maintenanceRecord.create({
      data: {
        assetId: data.assetId,
        description: data.description,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
      },
    });

    // Emit maintenance event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "maintenance.started",
        source: "system",
        payload: {
          maintenanceId: maintenance.id,
          startedAt: maintenance.startedAt,
        },
      },
    });

    return maintenance;
  }

  /**
   * Get maintenance record by ID
   */
  async getMaintenanceById(
    tenantId: string,
    businessUnitId: string,
    maintenanceId: string,
  ): Promise<MaintenanceRecord | null> {
    const maintenance = await this.prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId },
      include: { asset: true },
    });

    // Verify tenant/BU access
    if (
      maintenance &&
      (maintenance.asset.tenantId !== tenantId ||
        maintenance.asset.businessUnitId !== businessUnitId)
    ) {
      return null;
    }

    return maintenance;
  }

  /**
   * List maintenance records for an asset
   */
  async listMaintenanceByAsset(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ): Promise<MaintenanceRecord[]> {
    // Verify asset exists and belongs to tenant/BU
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        tenantId,
        businessUnitId,
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    return this.prisma.maintenanceRecord.findMany({
      where: { assetId },
      orderBy: { startedAt: "desc" },
    });
  }

  /**
   * Update maintenance record
   */
  async updateMaintenance(
    tenantId: string,
    businessUnitId: string,
    maintenanceId: string,
    data: UpdateMaintenanceDTO,
  ): Promise<MaintenanceRecord> {
    const existing = await this.getMaintenanceById(
      tenantId,
      businessUnitId,
      maintenanceId,
    );

    if (!existing) {
      throw new Error("Maintenance record not found");
    }

    const maintenance = await this.prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: {
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.endedAt !== undefined && { endedAt: data.endedAt }),
      },
    });

    // Emit maintenance event if completed
    if (data.endedAt && !existing.endedAt) {
      await this.prisma.assetEvent.create({
        data: {
          tenantId,
          businessUnitId,
          assetId: existing.assetId,
          eventType: "maintenance.completed",
          source: "system",
          payload: {
            maintenanceId: maintenance.id,
            endedAt: maintenance.endedAt,
          },
        },
      });
    }

    return maintenance;
  }

  /**
   * Get active maintenance records (not completed)
   */
  async getActiveMaintenance(
    tenantId: string,
    businessUnitId: string,
  ): Promise<MaintenanceRecord[]> {
    return this.prisma.maintenanceRecord.findMany({
      where: {
        endedAt: null,
        asset: {
          tenantId,
          businessUnitId,
        },
      },
      include: {
        asset: true,
      },
      orderBy: { startedAt: "desc" },
    });
  }

  /**
   * Maintenance Dashboard
   * Returns assets grouped by maintenance state for the workshop view
   */
  async getDashboard(tenantId: string, businessUnitId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Activos pendientes de mantenimiento (recién devueltos de alquiler)
    const pendingMaintenance = await this.prisma.asset.findMany({
      where: {
        tenantId,
        businessUnitId,
        state: { currentState: "PENDING_MAINTENANCE" },
      },
      include: {
        state: true,
        maintenanceEvents: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        assetRentals: {
          where: { actualReturnDate: { not: null } },
          orderBy: { actualReturnDate: "desc" },
          take: 1,
          include: {
            contract: { include: { client: { select: { name: true } } } },
          },
        },
      },
      orderBy: { updatedAt: "asc" }, // Los más antiguos primero (mayor urgencia)
    });

    // Activos actualmente en mantenimiento
    const inMaintenance = await this.prisma.asset.findMany({
      where: {
        tenantId,
        businessUnitId,
        state: { currentState: "MAINTENANCE" },
      },
      include: {
        state: true,
        maintenanceEvents: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        preventiveConfigs: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    // Mantenimientos completados este mes
    const completedThisMonth = await this.prisma.maintenanceEvent.count({
      where: {
        asset: { tenantId, businessUnitId },
        createdAt: { gte: startOfMonth },
      },
    });

    // Activos fuera de servicio (descartados)
    const outOfService = await this.prisma.asset.findMany({
      where: {
        tenantId,
        businessUnitId,
        state: { currentState: "OUT_OF_SERVICE" },
      },
      include: { state: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return {
      pendingMaintenance,
      inMaintenance,
      completedThisMonth,
      outOfService,
      summary: {
        totalPending: pendingMaintenance.length,
        totalInMaintenance: inMaintenance.length,
        totalOutOfService: outOfService.length,
        completedThisMonth,
      },
    };
  }
}

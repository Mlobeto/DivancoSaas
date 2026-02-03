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
}

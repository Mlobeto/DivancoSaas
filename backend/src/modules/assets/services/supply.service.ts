/**
 * Supply Service
 *
 * Maneja insumos, configuración preventiva y eventos de mantenimiento
 * Implementa workflows 1, 4, 7, 8 del documento de workflows
 */

import { PrismaClient, Supply, SupplyUsage } from "@prisma/client";
import {
  CreateSupplyDTO,
  UpdateSupplyDTO,
  SupplyFilters,
  CreateSupplyUsageDTO,
  CreatePreventiveConfigDTO,
  UpdatePreventiveConfigDTO,
  CreateMaintenanceEventDTO,
  PaginationParams,
  PaginatedResponse,
} from "../types/rental.types";

export class SupplyService {
  constructor(private readonly prisma: PrismaClient) {}

  // ============================================
  // SUPPLIES (Insumos)
  // ============================================

  /**
   * Create supply
   */
  async createSupply(
    tenantId: string,
    businessUnitId: string,
    data: CreateSupplyDTO,
  ): Promise<Supply> {
    const supply = await this.prisma.supply.create({
      data: {
        tenantId,
        businessUnitId,
        name: data.name,
        unit: data.unit,
        stock: data.stock,
      },
    });

    return supply;
  }

  /**
   * Get supply by ID
   */
  async getSupplyById(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
  ) {
    return this.prisma.supply.findFirst({
      where: {
        id: supplyId,
        tenantId,
        businessUnitId,
      },
      include: {
        usages: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  }

  /**
   * List supplies
   */
  async listSupplies(
    tenantId: string,
    businessUnitId: string,
    filters: SupplyFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResponse<Supply>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      businessUnitId,
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { unit: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };

    const [supplies, total] = await Promise.all([
      this.prisma.supply.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.supply.count({ where }),
    ]);

    return {
      data: supplies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update supply
   */
  async updateSupply(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
    data: UpdateSupplyDTO,
  ): Promise<Supply> {
    // Verify supply exists
    const existing = await this.prisma.supply.findFirst({
      where: { id: supplyId, tenantId, businessUnitId },
    });

    if (!existing) {
      throw new Error("Supply not found");
    }

    return this.prisma.supply.update({
      where: { id: supplyId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.unit && { unit: data.unit }),
        ...(data.stock !== undefined && { stock: data.stock }),
      },
    });
  }

  // ============================================
  // SUPPLY USAGE (Workflow 8: Descarte)
  // ============================================

  /**
   * Record supply usage
   * Usado en workflows 4, 7, 8
   */
  async recordSupplyUsage(
    tenantId: string,
    businessUnitId: string,
    data: CreateSupplyUsageDTO,
  ): Promise<SupplyUsage> {
    // Verify supply exists
    const supply = await this.prisma.supply.findFirst({
      where: {
        id: data.supplyId,
        tenantId,
        businessUnitId,
      },
    });

    if (!supply) {
      throw new Error("Supply not found");
    }

    // If asset provided, verify it exists
    if (data.assetId) {
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
    }

    // Create usage record
    const usage = await this.prisma.supplyUsage.create({
      data: {
        supplyId: data.supplyId,
        assetId: data.assetId,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      },
    });

    // Update stock
    await this.prisma.supply.update({
      where: { id: data.supplyId },
      data: {
        stock: {
          decrement: data.quantity,
        },
      },
    });

    // Emit event
    if (data.assetId) {
      await this.prisma.assetEvent.create({
        data: {
          tenantId,
          businessUnitId,
          assetId: data.assetId,
          eventType: `supply.${data.reason}`,
          source: "system",
          payload: {
            usageId: usage.id,
            supplyId: data.supplyId,
            quantity: data.quantity,
            reason: data.reason,
          },
        },
      });
    }

    return usage;
  }

  /**
   * Discard supply (Workflow 8)
   */
  async discardSupply(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
    quantity: number,
    reason: string,
    assetId?: string,
  ) {
    return this.recordSupplyUsage(tenantId, businessUnitId, {
      supplyId,
      quantity,
      reason: "discard",
      notes: reason, // Motivo obligatorio en notes
      assetId,
    });
  }

  // ============================================
  // PREVENTIVE CONFIG (Workflow 1)
  // ============================================

  /**
   * Configure preventive maintenance for asset
   * Workflow 1: Alta de Activo con Configuración Preventiva
   */
  async configurePreventiveMaintenance(
    tenantId: string,
    businessUnitId: string,
    data: CreatePreventiveConfigDTO,
  ) {
    // Verify asset exists and requires clinic
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

    if (!asset.requiresClinic) {
      throw new Error("Asset does not require preventive configuration");
    }

    // Get current version
    const latestConfig = await this.prisma.preventiveConfig.findFirst({
      where: { assetId: data.assetId },
      orderBy: { version: "desc" },
    });

    const nextVersion = latestConfig ? latestConfig.version + 1 : 1;

    // Create new version
    const config = await this.prisma.preventiveConfig.create({
      data: {
        assetId: data.assetId,
        version: nextVersion,
        suppliesConfig: data.suppliesConfig,
        notes: data.notes,
      },
    });

    // Emit event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "asset.preventive_config_created",
        source: "system",
        payload: {
          configId: config.id,
          version: nextVersion,
        },
      },
    });

    return config;
  }

  /**
   * Update preventive configuration
   */
  async updatePreventiveConfig(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    data: UpdatePreventiveConfigDTO,
  ) {
    // Verify asset exists
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

    // Get latest config
    const latestConfig = await this.prisma.preventiveConfig.findFirst({
      where: { assetId },
      orderBy: { version: "desc" },
    });

    if (!latestConfig) {
      throw new Error("No preventive configuration found for this asset");
    }

    // Create new version (configurations are immutable, we version them)
    const nextVersion = latestConfig.version + 1;
    const newConfig = await this.prisma.preventiveConfig.create({
      data: {
        assetId,
        version: nextVersion,
        suppliesConfig: (data.suppliesConfig ||
          latestConfig.suppliesConfig) as any,
        notes: data.notes || latestConfig.notes,
      },
    });

    // Emit event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId,
        eventType: "asset.preventive_config_updated",
        source: "system",
        payload: {
          configId: newConfig.id,
          previousVersion: latestConfig.version,
          newVersion: nextVersion,
        },
      },
    });

    return newConfig;
  }

  /**
   * Get latest preventive config for asset
   */
  async getLatestPreventiveConfig(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ) {
    // Verify asset exists
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

    return this.prisma.preventiveConfig.findFirst({
      where: { assetId },
      orderBy: { version: "desc" },
    });
  }

  // ============================================
  // MAINTENANCE EVENTS (Workflows 4, 7)
  // ============================================

  /**
   * Execute preventive maintenance in obra
   * Workflow 4: Mantenimiento Preventivo en Obra
   */
  async executePreventiveMaintenance(
    tenantId: string,
    businessUnitId: string,
    data: CreateMaintenanceEventDTO & {
      suppliesUsed: Array<{ supplyId: string; quantity: number }>;
    },
  ) {
    // Verify asset exists and is in use
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: data.assetId,
        tenantId,
        businessUnitId,
      },
      include: { state: true },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    // 1. Cambiar estado temporalmente
    const previousState = asset.state?.currentState;
    await this.prisma.assetState.update({
      where: { assetId: data.assetId },
      data: {
        currentState: "MAINTENANCE",
      },
    });

    // 2. Registrar insumos utilizados
    const supplyUsages = [];
    for (const supply of data.suppliesUsed) {
      const usage = await this.recordSupplyUsage(tenantId, businessUnitId, {
        supplyId: supply.supplyId,
        assetId: data.assetId,
        quantity: supply.quantity,
        reason: "preventive",
      });
      supplyUsages.push(usage);
    }

    // 3. Crear evento de mantenimiento
    const maintenanceEvent = await this.prisma.maintenanceEvent.create({
      data: {
        assetId: data.assetId,
        type: "PREVENTIVE",
        context: data.context || "OBRA",
        notes: data.notes,
        suppliesUsed: data.suppliesUsed,
      },
    });

    // 4. Restaurar estado
    await this.prisma.assetState.update({
      where: { assetId: data.assetId },
      data: {
        currentState: previousState || "IN_USE",
      },
    });

    // 5. Emit evento
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "asset.preventive_maintenance_completed",
        source: "system",
        payload: {
          maintenanceEventId: maintenanceEvent.id,
          context: data.context,
          suppliesUsedCount: supplyUsages.length,
        },
      },
    });

    return maintenanceEvent;
  }

  /**
   * Execute post-obra maintenance
   * Workflow 7: Mantenimiento Post-Obra (No Clínico)
   */
  async executePostObraMaintenance(
    tenantId: string,
    businessUnitId: string,
    data: CreateMaintenanceEventDTO & {
      suppliesUsed: Array<{ supplyId: string; quantity: number }>;
    },
  ) {
    // Verify asset exists and should be in MAINTENANCE state
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: data.assetId,
        tenantId,
        businessUnitId,
      },
      include: { state: true },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.state?.currentState !== "MAINTENANCE") {
      throw new Error("Asset is not in maintenance state");
    }

    // 1. Registrar insumos usados
    const supplyUsages = [];
    for (const supply of data.suppliesUsed) {
      const usage = await this.recordSupplyUsage(tenantId, businessUnitId, {
        supplyId: supply.supplyId,
        assetId: data.assetId,
        quantity: supply.quantity,
        reason: "post_obra",
      });
      supplyUsages.push(usage);
    }

    // 2. Crear evento de mantenimiento
    const maintenanceEvent = await this.prisma.maintenanceEvent.create({
      data: {
        assetId: data.assetId,
        type: "POST_OBRA",
        context: "TALLER",
        notes: data.notes,
        suppliesUsed: data.suppliesUsed,
      },
    });

    // 3. Cambiar a AVAILABLE
    await this.prisma.assetState.update({
      where: { assetId: data.assetId },
      data: {
        currentState: "AVAILABLE",
      },
    });

    // 4. Emit evento
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "asset.ready_for_rental",
        source: "system",
        payload: {
          maintenanceEventId: maintenanceEvent.id,
          suppliesUsedCount: supplyUsages.length,
        },
      },
    });

    return maintenanceEvent;
  }

  /**
   * Get maintenance history for asset
   */
  async getMaintenanceHistory(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ) {
    // Verify asset exists
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

    return this.prisma.maintenanceEvent.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
    });
  }
}

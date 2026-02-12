/**
 * Asset Service
 *
 * Core business logic for asset management
 * Following hexagonal architecture principles
 */

import { PrismaClient, Asset, Prisma } from "@prisma/client";
import {
  CreateAssetDTO,
  UpdateAssetDTO,
  AssetFilters,
  PaginationParams,
  PaginatedResponse,
  DecommissionAssetDTO,
} from "../types/asset.types";

export class AssetService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new asset
   */
  async createAsset(
    tenantId: string,
    businessUnitId: string,
    data: CreateAssetDTO,
  ): Promise<Asset> {
    const asset = await this.prisma.asset.create({
      data: {
        tenantId,
        businessUnitId,
        code: data.code,
        name: data.name,
        assetType: data.assetType,
        acquisitionCost: data.acquisitionCost,
        origin: data.origin,
        currentLocation: data.currentLocation,
        requiresOperator: data.requiresOperator ?? false,
        requiresTracking: data.requiresTracking ?? false,
        requiresClinic: data.requiresClinic ?? false,
        // Campos de template
        templateId: data.templateId,
        customData: data.customData,
        imageUrl: data.imageUrl,
        // Campos de compra
        purchaseOrderId: data.purchaseOrderId,
        supplierId: data.supplierId,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
      },
      include: {
        state: true,
      },
    });

    // Emit asset created event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: asset.id,
        eventType: "asset.created",
        source: "system",
        payload: {
          assetId: asset.id,
          name: asset.name,
          assetType: asset.assetType,
        },
      },
    });

    return asset;
  }

  /**
   * Get asset by ID
   */
  async getAssetById(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ): Promise<Asset | null> {
    return this.prisma.asset.findFirst({
      where: {
        id: assetId,
        tenantId,
        businessUnitId,
      },
      include: {
        state: true,
        maintenanceRecords: {
          orderBy: { startedAt: "desc" },
          take: 5,
        },
        usages: {
          orderBy: { date: "desc" },
          take: 10,
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  /**
   * List assets with filters and pagination
   */
  async listAssets(
    tenantId: string,
    businessUnitId: string,
    filters: AssetFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResponse<Asset>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      tenantId,
      businessUnitId,
      ...(filters.assetType && { assetType: filters.assetType }),
      ...(filters.requiresOperator !== undefined && {
        requiresOperator: filters.requiresOperator,
      }),
      ...(filters.requiresTracking !== undefined && {
        requiresTracking: filters.requiresTracking,
      }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { assetType: { contains: filters.search, mode: "insensitive" } },
          { origin: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          state: true,
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update asset
   */
  async updateAsset(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    data: UpdateAssetDTO,
  ): Promise<Asset> {
    const asset = await this.prisma.asset.update({
      where: {
        id: assetId,
        tenantId,
        businessUnitId,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.assetType && { assetType: data.assetType }),
        ...(data.acquisitionCost !== undefined && {
          acquisitionCost: data.acquisitionCost,
        }),
        ...(data.origin !== undefined && { origin: data.origin }),
        ...(data.requiresOperator !== undefined && {
          requiresOperator: data.requiresOperator,
        }),
        ...(data.requiresTracking !== undefined && {
          requiresTracking: data.requiresTracking,
        }),
        ...(data.requiresClinic !== undefined && {
          requiresClinic: data.requiresClinic,
        }),
      },
      include: {
        state: true,
      },
    });

    // Emit asset updated event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: asset.id,
        eventType: "asset.updated",
        source: "system",
        payload: {
          assetId: asset.id,
          changes: JSON.parse(JSON.stringify(data)),
        },
      },
    });

    return asset;
  }

  /**
   * Delete asset (soft delete via events)
   */
  async deleteAsset(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ): Promise<void> {
    // Emit deletion event first
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId,
        eventType: "asset.deleted",
        source: "system",
        payload: { assetId },
      },
    });

    // Hard delete (could be changed to soft delete with isDeleted flag)
    await this.prisma.asset.delete({
      where: {
        id: assetId,
        tenantId,
        businessUnitId,
      },
    });
  }

  /**
   * Update asset state (workflow-driven)
   */
  async updateAssetState(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    workflowId: string,
    currentState: string,
  ): Promise<void> {
    // Verify asset exists and belongs to tenant/BU
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, tenantId, businessUnitId },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    // Upsert state
    await this.prisma.assetState.upsert({
      where: { assetId },
      create: {
        assetId,
        workflowId,
        currentState,
      },
      update: {
        workflowId,
        currentState,
      },
    });

    // Emit state change event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId,
        eventType: "asset.state_changed",
        source: "workflow",
        payload: {
          workflowId,
          newState: currentState,
        },
      },
    });
  }

  /**
   * Get asset events history
   */
  async getAssetEvents(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    limit: number = 50,
  ) {
    return this.prisma.assetEvent.findMany({
      where: {
        tenantId,
        businessUnitId,
        assetId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Decommission asset (descarte con motivo obligatorio)
   * Workflow 8: Descarte de activos
   */
  async decommissionAsset(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    data: DecommissionAssetDTO,
  ): Promise<void> {
    // Verify asset exists
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, tenantId, businessUnitId },
      include: { state: true },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    // Change state to OUT_OF_SERVICE
    await this.prisma.assetState.upsert({
      where: { assetId },
      create: {
        assetId,
        workflowId: "asset-lifecycle",
        currentState: "OUT_OF_SERVICE",
      },
      update: {
        currentState: "OUT_OF_SERVICE",
      },
    });

    // Emit decommission event with reason
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId,
        eventType: "asset.decommissioned",
        source: "system",
        payload: {
          reason: data.reason,
          notes: data.notes,
          attributableToClient: data.attributableToClient,
          clientId: data.clientId,
          previousState: asset.state?.currentState,
        },
      },
    });
  }

  /**
   * Update asset location
   * Used internally when asset moves (assignment, return, etc)
   */
  async updateAssetLocation(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    location: string,
  ): Promise<void> {
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { currentLocation: location },
    });

    // Emit location change event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId,
        eventType: "asset.location_changed",
        source: "system",
        payload: {
          newLocation: location,
        },
      },
    });
  }

  /**
   * Upload main image for asset
   */
  async uploadMainImage(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    imageUrl: string,
  ): Promise<Asset> {
    const asset = await this.prisma.asset.update({
      where: { id: assetId },
      data: { imageUrl },
    });

    // Emit event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId,
        eventType: "asset.image_uploaded",
        source: "system",
        payload: { imageUrl },
      },
    });

    return asset;
  }

  /**
   * Delete main image
   */
  async deleteMainImage(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ): Promise<Asset> {
    return this.prisma.asset.update({
      where: { id: assetId },
      data: { imageUrl: null },
    });
  }

  /**
   * Get next available code for asset type
   * Returns suggested code based on asset type prefix
   */
  async getNextAvailableCode(
    tenantId: string,
    businessUnitId: string,
    assetType: string,
  ): Promise<string> {
    // Define prefixes for each asset type
    const prefixes: Record<string, string> = {
      IMPLEMENTO: "IMP",
      HERRAMIENTA: "HER",
      VEHICULO: "VEH",
      MAQUINARIA: "MAQ",
    };

    const prefix = prefixes[assetType] || "AST";

    // Find the last asset with this prefix
    const lastAsset = await this.prisma.asset.findFirst({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: "desc",
      },
    });

    if (!lastAsset) {
      return `${prefix}001`;
    }

    // Extract number from last code (e.g., "IMP005" -> 5)
    const match = lastAsset.code.match(/\d+$/);
    if (!match) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(match[0], 10);
    const nextNumber = lastNumber + 1;

    // Pad with zeros (3 digits minimum)
    return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  }
}

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
import { azureBlobStorageService } from "../../../shared/storage/azure-blob-storage.service";

export class AssetService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Enrich asset with SAS URL for image
   * Converts blobName to temporary SAS URL (24 hours)
   */
  private async enrichAssetWithSasUrl(asset: Asset): Promise<Asset> {
    if (asset.imageUrl && !asset.imageUrl.startsWith("http")) {
      // Si imageUrl no es una URL completa, es un blobName - generar SAS URL
      try {
        // Use default container from env (or 'uploads' if not set)
        const containerName =
          process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";
        const sasUrl = await azureBlobStorageService.generateSasUrl(
          containerName,
          asset.imageUrl,
          1440, // 24 horas
        );
        return { ...asset, imageUrl: sasUrl };
      } catch (error) {
        console.error(
          `Failed to generate SAS URL for asset ${asset.id}:`,
          error,
        );
        // Mantener el blobName si falla
      }
    }
    return asset;
  }

  /**
   * Enrich multiple assets with SAS URLs
   */
  private async enrichAssetsWithSasUrls(assets: Asset[]): Promise<Asset[]> {
    return Promise.all(
      assets.map((asset) => this.enrichAssetWithSasUrl(asset)),
    );
  }

  /**
   * Create a new asset
   */
  async createAsset(
    tenantId: string,
    businessUnitId: string,
    data: CreateAssetDTO,
  ): Promise<Asset> {
    // Validaciones de pricing según trackingType
    if (data.trackingType === "MACHINERY" && !data.pricePerHour) {
      throw new Error("MACHINERY assets require pricePerHour");
    }
    if (data.trackingType === "TOOL" && !data.pricePerDay) {
      throw new Error("TOOL assets require pricePerDay");
    }
    if (data.operatorCostType && !data.operatorCostRate) {
      throw new Error("operatorCostType requires operatorCostRate");
    }

    // Determinar si necesita crear rentalProfile
    const hasRentalData =
      data.trackingType || data.pricePerHour || data.pricePerDay;

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
        salePrice: data.salePrice,
        // RENTAL: Mantener campos legacy para compatibilidad temporal
        trackingType: data.trackingType,
        pricePerHour: data.pricePerHour,
        minDailyHours: data.minDailyHours,
        pricePerKm: data.pricePerKm,
        pricePerDay: data.pricePerDay,
        pricePerWeek: data.pricePerWeek,
        operatorCostType: data.operatorCostType,
        operatorCostRate: data.operatorCostRate,
        maintenanceCostDaily: data.maintenanceCostDaily,
        // Crear AssetRentalProfile si tiene datos rental
        ...(hasRentalData && {
          rentalProfile: {
            create: {
              tenantId,
              businessUnitId,
              trackingType: data.trackingType,
              pricePerHour: data.pricePerHour,
              minDailyHours: data.minDailyHours,
              pricePerKm: data.pricePerKm,
              pricePerDay: data.pricePerDay,
              pricePerWeek: data.pricePerWeek,
              pricePerMonth: data.pricePerMonth,
              operatorCostType: data.operatorCostType,
              operatorCostRate: data.operatorCostRate,
              maintenanceCostDaily: data.maintenanceCostDaily,
            },
          },
        }),
      },
      include: {
        state: true,
        rentalProfile: true,
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
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        tenantId,
        businessUnitId,
      },
      include: {
        state: true,
        rentalProfile: true, // Incluir perfil rental si existe
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

    if (!asset) return null;

    // Enrich with SAS URL
    return this.enrichAssetWithSasUrl(asset);
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
          rentalProfile: true, // Incluir perfil rental si existe
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    // Enrich all assets with SAS URLs
    const enrichedAssets = await this.enrichAssetsWithSasUrls(assets);

    return {
      data: enrichedAssets,
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
    // Validaciones de pricing si cambia trackingType
    if (data.trackingType === "MACHINERY" && data.pricePerHour === undefined) {
      const current = await this.prisma.asset.findUnique({
        where: { id: assetId },
      });
      if (!current?.pricePerHour && data.pricePerHour === undefined) {
        throw new Error("MACHINERY assets require pricePerHour");
      }
    }
    if (data.trackingType === "TOOL" && data.pricePerDay === undefined) {
      const current = await this.prisma.asset.findUnique({
        where: { id: assetId },
      });
      if (!current?.pricePerDay && data.pricePerDay === undefined) {
        throw new Error("TOOL assets require pricePerDay");
      }
    }

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
        ...(data.currentLocation !== undefined && {
          currentLocation: data.currentLocation,
        }),
        ...(data.requiresOperator !== undefined && {
          requiresOperator: data.requiresOperator,
        }),
        ...(data.requiresTracking !== undefined && {
          requiresTracking: data.requiresTracking,
        }),
        ...(data.requiresClinic !== undefined && {
          requiresClinic: data.requiresClinic,
        }),
        ...(data.customData !== undefined && { customData: data.customData }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
        ...(data.purchaseDate !== undefined && {
          purchaseDate: data.purchaseDate,
        }),
        ...(data.purchasePrice !== undefined && {
          purchasePrice: data.purchasePrice,
        }),
        // RENTAL: Pricing fields
        ...(data.trackingType !== undefined && {
          trackingType: data.trackingType,
        }),
        ...(data.pricePerHour !== undefined && {
          pricePerHour: data.pricePerHour,
        }),
        ...(data.minDailyHours !== undefined && {
          minDailyHours: data.minDailyHours,
        }),
        ...(data.pricePerKm !== undefined && { pricePerKm: data.pricePerKm }),
        ...(data.pricePerDay !== undefined && {
          pricePerDay: data.pricePerDay,
        }),
        ...(data.pricePerWeek !== undefined && {
          pricePerWeek: data.pricePerWeek,
        }),
        ...(data.pricePerMonth !== undefined && {
          pricePerMonth: data.pricePerMonth,
        }),
        ...(data.operatorCostType !== undefined && {
          operatorCostType: data.operatorCostType,
        }),
        ...(data.operatorCostRate !== undefined && {
          operatorCostRate: data.operatorCostRate,
        }),
        ...(data.maintenanceCostDaily !== undefined && {
          maintenanceCostDaily: data.maintenanceCostDaily,
        }),
      },
      include: {
        state: true,
        rentalProfile: true,
      },
    });

    // Actualizar o crear AssetRentalProfile si hay datos rental
    const hasRentalData =
      data.trackingType !== undefined ||
      data.pricePerHour !== undefined ||
      data.pricePerDay !== undefined ||
      data.pricePerWeek !== undefined ||
      data.pricePerMonth !== undefined ||
      data.operatorCostType !== undefined ||
      data.operatorCostRate !== undefined;

    if (hasRentalData) {
      await this.prisma.assetRentalProfile.upsert({
        where: { assetId: asset.id },
        create: {
          assetId: asset.id,
          tenantId,
          businessUnitId,
          trackingType: data.trackingType,
          pricePerHour: data.pricePerHour,
          minDailyHours: data.minDailyHours,
          pricePerKm: data.pricePerKm,
          pricePerDay: data.pricePerDay,
          pricePerWeek: data.pricePerWeek,
          pricePerMonth: data.pricePerMonth,
          operatorCostType: data.operatorCostType,
          operatorCostRate: data.operatorCostRate,
          maintenanceCostDaily: data.maintenanceCostDaily,
        },
        update: {
          ...(data.trackingType !== undefined && {
            trackingType: data.trackingType,
          }),
          ...(data.pricePerHour !== undefined && {
            pricePerHour: data.pricePerHour,
          }),
          ...(data.minDailyHours !== undefined && {
            minDailyHours: data.minDailyHours,
          }),
          ...(data.pricePerKm !== undefined && { pricePerKm: data.pricePerKm }),
          ...(data.pricePerDay !== undefined && {
            pricePerDay: data.pricePerDay,
          }),
          ...(data.pricePerWeek !== undefined && {
            pricePerWeek: data.pricePerWeek,
          }),
          ...(data.pricePerMonth !== undefined && {
            pricePerMonth: data.pricePerMonth,
          }),
          ...(data.operatorCostType !== undefined && {
            operatorCostType: data.operatorCostType,
          }),
          ...(data.operatorCostRate !== undefined && {
            operatorCostRate: data.operatorCostRate,
          }),
          ...(data.maintenanceCostDaily !== undefined && {
            maintenanceCostDaily: data.maintenanceCostDaily,
          }),
        },
      });
    }

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

    // Retornar asset con rentalProfile actualizado
    return this.prisma.asset.findFirst({
      where: { id: asset.id },
      include: {
        state: true,
        rentalProfile: true,
      },
    }) as Promise<Asset>;
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

  /**
   * Get asset availability for quotation/rental
   * Checks if asset is currently in use
   */
  async getAssetAvailability(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ): Promise<{
    available: boolean;
    status: "available" | "in_use" | "maintenance";
    currentRental?: {
      contractId: string;
      estimatedReturnDate: Date | null;
      clientName: string;
    };
  }> {
    // Verificar si el asset existe y pertenece al tenant/BU
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

    // Verificar si está en mantenimiento activo
    const activeMaintenanceCount = await this.prisma.maintenanceRecord.count({
      where: {
        assetId,
        endedAt: null, // Mantenimiento sin cerrar
      },
    });

    if (activeMaintenanceCount > 0) {
      return {
        available: false,
        status: "maintenance",
      };
    }

    // Verificar si está en rental activo (AssetRental sin fecha de retorno)
    const activeRental = await this.prisma.assetRental.findFirst({
      where: {
        assetId,
        actualReturnDate: null, // No ha sido devuelto
      },
      include: {
        contract: {
          include: {
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (activeRental) {
      return {
        available: false,
        status: "in_use",
        currentRental: {
          contractId: activeRental.contractId,
          estimatedReturnDate: activeRental.contract.estimatedEndDate || null,
          clientName: activeRental.contract.client.name,
        },
      };
    }

    // Disponible
    return {
      available: true,
      status: "available",
    };
  }

  /**
   * Search assets for quotation with pricing and availability
   * Incluye información de precios y disponibilidad
   */
  async searchAssetsForQuotation(
    tenantId: string,
    businessUnitId: string,
    filters: {
      search?: string;
      trackingType?: "MACHINERY" | "TOOL";
      includeUnavailable?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: Array<{
      id: string;
      code: string;
      name: string;
      trackingType: string | null;
      imageUrl: string | null;
      // Pricing MACHINERY
      pricePerHour: number | null;
      minDailyHours: number | null;
      pricePerKm: number | null;
      // Pricing TOOL
      pricePerDay: number | null;
      pricePerWeek: number | null;
      pricePerMonth: number | null;
      // Operator
      operatorCostType: string | null;
      operatorCostRate: number | null;
      requiresOperator: boolean;
      // Availability
      availability: {
        available: boolean;
        status: "available" | "in_use" | "maintenance";
        estimatedReturnDate?: Date | null;
      };
    }>;
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      trackingType,
      includeUnavailable = false,
    } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId,
      businessUnitId,
      ...(trackingType && { trackingType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // Get assets
    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          trackingType: true,
          imageUrl: true,
          pricePerHour: true,
          minDailyHours: true,
          pricePerKm: true,
          pricePerDay: true,
          pricePerWeek: true,
          pricePerMonth: true,
          operatorCostType: true,
          operatorCostRate: true,
          requiresOperator: true,
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    // Enrich with availability
    const enrichedAssets = await Promise.all(
      assets.map(async (asset) => {
        const availability = await this.getAssetAvailability(
          tenantId,
          businessUnitId,
          asset.id,
        );

        return {
          ...asset,
          pricePerHour: asset.pricePerHour ? Number(asset.pricePerHour) : null,
          minDailyHours: asset.minDailyHours
            ? Number(asset.minDailyHours)
            : null,
          pricePerKm: asset.pricePerKm ? Number(asset.pricePerKm) : null,
          pricePerDay: asset.pricePerDay ? Number(asset.pricePerDay) : null,
          pricePerWeek: asset.pricePerWeek ? Number(asset.pricePerWeek) : null,
          pricePerMonth: asset.pricePerMonth
            ? Number(asset.pricePerMonth)
            : null,
          operatorCostRate: asset.operatorCostRate
            ? Number(asset.operatorCostRate)
            : null,
          availability,
        };
      }),
    );

    // Filter by availability if needed
    let filteredAssets = enrichedAssets;
    if (!includeUnavailable) {
      filteredAssets = enrichedAssets.filter((a) => a.availability.available);
    }

    return {
      data: filteredAssets,
      meta: {
        total: includeUnavailable ? total : filteredAssets.length,
        page,
        limit,
        totalPages: Math.ceil(
          (includeUnavailable ? total : filteredAssets.length) / limit,
        ),
      },
    };
  }
}

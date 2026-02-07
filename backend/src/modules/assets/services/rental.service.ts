/**
 * Rental Service
 *
 * Maneja workflows de contratos de alquiler y asignación de activos
 * Implementa workflows 2, 6, 9 del documento de workflows
 */

import { PrismaClient, RentalContract, ContractAsset } from "@prisma/client";
import { AssetService } from "./asset.service";
import {
  CreateRentalContractDTO,
  UpdateRentalContractDTO,
  RentalContractFilters,
  AssignAssetToContractDTO,
  UpdateContractAssetDTO,
  CreateUsageReportDTO,
  UsageReportFilters,
  AvailabilityProjection,
  PaginationParams,
  PaginatedResponse,
} from "../types/rental.types";

export class RentalService {
  private assetService: AssetService;

  constructor(private readonly prisma: PrismaClient) {
    this.assetService = new AssetService(prisma);
  }

  // ============================================
  // RENTAL CONTRACTS
  // ============================================

  /**
   * Create rental contract
   */
  async createContract(
    tenantId: string,
    businessUnitId: string,
    data: CreateRentalContractDTO,
  ): Promise<RentalContract> {
    const contract = await this.prisma.rentalContract.create({
      data: {
        tenantId,
        businessUnitId,
        clientId: data.clientId,
        status: data.status || "DRAFT",
      },
    });

    // Emit event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: "", // No asset yet
        eventType: "rental_contract.created",
        source: "system",
        payload: {
          contractId: contract.id,
          clientId: contract.clientId,
        },
      },
    });

    return contract;
  }

  /**
   * Get contract by ID
   */
  async getContractById(
    tenantId: string,
    businessUnitId: string,
    contractId: string,
  ) {
    return this.prisma.rentalContract.findFirst({
      where: {
        id: contractId,
        tenantId,
        businessUnitId,
      },
      include: {
        contractAssets: {
          include: {
            asset: {
              include: {
                state: true,
              },
            },
          },
        },
        usageReports: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        incidents: {
          where: { resolved: false },
        },
      },
    });
  }

  /**
   * List contracts with filters
   */
  async listContracts(
    tenantId: string,
    businessUnitId: string,
    filters: RentalContractFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResponse<RentalContract>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      businessUnitId,
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.status && { status: filters.status }),
    };

    const [contracts, total] = await Promise.all([
      this.prisma.rentalContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          contractAssets: {
            include: {
              asset: true,
            },
          },
        },
      }),
      this.prisma.rentalContract.count({ where }),
    ]);

    return {
      data: contracts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update contract
   */
  async updateContract(
    tenantId: string,
    businessUnitId: string,
    contractId: string,
    data: UpdateRentalContractDTO,
  ): Promise<RentalContract> {
    // Verify contract exists
    const existing = await this.prisma.rentalContract.findFirst({
      where: { id: contractId, tenantId, businessUnitId },
    });

    if (!existing) {
      throw new Error("Contract not found");
    }

    const contract = await this.prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.status && { status: data.status }),
      },
    });

    // Emit event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: "",
        eventType: "rental_contract.updated",
        source: "system",
        payload: {
          contractId: contract.id,
          changes: data as any,
        },
      },
    });

    return contract;
  }

  // ============================================
  // ASSET ASSIGNMENT (Workflow 2)
  // ============================================

  /**
   * Assign asset to contract
   * Workflow 2: Asignación de Activo a Contrato y Obra
   */
  async assignAssetToContract(
    tenantId: string,
    businessUnitId: string,
    data: AssignAssetToContractDTO,
  ): Promise<ContractAsset> {
    // 1. Verificar disponibilidad
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

    if (!asset.state || asset.state.currentState !== "AVAILABLE") {
      throw new Error(
        `Asset is not available. Current state: ${asset.state?.currentState || "unknown"}`,
      );
    }

    // Verificar que no hay contratos activos
    const activeContract = await this.prisma.contractAsset.findFirst({
      where: {
        assetId: data.assetId,
        contract: {
          status: { in: ["ACTIVE", "DRAFT"] },
        },
      },
    });

    if (activeContract) {
      throw new Error("Asset is already assigned to an active contract");
    }

    // 2. Reservar temporalmente
    await this.prisma.assetState.update({
      where: { assetId: data.assetId },
      data: {
        currentState: "RESERVED",
      },
    });

    // 3. Crear asignación con estimaciones
    const contractAsset = await this.prisma.contractAsset.create({
      data: {
        contractId: data.contractId,
        assetId: data.assetId,
        obra: data.obra,
        estimatedStart: data.estimatedStart,
        estimatedEnd: data.estimatedEnd,
        estimatedHours: data.estimatedHours,
        estimatedDays: data.estimatedDays,
      },
    });

    // 4. Activar asignación
    await this.prisma.assetState.update({
      where: { assetId: data.assetId },
      data: {
        currentState: "IN_USE",
      },
    });

    // 5. Actualizar ubicación del activo a la obra
    await this.assetService.updateAssetLocation(
      tenantId,
      businessUnitId,
      data.assetId,
      data.obra,
    );

    // 6. Emit evento
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "asset.assigned_to_contract",
        source: "system",
        payload: {
          contractId: data.contractId,
          obra: data.obra,
          estimatedStart: data.estimatedStart,
          estimatedEnd: data.estimatedEnd,
        },
      },
    });

    return contractAsset;
  }

  // ============================================
  // USAGE REPORTS (Workflow 3)
  // ============================================

  /**
   * Record daily usage
   * Workflow 3: Uso Diario en Obra
   */
  async recordUsageReport(
    tenantId: string,
    businessUnitId: string,
    data: CreateUsageReportDTO,
  ) {
    // 1. Validar contexto
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

    if (asset.state?.currentState !== "IN_USE") {
      throw new Error("Asset is not in use");
    }

    const contract = await this.prisma.rentalContract.findFirst({
      where: {
        id: data.contractId,
        tenantId,
        businessUnitId,
        status: "ACTIVE",
      },
    });

    if (!contract) {
      throw new Error("Contract not found or not active");
    }

    // 2. Registrar uso real
    const usageReport = await this.prisma.usageReport.create({
      data: {
        assetId: data.assetId,
        contractId: data.contractId,
        metric: data.metric,
        value: data.value,
        reportedBy: data.reportedBy,
        notes: data.notes,
        evidenceUrls: data.evidenceUrls || [],
      },
    });

    // 3. Emit evento
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "asset.usage_reported",
        source: "system",
        payload: {
          reportId: usageReport.id,
          metric: data.metric,
          value: data.value,
          reportedBy: data.reportedBy,
        },
      },
    });

    return usageReport;
  }

  /**
   * List usage reports
   */
  async listUsageReports(
    tenantId: string,
    businessUnitId: string,
    filters: UsageReportFilters = {},
    pagination: PaginationParams = {},
  ) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      asset: {
        tenantId,
        businessUnitId,
      },
      ...(filters.assetId && { assetId: filters.assetId }),
      ...(filters.contractId && { contractId: filters.contractId }),
      ...(filters.dateFrom &&
        filters.dateTo && {
          createdAt: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
          },
        }),
    };

    const [reports, total] = await Promise.all([
      this.prisma.usageReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetType: true,
            },
          },
          contract: {
            select: {
              id: true,
              clientId: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.usageReport.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // CONTRACT FINALIZATION (Workflow 6)
  // ============================================

  /**
   * Finalize contract
   * Workflow 6: Finalización de Contrato
   */
  async finalizeContract(
    tenantId: string,
    businessUnitId: string,
    contractId: string,
  ) {
    // 1. Validar estado del contrato
    const contract = await this.prisma.rentalContract.findFirst({
      where: {
        id: contractId,
        tenantId,
        businessUnitId,
        status: "ACTIVE",
      },
      include: {
        contractAssets: {
          include: {
            asset: {
              include: { state: true },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found or not active");
    }

    const results = [];

    // 2. Por cada activo asignado
    for (const contractAsset of contract.contractAssets) {
      const asset = contractAsset.asset;

      // a. Registrar retiro y cambiar estado
      await this.prisma.assetState.update({
        where: { assetId: asset.id },
        data: {
          currentState: "RETURNED",
        },
      });

      // b. Devolver ubicación a TALLER
      await this.assetService.updateAssetLocation(
        tenantId,
        businessUnitId,
        asset.id,
        "TALLER",
      );

      // c. Actualizar ContractAsset con fecha real
      await this.prisma.contractAsset.update({
        where: { id: contractAsset.id },
        data: {
          actualEnd: new Date(),
        },
      });

      // c. Emit evento de retiro
      await this.prisma.assetEvent.create({
        data: {
          tenantId,
          businessUnitId,
          assetId: asset.id,
          eventType: "asset.returned",
          source: "system",
          payload: {
            contractId,
            actualEnd: new Date(),
          },
        },
      });

      results.push({
        assetId: asset.id,
        status: "RETURNED",
      });
    }

    // 3. Cerrar contrato
    await this.prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "FINISHED",
      },
    });

    // Emit evento de finalización
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: "",
        eventType: "contract.finished",
        source: "system",
        payload: {
          contractId,
          assetsReturned: results.length,
        },
      },
    });

    return {
      contractId,
      status: "FINISHED",
      assetsReturned: results,
    };
  }

  /**
   * Evaluation post-obra for specific asset
   */
  async evaluateAssetPostObra(
    tenantId: string,
    businessUnitId: string,
    contractAssetId: string,
    needsMaintenance: boolean,
  ) {
    const contractAsset = await this.prisma.contractAsset.findFirst({
      where: { id: contractAssetId },
      include: {
        asset: {
          include: { state: true },
        },
      },
    });

    if (!contractAsset) {
      throw new Error("Contract asset not found");
    }

    // Verify tenant ownership
    if (
      contractAsset.asset.tenantId !== tenantId ||
      contractAsset.asset.businessUnitId !== businessUnitId
    ) {
      throw new Error("Contract asset not found");
    }

    // Update evaluation
    await this.prisma.contractAsset.update({
      where: { id: contractAssetId },
      data: {
        needsPostObraMaintenance: needsMaintenance,
      },
    });

    // Update asset state based on evaluation
    if (needsMaintenance) {
      await this.prisma.assetState.update({
        where: { assetId: contractAsset.assetId },
        data: {
          currentState: "MAINTENANCE",
        },
      });
    } else {
      await this.prisma.assetState.update({
        where: { assetId: contractAsset.assetId },
        data: {
          currentState: "AVAILABLE",
        },
      });
    }

    // Emit evento
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: contractAsset.assetId,
        eventType: "asset.post_obra_evaluated",
        source: "system",
        payload: {
          contractAssetId,
          needsMaintenance,
          newState: needsMaintenance ? "MAINTENANCE" : "AVAILABLE",
        },
      },
    });

    return contractAsset;
  }

  // ============================================
  // AVAILABILITY PROJECTION (Workflow 9)
  // ============================================

  /**
   * Project availability for an asset
   * Workflow 9: Proyección de Disponibilidad
   */
  async projectAssetAvailability(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
  ): Promise<AvailabilityProjection> {
    // 1. Consultar estado actual
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        tenantId,
        businessUnitId,
      },
      include: {
        state: true,
        contractAssets: {
          where: {
            contract: {
              status: "ACTIVE",
            },
          },
          include: {
            contract: true,
          },
          orderBy: {
            estimatedEnd: "desc",
          },
          take: 1,
        },
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    const currentState = asset.state?.currentState || "UNKNOWN";

    // 2. Determinar proyección según estado
    switch (currentState) {
      case "AVAILABLE":
        return {
          assetId,
          currentState,
          status: "AVAILABLE_NOW",
          details: "Asset is available immediately",
        };

      case "IN_USE": {
        const contractAsset = asset.contractAssets[0];
        if (contractAsset) {
          // Agregar margen configurable (ej: 2 días)
          const marginDays = 2;
          const estimatedDate = new Date(contractAsset.estimatedEnd);
          estimatedDate.setDate(estimatedDate.getDate() + marginDays);

          return {
            assetId,
            currentState,
            estimatedAvailableDate: estimatedDate,
            status: "IN_USE",
            details: `Estimated available from ${estimatedDate.toISOString().split("T")[0]} (includes ${marginDays} days margin)`,
          };
        }
        return {
          assetId,
          currentState,
          status: "IN_USE",
          details: "In use but no contract found",
        };
      }

      case "MAINTENANCE":
        return {
          assetId,
          currentState,
          status: "MAINTENANCE",
          details: "Availability depends on technical evaluation",
        };

      case "INCIDENT":
        return {
          assetId,
          currentState,
          status: "INDETERMINATE",
          details: "Requires human resolution",
        };

      default:
        return {
          assetId,
          currentState,
          status: "INDETERMINATE",
          details: `Unknown state: ${currentState}`,
        };
    }
  }

  /**
   * Project availability for all assets of a type
   */
  async projectAvailabilityByType(
    tenantId: string,
    businessUnitId: string,
    assetType: string,
  ): Promise<AvailabilityProjection[]> {
    const assets = await this.prisma.asset.findMany({
      where: {
        tenantId,
        businessUnitId,
        assetType,
      },
      include: {
        state: true,
      },
    });

    const projections = await Promise.all(
      assets.map((asset) =>
        this.projectAssetAvailability(tenantId, businessUnitId, asset.id),
      ),
    );

    // Sort by availability (available first, then by estimated date)
    return projections.sort((a, b) => {
      if (a.status === "AVAILABLE_NOW") return -1;
      if (b.status === "AVAILABLE_NOW") return 1;
      if (a.estimatedAvailableDate && b.estimatedAvailableDate) {
        return (
          a.estimatedAvailableDate.getTime() -
          b.estimatedAvailableDate.getTime()
        );
      }
      return 0;
    });
  }

  // ============================================
  // USAGE VARIANCE ANALYSIS
  // ============================================

  /**
   * Get usage variance (real vs estimated)
   * Compares estimated hours/days against actual usage reports
   */
  async getUsageVariance(
    tenantId: string,
    businessUnitId: string,
    contractAssetId: string,
  ) {
    const contractAsset = await this.prisma.contractAsset.findFirst({
      where: { id: contractAssetId },
      include: {
        asset: {
          include: {
            usageReports: true,
          },
        },
        contract: true,
      },
    });

    if (!contractAsset) {
      throw new Error("Contract asset not found");
    }

    // Verify tenant ownership
    if (
      contractAsset.asset.tenantId !== tenantId ||
      contractAsset.asset.businessUnitId !== businessUnitId
    ) {
      throw new Error("Contract asset not found");
    }

    // Filter usage reports for this contract
    const relevantReports = contractAsset.asset.usageReports.filter(
      (report) => report.contractId === contractAsset.contractId,
    );

    // Calculate actual usage from reports
    const actualUsage = relevantReports.reduce((acc, report) => {
      return acc + Number(report.value);
    }, 0);

    // Get estimates
    const estimatedHours = contractAsset.estimatedHours
      ? Number(contractAsset.estimatedHours)
      : null;
    const estimatedDays = contractAsset.estimatedDays;
    const actualHours = contractAsset.actualHours
      ? Number(contractAsset.actualHours)
      : actualUsage;

    // Calculate variance
    const hoursVariance =
      estimatedHours !== null ? actualHours - estimatedHours : null;
    const hoursVariancePercentage =
      estimatedHours !== null && estimatedHours > 0
        ? ((hoursVariance! / estimatedHours) * 100).toFixed(2)
        : null;

    return {
      contractAssetId,
      assetId: contractAsset.assetId,
      assetName: contractAsset.asset.name,
      obra: contractAsset.obra,
      estimated: {
        hours: estimatedHours,
        days: estimatedDays,
        startDate: contractAsset.estimatedStart,
        endDate: contractAsset.estimatedEnd,
      },
      actual: {
        hours: actualHours,
        endDate: contractAsset.actualEnd,
        reportsCount: relevantReports.length,
      },
      variance: {
        hours: hoursVariance,
        percentage: hoursVariancePercentage
          ? parseFloat(hoursVariancePercentage)
          : null,
        status:
          hoursVariance === null
            ? "NO_ESTIMATE"
            : hoursVariance > 0
              ? "OVER_ESTIMATE"
              : hoursVariance < 0
                ? "UNDER_ESTIMATE"
                : "ON_TARGET",
      },
      needsPostObraMaintenance: contractAsset.needsPostObraMaintenance,
    };
  }
}

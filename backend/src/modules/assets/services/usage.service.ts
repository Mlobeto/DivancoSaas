/**
 * Usage Service
 *
 * Manages asset usage tracking (hours, standby, etc)
 */

import { PrismaClient, AssetUsage } from "@prisma/client";
import {
  CreateUsageDTO,
  UsageFilters,
  PaginationParams,
  PaginatedResponse,
} from "../types/asset.types";

export class UsageService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Record asset usage
   */
  async recordUsage(
    tenantId: string,
    businessUnitId: string,
    data: CreateUsageDTO,
  ): Promise<AssetUsage> {
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

    const usage = await this.prisma.assetUsage.create({
      data: {
        assetId: data.assetId,
        date: data.date,
        hoursUsed: data.hoursUsed,
        standbyHours: data.standbyHours,
        reportedByUserId: data.reportedByUserId,
        source: data.source,
        notes: data.notes,
      },
    });

    // Emit usage event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "usage.recorded",
        source: data.source,
        payload: {
          usageId: usage.id,
          date: usage.date,
          hoursUsed: usage.hoursUsed,
          standbyHours: usage.standbyHours,
        },
      },
    });

    return usage;
  }

  /**
   * Get usage by ID
   */
  async getUsageById(
    tenantId: string,
    businessUnitId: string,
    usageId: string,
  ): Promise<AssetUsage | null> {
    const usage = await this.prisma.assetUsage.findUnique({
      where: { id: usageId },
      include: {
        asset: true,
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Verify tenant/BU access
    if (
      usage &&
      (usage.asset.tenantId !== tenantId ||
        usage.asset.businessUnitId !== businessUnitId)
    ) {
      return null;
    }

    return usage;
  }

  /**
   * List usage records with filters
   */
  async listUsage(
    tenantId: string,
    businessUnitId: string,
    filters: UsageFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResponse<AssetUsage>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      asset: {
        tenantId,
        businessUnitId,
      },
      ...(filters.assetId && { assetId: filters.assetId }),
      ...(filters.reportedByUserId && {
        reportedByUserId: filters.reportedByUserId,
      }),
      ...(filters.source && { source: filters.source }),
      ...(filters.dateFrom &&
        filters.dateTo && {
          date: {
            gte: filters.dateFrom,
            lte: filters.dateTo,
          },
        }),
    };

    const [usages, total] = await Promise.all([
      this.prisma.assetUsage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetType: true,
            },
          },
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.assetUsage.count({ where }),
    ]);

    return {
      data: usages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get usage summary for an asset
   */
  async getAssetUsageSummary(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ) {
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

    const where: any = {
      assetId,
      ...(dateFrom &&
        dateTo && {
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
    };

    const usages = await this.prisma.assetUsage.findMany({
      where,
      select: {
        hoursUsed: true,
        standbyHours: true,
      },
    });

    const totalHoursUsed = usages.reduce(
      (sum, u) => sum + Number(u.hoursUsed),
      0,
    );
    const totalStandbyHours = usages.reduce(
      (sum, u) => sum + Number(u.standbyHours || 0),
      0,
    );

    return {
      assetId,
      totalRecords: usages.length,
      totalHoursUsed,
      totalStandbyHours,
      period: {
        from: dateFrom,
        to: dateTo,
      },
    };
  }

  /**
   * Delete usage record
   */
  async deleteUsage(
    tenantId: string,
    businessUnitId: string,
    usageId: string,
  ): Promise<void> {
    const usage = await this.getUsageById(tenantId, businessUnitId, usageId);

    if (!usage) {
      throw new Error("Usage record not found");
    }

    await this.prisma.assetUsage.delete({
      where: { id: usageId },
    });

    // Emit deletion event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: usage.assetId,
        eventType: "usage.deleted",
        source: "system",
        payload: { usageId },
      },
    });
  }
}

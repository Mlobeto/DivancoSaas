/**
 * STOCK LEVEL SERVICE
 * Gestión de inventario BULK para AssetTemplates
 */

import { PrismaClient, StockMovementType } from "@prisma/client";
import { AppError } from "@core/middlewares/error.middleware";
import { AssetManagementType } from "./asset-template.service";

// ============================================
// TYPES
// ============================================

export interface AddStockInput {
  templateId: string;
  quantity: number;
  reason?: string;
  reference?: string; // PO number, etc.
  location?: string;
  createdBy?: string;
}

export interface ReserveStockInput {
  templateId: string;
  quantity: number;
  reference?: string; // Quotation ID
  location?: string;
  createdBy?: string;
}

export interface RentOutStockInput {
  templateId: string;
  quantity: number;
  fromReserved?: boolean;
  reference?: string; // Contract ID
  location?: string;
  createdBy?: string;
}

export interface ReturnStockInput {
  templateId: string;
  quantity: number;
  reference?: string; // Contract ID
  location?: string;
  createdBy?: string;
}

export interface AdjustStockInput {
  templateId: string;
  quantityDelta: number; // Can be positive or negative
  reason: string;
  notes?: string;
  location?: string;
  createdBy?: string;
}

export interface UpdateStockLevelInput {
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  minStock?: number;
  maxStock?: number;
  notes?: string;
}

// ============================================
// SERVICE
// ============================================

export class StockLevelService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Validate that template uses BULK management
   */
  private async validateBulkManagement(templateId: string): Promise<void> {
    const template = await this.prisma.assetTemplate.findUnique({
      where: { id: templateId },
      select: { managementType: true },
    });

    if (!template) {
      throw new AppError(404, "TEMPLATE_NOT_FOUND", "Asset template not found");
    }

    if (template.managementType !== AssetManagementType.BULK) {
      throw new AppError(
        400,
        "INVALID_MANAGEMENT_TYPE",
        "This operation is only allowed for BULK-type templates",
      );
    }
  }

  /**
   * Get stock level for a template
   */
  async getStockLevel(
    templateId: string,
    businessUnitId: string,
    location?: string,
  ) {
    await this.validateBulkManagement(templateId);

    const where: any = {
      templateId,
      businessUnitId,
    };

    if (location) {
      where.location = location;
    }

    const stockLevel = await this.prisma.stockLevel.findFirst({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            icon: true,
          },
        },
      },
    });

    if (!stockLevel) {
      throw new AppError(404, "STOCK_LEVEL_NOT_FOUND", "Stock level not found");
    }

    return stockLevel;
  }

  /**
   * List stock levels for all templates in a business unit
   */
  async listStockLevels(
    businessUnitId: string,
    options: { lowStockOnly?: boolean } = {},
  ) {
    const where: any = {
      businessUnitId,
    };

    // Filter for low stock alerts
    if (options.lowStockOnly) {
      where.AND = [
        { minStock: { not: null } },
        {
          quantityAvailable: {
            lte: this.prisma.stockLevel.fields.minStock,
          },
        },
      ];
    }

    const stockLevels = await this.prisma.stockLevel.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            icon: true,
            managementType: true,
          },
        },
      },
      orderBy: [{ template: { name: "asc" } }, { location: "asc" }],
    });

    return stockLevels;
  }

  /**
   * Add stock (from purchase, transfer, etc.)
   */
  async addStock(data: AddStockInput, businessUnitId: string) {
    await this.validateBulkManagement(data.templateId);

    if (data.quantity <= 0) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "Quantity must be greater than 0",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Find or create stock level
      let stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId: data.templateId,
          businessUnitId,
          location: data.location || null,
        },
      });

      if (!stockLevel) {
        // Create if doesn't exist - tenantId is automatically injected by Prisma middleware
        stockLevel = await tx.stockLevel.create({
          // @ts-ignore - tenantId injected by middleware
          data: {
            businessUnitId,
            templateId: data.templateId,
            location: data.location,
            quantityAvailable: 0,
            quantityReserved: 0,
            quantityRented: 0,
          } as any,
        });
      }

      // Update stock
      const updated = await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityAvailable: {
            increment: data.quantity,
          },
        },
      });

      // Create movement record - tenantId is automatically injected by Prisma middleware
      const totalBefore =
        stockLevel.quantityAvailable +
        stockLevel.quantityReserved +
        stockLevel.quantityRented;
      const totalAfter =
        updated.quantityAvailable +
        updated.quantityReserved +
        updated.quantityRented;

      await tx.stockMovement.create({
        // @ts-ignore - tenantId injected by middleware
        data: {
          stockLevelId: stockLevel.id,
          type: StockMovementType.ADD,
          quantity: data.quantity,
          reason: data.reason,
          referenceId: data.reference,
          quantityBefore: totalBefore,
          quantityAfter: totalAfter,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: updated.quantityAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: updated.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: updated.quantityRented,
          createdBy: data.createdBy,
        },
      });

      return updated;
    });
  }

  /**
   * Reserve stock (for quotations)
   */
  async reserveStock(data: ReserveStockInput, businessUnitId: string) {
    await this.validateBulkManagement(data.templateId);

    if (data.quantity <= 0) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "Quantity must be greater than 0",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId: data.templateId,
          businessUnitId,
          location: data.location || null,
        },
      });

      if (!stockLevel) {
        throw new AppError(
          404,
          "STOCK_LEVEL_NOT_FOUND",
          "Stock level not found",
        );
      }

      if (stockLevel.quantityAvailable < data.quantity) {
        throw new AppError(
          400,
          "INSUFFICIENT_STOCK",
          `Insufficient stock available. Available: ${stockLevel.quantityAvailable}, Requested: ${data.quantity}`,
        );
      }

      const updated = await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityAvailable: { decrement: data.quantity },
          quantityReserved: { increment: data.quantity },
        },
      });

      const totalBeforeReserve =
        stockLevel.quantityAvailable +
        stockLevel.quantityReserved +
        stockLevel.quantityRented;
      const totalAfterReserve =
        updated.quantityAvailable +
        updated.quantityReserved +
        updated.quantityRented;

      await tx.stockMovement.create({
        // @ts-ignore - tenantId injected by middleware
        data: {
          stockLevelId: stockLevel.id,
          type: StockMovementType.RESERVE,
          quantity: data.quantity,
          referenceId: data.reference,
          quantityBefore: totalBeforeReserve,
          quantityAfter: totalAfterReserve,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: updated.quantityAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: updated.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: updated.quantityRented,
          createdBy: data.createdBy,
        } as any,
      });

      return updated;
    });
  }

  /**
   * Unreserve stock (cancel quotation)
   */
  async unreserveStock(
    templateId: string,
    quantity: number,
    businessUnitId: string,
    reference?: string,
    location?: string,
    createdBy?: string,
  ) {
    await this.validateBulkManagement(templateId);

    if (quantity <= 0) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "Quantity must be greater than 0",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId,
          businessUnitId,
          location: location || null,
        },
      });

      if (!stockLevel) {
        throw new AppError(
          404,
          "STOCK_LEVEL_NOT_FOUND",
          "Stock level not found",
        );
      }

      if (stockLevel.quantityReserved < quantity) {
        throw new AppError(
          400,
          "INSUFFICIENT_RESERVED_STOCK",
          `Insufficient reserved stock. Reserved: ${stockLevel.quantityReserved}, Requested: ${quantity}`,
        );
      }

      const updated = await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityReserved: { decrement: quantity },
          quantityAvailable: { increment: quantity },
        },
      });

      const totalBeforeUnreserve =
        stockLevel.quantityAvailable +
        stockLevel.quantityReserved +
        stockLevel.quantityRented;
      const totalAfterUnreserve =
        updated.quantityAvailable +
        updated.quantityReserved +
        updated.quantityRented;

      await tx.stockMovement.create({
        // @ts-ignore - tenantId injected by middleware
        data: {
          stockLevelId: stockLevel.id,
          type: StockMovementType.UNRESERVE,
          quantity,
          referenceId: reference,
          quantityBefore: totalBeforeUnreserve,
          quantityAfter: totalAfterUnreserve,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: updated.quantityAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: updated.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: updated.quantityRented,
          createdBy,
        } as any,
      });

      return updated;
    });
  }

  /**
   * Rent out stock (from reserved or available)
   */
  async rentOutStock(data: RentOutStockInput, businessUnitId: string) {
    await this.validateBulkManagement(data.templateId);

    if (data.quantity <= 0) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "Quantity must be greater than 0",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId: data.templateId,
          businessUnitId,
          location: data.location || null,
        },
      });

      if (!stockLevel) {
        throw new AppError(
          404,
          "STOCK_LEVEL_NOT_FOUND",
          "Stock level not found",
        );
      }

      let updated;

      if (data.fromReserved) {
        // Rent from reserved stock
        if (stockLevel.quantityReserved < data.quantity) {
          throw new AppError(
            400,
            "INSUFFICIENT_RESERVED_STOCK",
            `Insufficient reserved stock. Reserved: ${stockLevel.quantityReserved}, Requested: ${data.quantity}`,
          );
        }

        updated = await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            quantityReserved: { decrement: data.quantity },
            quantityRented: { increment: data.quantity },
          },
        });
      } else {
        // Rent from available stock
        if (stockLevel.quantityAvailable < data.quantity) {
          throw new AppError(
            400,
            "INSUFFICIENT_STOCK",
            `Insufficient available stock. Available: ${stockLevel.quantityAvailable}, Requested: ${data.quantity}`,
          );
        }

        updated = await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            quantityAvailable: { decrement: data.quantity },
            quantityRented: { increment: data.quantity },
          },
        });
      }

      const totalBeforeRent =
        stockLevel.quantityAvailable +
        stockLevel.quantityReserved +
        stockLevel.quantityRented;
      const totalAfterRent =
        updated.quantityAvailable +
        updated.quantityReserved +
        updated.quantityRented;

      await tx.stockMovement.create({
        // @ts-ignore - tenantId injected by middleware
        data: {
          stockLevelId: stockLevel.id,
          type: StockMovementType.RENT_OUT,
          quantity: data.quantity,
          referenceId: data.reference,
          quantityBefore: totalBeforeRent,
          quantityAfter: totalAfterRent,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: updated.quantityAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: updated.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: updated.quantityRented,
          createdBy: data.createdBy,
        } as any,
      });

      return updated;
    });
  }

  /**
   * Return rented stock
   */
  async returnStock(data: ReturnStockInput, businessUnitId: string) {
    await this.validateBulkManagement(data.templateId);

    if (data.quantity <= 0) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "Quantity must be greater than 0",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId: data.templateId,
          businessUnitId,
          location: data.location || null,
        },
      });

      if (!stockLevel) {
        throw new AppError(
          404,
          "STOCK_LEVEL_NOT_FOUND",
          "Stock level not found",
        );
      }

      if (stockLevel.quantityRented < data.quantity) {
        throw new AppError(
          400,
          "INSUFFICIENT_RENTED_STOCK",
          `Insufficient rented stock to return. Rented: ${stockLevel.quantityRented}, Requested: ${data.quantity}`,
        );
      }

      const updated = await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityRented: { decrement: data.quantity },
          quantityAvailable: { increment: data.quantity },
        },
      });

      const totalBeforeReturn =
        stockLevel.quantityAvailable +
        stockLevel.quantityReserved +
        stockLevel.quantityRented;
      const totalAfterReturn =
        updated.quantityAvailable +
        updated.quantityReserved +
        updated.quantityRented;

      await tx.stockMovement.create({
        // @ts-ignore - tenantId injected by middleware
        data: {
          stockLevelId: stockLevel.id,
          type: StockMovementType.RETURN,
          quantity: data.quantity,
          referenceId: data.reference,
          quantityBefore: totalBeforeReturn,
          quantityAfter: totalAfterReturn,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: updated.quantityAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: updated.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: updated.quantityRented,
          createdBy: data.createdBy,
        } as any,
      });

      return updated;
    });
  }

  /**
   * Adjust stock (manual correction, loss, etc.)
   */
  async adjustStock(data: AdjustStockInput, businessUnitId: string) {
    await this.validateBulkManagement(data.templateId);

    if (data.quantityDelta === 0) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "Quantity delta cannot be zero",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId: data.templateId,
          businessUnitId,
          location: data.location || null,
        },
      });

      if (!stockLevel) {
        throw new AppError(
          404,
          "STOCK_LEVEL_NOT_FOUND",
          "Stock level not found",
        );
      }

      // Check if adjustment would result in negative stock
      const newAvailable = stockLevel.quantityAvailable + data.quantityDelta;
      if (newAvailable < 0) {
        throw new AppError(
          400,
          "NEGATIVE_STOCK",
          `Adjustment would result in negative stock. Current: ${stockLevel.quantityAvailable}, Delta: ${data.quantityDelta}`,
        );
      }

      const updated = await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityAvailable: {
            increment: data.quantityDelta,
          },
        },
      });

      const totalBeforeAdjust =
        stockLevel.quantityAvailable +
        stockLevel.quantityReserved +
        stockLevel.quantityRented;
      const totalAfterAdjust =
        updated.quantityAvailable +
        updated.quantityReserved +
        updated.quantityRented;

      await tx.stockMovement.create({
        // @ts-ignore - tenantId injected by middleware
        data: {
          stockLevelId: stockLevel.id,
          type: StockMovementType.ADJUST,
          quantity: Math.abs(data.quantityDelta),
          reason: data.reason,
          notes: data.notes,
          quantityBefore: totalBeforeAdjust,
          quantityAfter: totalAfterAdjust,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: updated.quantityAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: updated.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: updated.quantityRented,
          createdBy: data.createdBy,
        } as any,
      });

      return updated;
    });
  }

  /**
   * Update stock level settings (prices, alerts, etc.)
   */
  async updateStockLevel(
    templateId: string,
    businessUnitId: string,
    data: UpdateStockLevelInput,
    location?: string,
  ) {
    await this.validateBulkManagement(templateId);

    const stockLevel = await this.prisma.stockLevel.findFirst({
      where: {
        templateId,
        businessUnitId,
        location: location || null,
      },
    });

    if (!stockLevel) {
      throw new AppError(404, "STOCK_LEVEL_NOT_FOUND", "Stock level not found");
    }

    const updated = await this.prisma.stockLevel.update({
      where: { id: stockLevel.id },
      data: {
        ...(data.pricePerDay !== undefined && {
          pricePerDay: data.pricePerDay,
        }),
        ...(data.pricePerWeek !== undefined && {
          pricePerWeek: data.pricePerWeek,
        }),
        ...(data.pricePerMonth !== undefined && {
          pricePerMonth: data.pricePerMonth,
        }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.maxStock !== undefined && { maxStock: data.maxStock }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return updated;
  }

  /**
   * Get stock movements history
   */
  async getStockMovements(
    templateId: string,
    businessUnitId: string,
    options: {
      location?: string;
      type?: StockMovementType;
      limit?: number;
    } = {},
  ) {
    await this.validateBulkManagement(templateId);

    const stockLevel = await this.prisma.stockLevel.findFirst({
      where: {
        templateId,
        businessUnitId,
        location: options.location || null,
      },
    });

    if (!stockLevel) {
      throw new AppError(404, "STOCK_LEVEL_NOT_FOUND", "Stock level not found");
    }

    const where: any = {
      stockLevelId: stockLevel.id,
    };

    if (options.type) {
      where.type = options.type;
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit || 100,
    });

    return movements;
  }

  /**
   * Get stock level statistics
   */
  async getStockStats(businessUnitId: string) {
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { businessUnitId },
      include: {
        template: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    const totalAvailable = stockLevels.reduce(
      (sum, s) => sum + s.quantityAvailable,
      0,
    );
    const totalReserved = stockLevels.reduce(
      (sum, s) => sum + s.quantityReserved,
      0,
    );
    const totalRented = stockLevels.reduce(
      (sum, s) => sum + s.quantityRented,
      0,
    );

    const lowStockItems = stockLevels.filter(
      (s) => s.minStock && s.quantityAvailable <= s.minStock,
    );

    return {
      totalTemplates: stockLevels.length,
      totalAvailable,
      totalReserved,
      totalRented,
      totalUnits: totalAvailable + totalReserved + totalRented,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map((s) => ({
        templateId: s.templateId,
        templateName: s.template.name,
        available: s.quantityAvailable,
        minStock: s.minStock,
      })),
    };
  }
}

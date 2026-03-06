/**
 * WAREHOUSE SERVICE
 * Gestión de bodegas y talleres
 */

import { prisma } from "@config/database";
import { AppError } from "@core/middlewares/error.middleware";

// ============================================
// TYPES
// ============================================

export enum WarehouseType {
  BODEGA = "BODEGA", // Almacenamiento general
  TALLER = "TALLER", // Taller de mantenimiento
  OBRA = "OBRA", // Ubicación en obra/proyecto
}

export interface CreateWarehouseInput {
  code: string;
  name: string;
  type: WarehouseType;
  address?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseInput {
  name?: string;
  type?: WarehouseType;
  address?: string;
  description?: string;
  isActive?: boolean;
}

// ============================================
// SERVICE
// ============================================

export class WarehouseService {
  /**
   * List all warehouses for a business unit
   */
  static async list(tenantId: string, businessUnitId: string) {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        tenantId,
        businessUnitId,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    return {
      data: warehouses,
      total: warehouses.length,
    };
  }

  /**
   * Get warehouse by ID
   */
  static async getById(id: string, tenantId: string, businessUnitId: string) {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id,
        tenantId,
        businessUnitId,
      },
      include: {
        assets: {
          select: {
            id: true,
            code: true,
            name: true,
            assetType: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new AppError(404, "WAREHOUSE_NOT_FOUND", "Bodega no encontrada");
    }

    return warehouse;
  }

  /**
   * Create new warehouse
   */
  static async create(
    tenantId: string,
    businessUnitId: string,
    data: CreateWarehouseInput,
  ) {
    // Check if code already exists
    const existing = await prisma.warehouse.findFirst({
      where: {
        businessUnitId,
        code: data.code,
      },
    });

    if (existing) {
      throw new AppError(
        400,
        "WAREHOUSE_CODE_EXISTS",
        `Ya existe una bodega con el código "${data.code}"`,
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        businessUnitId,
        code: data.code,
        name: data.name,
        type: data.type,
        address: data.address,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });

    return warehouse;
  }

  /**
   * Update warehouse
   */
  static async update(
    id: string,
    tenantId: string,
    businessUnitId: string,
    data: UpdateWarehouseInput,
  ) {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id,
        tenantId,
        businessUnitId,
      },
    });

    if (!warehouse) {
      throw new AppError(404, "WAREHOUSE_NOT_FOUND", "Bodega no encontrada");
    }

    const updated = await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        description: data.description,
        isActive: data.isActive,
      },
    });

    return updated;
  }

  /**
   * Delete warehouse (only if no assets assigned)
   */
  static async delete(id: string, tenantId: string, businessUnitId: string) {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id,
        tenantId,
        businessUnitId,
      },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new AppError(404, "WAREHOUSE_NOT_FOUND", "Bodega no encontrada");
    }

    if (warehouse._count.assets > 0) {
      throw new AppError(
        400,
        "WAREHOUSE_HAS_ASSETS",
        `No se puede eliminar la bodega porque tiene ${warehouse._count.assets} activo(s) asignado(s)`,
      );
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    return { message: "Bodega eliminada exitosamente" };
  }
}

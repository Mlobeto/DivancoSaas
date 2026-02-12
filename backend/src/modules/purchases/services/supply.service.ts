/**
 * SUPPLY SERVICE
 * Gestión de suministros (catálogo de productos comprables)
 */

import { PrismaClient } from "@prisma/client";
import {
  CreateSupplyDTO,
  UpdateSupplyDTO,
  SupplyFilters,
} from "../types/purchases.types";

export class SupplyService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Crear suministro
   */
  async createSupply(
    tenantId: string,
    businessUnitId: string,
    data: CreateSupplyDTO,
  ) {
    // Si se proporciona código, verificar que no exista
    if (data.code) {
      const existing = await this.prisma.supply.findUnique({
        where: {
          businessUnitId_code: {
            businessUnitId,
            code: data.code.toUpperCase(),
          },
        },
      });

      if (existing) {
        throw new Error(`Supply with code ${data.code} already exists`);
      }
    }

    // Si no se proporciona código, generar uno automático
    let code = data.code;
    if (!code) {
      const lastSupply = await this.prisma.supply.findFirst({
        where: { businessUnitId },
        orderBy: { createdAt: "desc" },
      });

      const lastNumber = lastSupply?.code
        ? parseInt(lastSupply.code.replace(/\D/g, "")) || 0
        : 0;

      code = `SUM-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    return await this.prisma.supply.create({
      data: {
        ...data,
        code: code.toUpperCase(),
        tenantId,
        businessUnitId,
        stock: 0, // Stock inicial en 0
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Listar suministros con filtros
   */
  async listSupplies(
    tenantId: string,
    businessUnitId: string,
    filters?: SupplyFilters,
  ) {
    const where: any = {
      tenantId,
      businessUnitId,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
        { barcode: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Filtro de stock bajo
    if (filters?.lowStock) {
      where.AND = [
        { minStock: { not: null } },
        {
          stock: {
            lt: this.prisma.supply.fields.minStock,
          },
        },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [supplies, total] = await Promise.all([
      this.prisma.supply.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.supply.count({ where }),
    ]);

    return {
      data: supplies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener suministro por ID
   */
  async getSupplyById(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
  ) {
    const supply = await this.prisma.supply.findFirst({
      where: {
        id: supplyId,
        tenantId,
        businessUnitId,
      },
      include: {
        category: true,
        quotes: {
          where: { isActive: true },
          include: { supplier: true },
        },
      },
    });

    if (!supply) {
      throw new Error("Supply not found");
    }

    return supply;
  }

  /**
   * Actualizar suministro
   */
  async updateSupply(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
    data: UpdateSupplyDTO,
  ) {
    // Verificar que existe
    const existing = await this.prisma.supply.findFirst({
      where: { id: supplyId, tenantId, businessUnitId },
    });

    if (!existing) {
      throw new Error("Supply not found");
    }

    // Si se actualiza el código, verificar que no exista
    if (data.code && data.code !== existing.code) {
      const codeExists = await this.prisma.supply.findUnique({
        where: {
          businessUnitId_code: {
            businessUnitId,
            code: data.code.toUpperCase(),
          },
        },
      });

      if (codeExists) {
        throw new Error(`Supply with code ${data.code} already exists`);
      }
    }

    return await this.prisma.supply.update({
      where: { id: supplyId },
      data: {
        ...data,
        code: data.code?.toUpperCase(),
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Eliminar suministro
   */
  async deleteSupply(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
  ) {
    // Verificar que existe
    const existing = await this.prisma.supply.findFirst({
      where: { id: supplyId, tenantId, businessUnitId },
      include: {
        purchaseOrderItems: true,
        quotes: true,
        usages: true,
        transactions: true,
      },
    });

    if (!existing) {
      throw new Error("Supply not found");
    }

    // No permitir eliminar si tiene transacciones
    if (
      existing.purchaseOrderItems.length > 0 ||
      existing.transactions.length > 0
    ) {
      throw new Error(
        "Cannot delete supply with associated purchase orders or transactions. Consider deactivating it instead.",
      );
    }

    // Eliminar cotizaciones y usos asociados
    await this.prisma.supplyQuote.deleteMany({
      where: { supplyId },
    });

    await this.prisma.supplyUsage.deleteMany({
      where: { supplyId },
    });

    // Eliminar el suministro
    await this.prisma.supply.delete({
      where: { id: supplyId },
    });

    return { message: "Supply deleted successfully" };
  }

  /**
   * Toggle activo/inactivo
   */
  async toggleActive(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
  ) {
    const supply = await this.prisma.supply.findFirst({
      where: { id: supplyId, tenantId, businessUnitId },
    });

    if (!supply) {
      throw new Error("Supply not found");
    }

    return await this.prisma.supply.update({
      where: { id: supplyId },
      data: { isActive: !supply.isActive },
      include: {
        category: true,
      },
    });
  }

  /**
   * Ajustar stock manualmente
   */
  async adjustStock(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
    adjustment: number,
    reason: string,
  ) {
    const supply = await this.prisma.supply.findFirst({
      where: { id: supplyId, tenantId, businessUnitId },
    });

    if (!supply) {
      throw new Error("Supply not found");
    }

    // Actualizar stock
    const updated = await this.prisma.supply.update({
      where: { id: supplyId },
      data: {
        stock: {
          increment: adjustment,
        },
      },
      include: {
        category: true,
      },
    });

    // Crear transacción de stock
    await this.prisma.stockTransaction.create({
      data: {
        tenantId,
        businessUnitId,
        supplyId,
        type: "ADJUSTMENT",
        quantity: adjustment,
        unitCost: supply.costPerUnit || 0,
        totalCost: Math.abs(adjustment) * (supply.costPerUnit?.toNumber() || 0),
        notes: reason,
      },
    });

    return updated;
  }
}

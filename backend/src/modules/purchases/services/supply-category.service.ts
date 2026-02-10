/**
 * SUPPLY CATEGORY SERVICE
 * Gestión de categorías de insumos configurables
 */

import { PrismaClient, SupplyCategoryType } from "@prisma/client";
import {
  CreateSupplyCategoryDTO,
  UpdateSupplyCategoryDTO,
  SupplyCategoryFilters,
} from "../types/purchases.types";

export class SupplyCategoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Crear categoría de insumo
   */
  async createCategory(
    tenantId: string,
    businessUnitId: string,
    data: CreateSupplyCategoryDTO,
  ) {
    // Verificar que el código no exista
    const existing = await this.prisma.supplyCategory.findUnique({
      where: {
        businessUnitId_code: {
          businessUnitId,
          code: data.code.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new Error(`Supply category with code ${data.code} already exists`);
    }

    return await this.prisma.supplyCategory.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        tenantId,
        businessUnitId,
        requiresStockControl: data.requiresStockControl ?? true,
        allowNegativeStock: data.allowNegativeStock ?? false,
      },
    });
  }

  /**
   * Listar categorías con filtros
   */
  async listCategories(
    tenantId: string,
    businessUnitId: string,
    filters?: SupplyCategoryFilters,
  ) {
    const where: any = {
      tenantId,
      businessUnitId,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const categories = await this.prisma.supplyCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            supplies: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return categories.map((cat) => ({
      ...cat,
      suppliesCount: cat._count.supplies,
      _count: undefined,
    }));
  }

  /**
   * Obtener categoría por ID
   */
  async getCategoryById(
    tenantId: string,
    businessUnitId: string,
    categoryId: string,
  ) {
    const category = await this.prisma.supplyCategory.findFirst({
      where: {
        id: categoryId,
        tenantId,
        businessUnitId,
      },
      include: {
        supplies: {
          select: {
            id: true,
            code: true,
            name: true,
            stock: true,
            isActive: true,
          },
          take: 10,
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            supplies: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error("Supply category not found");
    }

    return {
      ...category,
      suppliesCount: category._count.supplies,
      _count: undefined,
    };
  }

  /**
   * Actualizar categoría
   */
  async updateCategory(
    tenantId: string,
    businessUnitId: string,
    categoryId: string,
    data: UpdateSupplyCategoryDTO,
  ) {
    // Verificar que existe
    const existing = await this.prisma.supplyCategory.findFirst({
      where: {
        id: categoryId,
        tenantId,
        businessUnitId,
      },
    });

    if (!existing) {
      throw new Error("Supply category not found");
    }

    // Si cambia el código, verificar que no exista otro con ese código
    if (data.code && data.code !== existing.code) {
      const duplicate = await this.prisma.supplyCategory.findUnique({
        where: {
          businessUnitId_code: {
            businessUnitId,
            code: data.code.toUpperCase(),
          },
        },
      });

      if (duplicate) {
        throw new Error(
          `Supply category with code ${data.code} already exists`,
        );
      }
    }

    const updateData: any = { ...data };
    if (data.code) {
      updateData.code = data.code.toUpperCase();
    }

    return await this.prisma.supplyCategory.update({
      where: { id: categoryId },
      data: updateData,
    });
  }

  /**
   * Eliminar categoría
   */
  async deleteCategory(
    tenantId: string,
    businessUnitId: string,
    categoryId: string,
  ) {
    // Verificar que existe
    const existing = await this.prisma.supplyCategory.findFirst({
      where: {
        id: categoryId,
        tenantId,
        businessUnitId,
      },
      include: {
        _count: {
          select: {
            supplies: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Supply category not found");
    }

    // Verificar que no tenga insumos asignados
    if (existing._count.supplies > 0) {
      throw new Error(
        `Cannot delete category with ${existing._count.supplies} supplies assigned. Please reassign or delete supplies first.`,
      );
    }

    await this.prisma.supplyCategory.delete({
      where: { id: categoryId },
    });

    return { success: true, message: "Category deleted successfully" };
  }

  /**
   * Activar/Desactivar categoría
   */
  async toggleActiveCategory(
    tenantId: string,
    businessUnitId: string,
    categoryId: string,
  ) {
    const existing = await this.prisma.supplyCategory.findFirst({
      where: {
        id: categoryId,
        tenantId,
        businessUnitId,
      },
    });

    if (!existing) {
      throw new Error("Supply category not found");
    }

    return await this.prisma.supplyCategory.update({
      where: { id: categoryId },
      data: { isActive: !existing.isActive },
    });
  }

  /**
   * Obtener estadísticas por tipo
   */
  async getCategoryStats(tenantId: string, businessUnitId: string) {
    const categories = await this.prisma.supplyCategory.findMany({
      where: {
        tenantId,
        businessUnitId,
      },
      include: {
        _count: {
          select: {
            supplies: true,
          },
        },
      },
    });

    // Agrupar por tipo
    const statsByType: Record<
      string,
      { count: number; suppliesCount: number; active: number }
    > = {};

    categories.forEach((cat) => {
      if (!statsByType[cat.type]) {
        statsByType[cat.type] = { count: 0, suppliesCount: 0, active: 0 };
      }

      statsByType[cat.type].count++;
      statsByType[cat.type].suppliesCount += cat._count.supplies;
      if (cat.isActive) {
        statsByType[cat.type].active++;
      }
    });

    return {
      total: categories.length,
      byType: statsByType,
      activeCategories: categories.filter((c) => c.isActive).length,
      inactiveCategories: categories.filter((c) => !c.isActive).length,
    };
  }
}

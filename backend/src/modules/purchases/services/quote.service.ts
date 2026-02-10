/**
 * QUOTE SERVICE
 * Gestión de cotizaciones de insumos
 */

import { PrismaClient } from "@prisma/client";
import {
  CreateSupplyQuoteDTO,
  UpdateSupplyQuoteDTO,
  QuoteComparison,
} from "../types/purchases.types";

export class QuoteService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Crear cotización
   */
  async createQuote(
    tenantId: string,
    businessUnitId: string,
    data: CreateSupplyQuoteDTO,
    createdBy?: string,
  ) {
    // Verificar que el supply existe
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

    // Verificar que el proveedor existe
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: data.supplierId,
        tenantId,
        businessUnitId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return await this.prisma.supplyQuote.create({
      data: {
        ...data,
        tenantId,
        businessUnitId,
        currency: data.currency || supplier.currency,
        createdBy,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supply: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
    });
  }

  /**
   * Listar cotizaciones
   */
  async listQuotes(
    tenantId: string,
    businessUnitId: string,
    filters: {
      supplyId?: string;
      supplierId?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { supplyId, supplierId, isActive, page = 1, limit = 50 } = filters;

    const where: any = {
      tenantId,
      businessUnitId,
    };

    if (supplyId) where.supplyId = supplyId;
    if (supplierId) where.supplierId = supplierId;
    if (isActive !== undefined) where.isActive = isActive;

    const [quotes, total] = await Promise.all([
      this.prisma.supplyQuote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          supply: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supplyQuote.count({ where }),
    ]);

    return {
      data: quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener cotización por ID
   */
  async getQuoteById(quoteId: string) {
    const quote = await this.prisma.supplyQuote.findUnique({
      where: { id: quoteId },
      include: {
        supplier: true,
        supply: true,
      },
    });

    if (!quote) {
      throw new Error("Quote not found");
    }

    return quote;
  }

  /**
   * Actualizar cotización
   */
  async updateQuote(quoteId: string, data: UpdateSupplyQuoteDTO) {
    return await this.prisma.supplyQuote.update({
      where: { id: quoteId },
      data,
      include: {
        supplier: true,
        supply: true,
      },
    });
  }

  /**
   * Eliminar cotización
   */
  async deleteQuote(quoteId: string) {
    await this.prisma.supplyQuote.delete({
      where: { id: quoteId },
    });
  }

  /**
   * Comparar cotizaciones de un insumo
   */
  async compareQuotes(
    tenantId: string,
    businessUnitId: string,
    supplyId: string,
  ): Promise<QuoteComparison> {
    const supply = await this.prisma.supply.findFirst({
      where: {
        id: supplyId,
        tenantId,
        businessUnitId,
      },
    });

    if (!supply) {
      throw new Error("Supply not found");
    }

    const quotes = await this.prisma.supplyQuote.findMany({
      where: {
        supplyId,
        tenantId,
        businessUnitId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { unitPrice: "asc" },
    });

    const quotesData = quotes.map((q) => ({
      supplierId: q.supplierId,
      supplierName: q.supplier.name,
      unitPrice: Number(q.unitPrice),
      currency: q.currency,
      validUntil: q.validUntil || undefined,
      isActive: q.isActive,
    }));

    const bestQuote = quotes[0];

    return {
      supplyId: supply.id,
      supplyName: supply.name,
      quotes: quotesData,
      bestPrice: bestQuote
        ? {
            supplierId: bestQuote.supplierId,
            supplierName: bestQuote.supplier.name,
            unitPrice: Number(bestQuote.unitPrice),
          }
        : {
            supplierId: "",
            supplierName: "No quotes available",
            unitPrice: 0,
          },
    };
  }

  /**
   * Obtener cotizaciones activas de un proveedor
   */
  async getActiveQuotesBySupplierId(
    tenantId: string,
    businessUnitId: string,
    supplierId: string,
  ) {
    return await this.prisma.supplyQuote.findMany({
      where: {
        supplierId,
        tenantId,
        businessUnitId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      include: {
        supply: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: { supply: { name: "asc" } },
    });
  }

  /**
   * Desactivar cotizaciones vencidas automáticamente
   */
  async deactivateExpiredQuotes(tenantId: string, businessUnitId: string) {
    const result = await this.prisma.supplyQuote.updateMany({
      where: {
        tenantId,
        businessUnitId,
        isActive: true,
        validUntil: { lt: new Date() },
      },
      data: {
        isActive: false,
      },
    });

    return { deactivatedCount: result.count };
  }
}

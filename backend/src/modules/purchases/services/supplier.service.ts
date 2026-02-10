/**
 * SUPPLIER SERVICE
 * Gestión de proveedores, contactos y cuenta corriente
 */

import { PrismaClient, SupplierStatus, AccountEntryType } from "@prisma/client";
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierFilters,
  CreateSupplierContactDTO,
  UpdateSupplierContactDTO,
  CreateAccountEntryDTO,
  AccountBalance,
} from "../types/purchases.types";

export class SupplierService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Crear proveedor
   */
  async createSupplier(
    tenantId: string,
    businessUnitId: string,
    data: CreateSupplierDTO,
  ) {
    // Verificar que el código no exista
    const existing = await this.prisma.supplier.findUnique({
      where: {
        tenantId_businessUnitId_code: {
          tenantId,
          businessUnitId,
          code: data.code,
        },
      },
    });

    if (existing) {
      throw new Error(`Supplier with code ${data.code} already exists`);
    }

    return await this.prisma.supplier.create({
      data: {
        ...data,
        tenantId,
        businessUnitId,
        currency: data.currency || "USD",
      },
      include: {
        contacts: true,
      },
    });
  }

  /**
   * Listar proveedores con filtros
   */
  async listSuppliers(
    tenantId: string,
    businessUnitId: string,
    filters: SupplierFilters = {},
  ) {
    const { status, search, country, page = 1, limit = 50 } = filters;

    const where: any = {
      tenantId,
      businessUnitId,
    };

    if (status) {
      where.status = status;
    }

    if (country) {
      where.country = country;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { tradeName: { contains: search, mode: "insensitive" } },
        { taxId: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contacts: true,
          _count: {
            select: {
              purchaseOrders: true,
              quotes: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener proveedor por ID
   */
  async getSupplierById(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        contacts: true,
        _count: {
          select: {
            purchaseOrders: true,
            quotes: true,
            accountEntries: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  /**
   * Actualizar proveedor
   */
  async updateSupplier(supplierId: string, data: UpdateSupplierDTO) {
    return await this.prisma.supplier.update({
      where: { id: supplierId },
      data,
      include: {
        contacts: true,
      },
    });
  }

  /**
   * Eliminar proveedor
   */
  async deleteSupplier(supplierId: string) {
    await this.prisma.supplier.delete({
      where: { id: supplierId },
    });
  }

  // ============================================
  // CONTACTOS
  // ============================================

  /**
   * Agregar contacto a proveedor
   */
  async addContact(data: CreateSupplierContactDTO) {
    // Si es contacto primario, quitar el flag de otros
    if (data.isPrimary) {
      await this.prisma.supplierContact.updateMany({
        where: { supplierId: data.supplierId },
        data: { isPrimary: false },
      });
    }

    return await this.prisma.supplierContact.create({
      data,
    });
  }

  /**
   * Actualizar contacto
   */
  async updateContact(contactId: string, data: UpdateSupplierContactDTO) {
    // Si se marca como primario, quitar el flag de otros
    if (data.isPrimary) {
      const contact = await this.prisma.supplierContact.findUnique({
        where: { id: contactId },
      });

      if (contact) {
        await this.prisma.supplierContact.updateMany({
          where: {
            supplierId: contact.supplierId,
            id: { not: contactId },
          },
          data: { isPrimary: false },
        });
      }
    }

    return await this.prisma.supplierContact.update({
      where: { id: contactId },
      data,
    });
  }

  /**
   * Eliminar contacto
   */
  async deleteContact(contactId: string) {
    await this.prisma.supplierContact.delete({
      where: { id: contactId },
    });
  }

  // ============================================
  // CUENTA CORRIENTE
  // ============================================

  /**
   * Crear entrada en cuenta corriente
   */
  async createAccountEntry(
    tenantId: string,
    businessUnitId: string,
    data: CreateAccountEntryDTO,
    createdBy?: string,
  ) {
    // Obtener balance actual
    const currentBalance = await this.getAccountBalance(data.supplierId);

    // Calcular nuevo balance
    let newBalance = currentBalance.balance;

    switch (data.type) {
      case AccountEntryType.PURCHASE:
      case AccountEntryType.DEBIT_NOTE:
        newBalance += data.amount; // Aumenta deuda
        break;
      case AccountEntryType.PAYMENT:
      case AccountEntryType.CREDIT_NOTE:
        newBalance -= data.amount; // Reduce deuda
        break;
      case AccountEntryType.ADJUSTMENT:
        newBalance = data.amount; // Ajuste directo
        break;
    }

    return await this.prisma.supplierAccountEntry.create({
      data: {
        ...data,
        balance: newBalance,
        createdBy,
      },
      include: {
        supplier: true,
        purchaseOrder: true,
      },
    });
  }

  /**
   * Obtener balance de cuenta corriente
   */
  async getAccountBalance(supplierId: string): Promise<AccountBalance> {
    const lastEntry = await this.prisma.supplierAccountEntry.findFirst({
      where: { supplierId },
      orderBy: { createdAt: "desc" },
    });

    const balance = Number(lastEntry?.balance || 0);

    // Calcular deuda vencida
    const overdueEntries = await this.prisma.supplierAccountEntry.findMany({
      where: {
        supplierId,
        type: {
          in: [AccountEntryType.PURCHASE, AccountEntryType.DEBIT_NOTE],
        },
        dueDate: { lt: new Date() },
      },
    });

    const overdueAmount = overdueEntries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    // Calcular deuda corriente (no vencida)
    const currentAmount = balance - overdueAmount;

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { currency: true },
    });

    return {
      balance,
      currency: supplier?.currency || "USD",
      overdueAmount,
      currentAmount,
    };
  }

  /**
   * Obtener historial de cuenta corriente
   */
  async getAccountHistory(
    supplierId: string,
    fromDate?: Date,
    toDate?: Date,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: any = { supplierId };

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const [entries, total] = await Promise.all([
      this.prisma.supplierAccountEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          purchaseOrder: {
            select: {
              code: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supplierAccountEntry.count({ where }),
    ]);

    return {
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

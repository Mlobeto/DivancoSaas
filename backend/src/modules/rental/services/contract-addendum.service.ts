/**
 * CONTRACT ADDENDUM SERVICE
 * Gestión de addendums para contratos maestros (Master Contract System v7.0)
 *
 * Un addendum documenta cada entrega de equipos dentro de un contrato maestro.
 * Cada addendum incluye los items específicos, costos estimados, periodo y estado.
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import type { ContractAddendum, AssetRental } from "@prisma/client";
import { notificationService } from "@core/services/notification.service";

// ============================================
// TYPES
// ============================================

export interface CreateAddendumParams {
  tenantId: string;
  businessUnitId: string;
  contractId: string;
  items: AddendumItem[]; // Items a entregar en este addendum
  estimatedDays?: number;
  issueDate?: Date;
  notes?: string;
  metadata?: any;
  createdBy?: string;
  // Operario
  hasOperator?: boolean;
  operatorLicenseUrl?: string;
  operatorCertificationUrl?: string;
  operatorInsuranceUrl?: string;
  operatorDocumentationNotes?: string;
  // Transporte
  transportType?: string;
  vehicleId?: string;
  driverName?: string;
  transportNotes?: string;
}

export interface AddendumItem {
  assetId: string;
  quantity?: number; // Para items bulk
  startDate: Date;
  estimatedEndDate?: Date;
  dailyRate?: number;
  hourlyRate?: number;
  operatorCostType?: "PER_DAY" | "PER_HOUR";
  operatorCostRate?: number;
  estimatedCost: number;
}

export interface UpdateAddendumParams {
  actualCost?: number;
  status?:
    | "pending_preparation"
    | "ready_to_ship"
    | "delivered"
    | "completed"
    | "cancelled";
  completedAt?: Date;
  notes?: string;
  metadata?: any;
}

export interface CompleteAddendumParams {
  addendumId: string;
  actualCost: number;
  completedAt?: Date;
  notes?: string;
}

// ============================================
// SERVICE
// ============================================

export class ContractAddendumService {
  /**
   * Crear addendum para un contrato maestro
   */
  async createAddendum(
    params: CreateAddendumParams,
  ): Promise<ContractAddendum> {
    // 1. Verificar que el contrato existe y es tipo 'master'
    const contract = await prisma.rentalContract.findUnique({
      where: { id: params.contractId },
      include: {
        client: true,
        clientAccount: true,
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.contractType !== "master") {
      throw new Error(
        "Addendums can only be created for master contracts. This is a specific contract.",
      );
    }

    if (contract.status !== "active") {
      throw new Error(
        `Cannot create addendum for contract with status: ${contract.status}`,
      );
    }

    // 2. VALIDAR FIRMA DIGITAL (debe estar firmado)
    if (contract.signatureStatus !== "signed") {
      throw new Error(
        `Contract must be signed before creating deliveries. Current signature status: ${contract.signatureStatus || "not_requested"}`,
      );
    }

    // 3. VALIDAR PAGO CERTIFICADO (debe estar verificado por staff)
    if (!contract.paymentVerifiedAt) {
      throw new Error(
        "Contract payment must be verified by staff before creating deliveries. Please verify the payment proof first.",
      );
    }

    // 4. Calcular costo estimado total del addendum
    const estimatedCost = params.items.reduce(
      (sum, item) => sum + item.estimatedCost,
      0,
    );

    // 5. Verificar límites de crédito (si están configurados)
    if (contract.clientAccount.creditLimit.greaterThan(0)) {
      const availableCredit = contract.clientAccount.creditLimit
        .minus(contract.clientAccount.totalConsumed)
        .minus(contract.clientAccount.balance.abs());

      if (new Decimal(estimatedCost).greaterThan(availableCredit)) {
        throw new Error(
          `Insufficient credit. Available: $${availableCredit}, Required: $${estimatedCost}. Request a limit increase first.`,
        );
      }
    }

    // 6. Generar código del addendum
    const addendumCount = await prisma.contractAddendum.count({
      where: {
        contractId: params.contractId,
      },
    });

    const addendumNumber = String(addendumCount + 1).padStart(3, "0");
    const code = `${contract.code}-ADD-${addendumNumber}`; // Ejemplo: CON-2026-001-ADD-001

    // 7. Crear addendum y rentals en una transacción
    const addendum = await prisma.$transaction(async (tx) => {
      // Crear addendum
      const newAddendum = await tx.contractAddendum.create({
        data: {
          tenantId: params.tenantId,
          businessUnitId: params.businessUnitId,
          contractId: params.contractId,
          code,
          addendumType: "delivery",
          issueDate: params.issueDate || new Date(),
          items: params.items, // Guardamos los items como JSON
          estimatedCost: new Decimal(estimatedCost),
          estimatedDays: params.estimatedDays,
          status: "pending_preparation",
          // Operario
          hasOperator: params.hasOperator || false,
          operatorLicenseUrl: params.operatorLicenseUrl,
          operatorCertificationUrl: params.operatorCertificationUrl,
          operatorInsuranceUrl: params.operatorInsuranceUrl,
          operatorDocumentationNotes: params.operatorDocumentationNotes,
          // Transporte
          transportType: params.transportType,
          vehicleId: params.vehicleId,
          driverName: params.driverName,
          transportNotes: params.transportNotes,
          notes: params.notes,
          metadata: params.metadata,
          createdBy: params.createdBy,
        },
      });

      // Crear AssetRentals para cada item del addendum
      for (const item of params.items) {
        const asset = await tx.asset.findUnique({
          where: { id: item.assetId },
          select: {
            id: true,
            trackingType: true,
            pricePerHour: true,
            pricePerDay: true,
            operatorCostType: true,
            operatorCostRate: true,
            currentHourMeter: true,
            currentKm: true,
          },
        });

        if (!asset) {
          throw new Error(`Asset ${item.assetId} not found`);
        }

        // Crear rental vinculado al addendum
        await tx.assetRental.create({
          data: {
            contractId: params.contractId,
            assetId: item.assetId,
            addendumId: newAddendum.id, // Vincular al addendum
            trackingType: asset.trackingType || "TOOL",
            withdrawalDate: item.startDate,
            expectedReturnDate: item.estimatedEndDate,

            // Para MACHINERY
            hourlyRate: item.hourlyRate
              ? new Decimal(item.hourlyRate)
              : asset.pricePerHour,
            operatorCostType: item.operatorCostType || asset.operatorCostType,
            operatorCostRate: item.operatorCostRate
              ? new Decimal(item.operatorCostRate)
              : asset.operatorCostRate,
            initialHourometer: asset.currentHourMeter,
            initialOdometer: asset.currentKm,

            // Para TOOL
            dailyRate: item.dailyRate
              ? new Decimal(item.dailyRate)
              : asset.pricePerDay,

            withdrawalEvidence: [],
            createdBy: params.createdBy || "system",
          },
        });

        // Marcar asset como alquilado
        await tx.asset.update({
          where: { id: item.assetId },
          data: {
            isCurrentlyRented: true,
            currentRentalContract: contract.code,
          },
        });
      }

      return newAddendum;
    });

    // 8. Notificar al sector de mantenimiento
    const itemsList = params.items
      .map((item, idx) => {
        const assetName = item.assetId; // Se resolverá en el frontend con el nombre real
        return `${idx + 1}. Asset ${assetName} (${item.quantity || 1} unidad${item.quantity && item.quantity > 1 ? "es" : ""})`;
      })
      .join("\\n");

    await notificationService.create({
      tenantId: params.tenantId,
      businessUnitId: params.businessUnitId,
      type: "delivery_pending_preparation",
      title: "🚚 Nueva entrega pendiente de preparación",
      body: `Addendum ${addendum.code} para contrato ${contract.code} requiere preparación. ${params.hasOperator ? "⚠️ Requiere operario - verificar documentación." : ""} ${params.items.length} item(s) a entregar.`,
      data: {
        addendumId: addendum.id,
        addendumCode: addendum.code,
        contractId: params.contractId,
        contractCode: contract.code,
        clientName: contract.client.displayName,
        hasOperator: params.hasOperator,
        itemsCount: params.items.length,
      },
    });

    return addendum;
  }

  /**
   * Obtener addendum por ID con detalles
   */
  async getAddendumById(addendumId: string) {
    const addendum = await prisma.contractAddendum.findUnique({
      where: { id: addendumId },
      include: {
        contract: {
          include: {
            client: {
              select: {
                displayName: true,
                email: true,
              },
            },
          },
        },
        rentals: {
          include: {
            asset: {
              select: {
                code: true,
                name: true,
                trackingType: true,
              },
            },
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
        businessUnit: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!addendum) {
      throw new Error("Addendum not found");
    }

    return addendum;
  }

  /**
   * Listar addendums de un contrato
   */
  async listAddendumsByContract(contractId: string) {
    const addendums = await prisma.contractAddendum.findMany({
      where: { contractId },
      include: {
        rentals: {
          select: {
            id: true,
            assetId: true,
            withdrawalDate: true,
            actualReturnDate: true,
            totalCost: true,
            asset: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    return addendums;
  }

  /**
   * Actualizar addendum
   */
  async updateAddendum(
    addendumId: string,
    params: UpdateAddendumParams,
  ): Promise<ContractAddendum> {
    const addendum = await prisma.contractAddendum.update({
      where: { id: addendumId },
      data: {
        actualCost: params.actualCost
          ? new Decimal(params.actualCost)
          : undefined,
        status: params.status,
        completedAt: params.completedAt,
        notes: params.notes,
        metadata: params.metadata,
      },
    });

    return addendum;
  }

  /**
   * Completar addendum (todos los assets devueltos)
   */
  async completeAddendum(
    params: CompleteAddendumParams,
  ): Promise<ContractAddendum> {
    // 1. Verificar que todos los rentals del addendum están devueltos
    const rentals = await prisma.assetRental.findMany({
      where: {
        addendumId: params.addendumId,
      },
    });

    const hasActiveRentals = rentals.some((r) => !r.actualReturnDate);

    if (hasActiveRentals) {
      throw new Error(
        "Cannot complete addendum: some assets have not been returned yet",
      );
    }

    // 2. Calcular costo real total (suma de todos los rentals)
    const actualCost = rentals.reduce(
      (sum, r) => sum.plus(r.totalCost),
      new Decimal(0),
    );

    // 3. Actualizar addendum
    const addendum = await prisma.contractAddendum.update({
      where: { id: params.addendumId },
      data: {
        status: "completed",
        actualCost: new Decimal(params.actualCost || actualCost.toNumber()),
        completedAt: params.completedAt || new Date(),
        notes: params.notes,
      },
      include: {
        contract: true,
      },
    });

    // 4. Actualizar totalActiveDays del contrato
    const allAddendums = await prisma.contractAddendum.findMany({
      where: {
        contractId: addendum.contractId,
        status: "completed",
      },
    });

    const totalActiveDays = allAddendums.reduce(
      (sum, a) => sum + (a.estimatedDays || 0),
      0,
    );

    await prisma.rentalContract.update({
      where: { id: addendum.contractId },
      data: {
        totalActiveDays,
      },
    });

    return addendum;
  }

  /**
   * Cancelar addendum (antes de entregar assets)
   */
  async cancelAddendum(addendumId: string, reason: string) {
    const addendum = await prisma.contractAddendum.findUnique({
      where: { id: addendumId },
      include: {
        rentals: true,
      },
    });

    if (!addendum) {
      throw new Error("Addendum not found");
    }

    if (addendum.status === "completed") {
      throw new Error("Cannot cancel completed addendum");
    }

    // Si hay rentals activos, no se puede cancelar
    const hasActiveRentals = addendum.rentals.some((r) => !r.actualReturnDate);

    if (hasActiveRentals) {
      throw new Error(
        "Cannot cancel addendum: some assets have been delivered. Return all assets first.",
      );
    }

    // Cancelar addendum y eliminar rentals
    await prisma.$transaction(async (tx) => {
      // Eliminar rentals
      await tx.assetRental.deleteMany({
        where: { addendumId },
      });

      // Actualizar addendum
      await tx.contractAddendum.update({
        where: { id: addendumId },
        data: {
          status: "cancelled",
          notes: `Cancelled: ${reason}`,
        },
      });
    });
  }

  /**
   * Confirmar preparación del addendum (mantenimiento)
   * Marca el addendum como listo para enviar
   */
  async confirmPreparation(
    addendumId: string,
    preparedBy: string,
    notes?: string,
  ): Promise<ContractAddendum> {
    const addendum = await prisma.contractAddendum.findUnique({
      where: { id: addendumId },
      include: { contract: true },
    });

    if (!addendum) {
      throw new Error("Addendum not found");
    }

    if (addendum.status !== "pending_preparation") {
      throw new Error(
        `Cannot confirm preparation: addendum is in status ${addendum.status}`,
      );
    }

    // Actualizar a "ready_to_ship"
    const updated = await prisma.contractAddendum.update({
      where: { id: addendumId },
      data: {
        status: "ready_to_ship",
        preparedById: preparedBy,
        preparedAt: new Date(),
        notes: notes
          ? `${addendum.notes || ""}\n\n[Preparación] ${notes}`
          : addendum.notes,
      },
    });

    // Notificar al creador
    await notificationService.create({
      tenantId: addendum.tenantId,
      businessUnitId: addendum.businessUnitId,
      userId: addendum.createdBy || undefined,
      type: "delivery_ready_to_ship",
      title: "✅ Entrega preparada",
      body: `El addendum ${addendum.code} está listo para enviar. Ya puede confirmar la entrega al cliente.`,
      data: {
        addendumId: addendum.id,
        addendumCode: addendum.code,
        contractId: addendum.contractId,
      },
    });

    return updated;
  }

  /**
   * Confirmar entrega del addendum al cliente
   * Marca el addendum como entregado e inicia los cargos diarios
   */
  async confirmDelivery(
    addendumId: string,
    deliveredBy: string,
    notes?: string,
  ): Promise<ContractAddendum> {
    const addendum = await prisma.contractAddendum.findUnique({
      where: { id: addendumId },
      include: {
        contract: {
          include: {
            client: {
              select: { displayName: true },
            },
          },
        },
        rentals: true,
      },
    });

    if (!addendum) {
      throw new Error("Addendum not found");
    }

    if (addendum.status !== "ready_to_ship") {
      throw new Error(
        `Cannot confirm delivery: addendum must be in ready_to_ship status. Current: ${addendum.status}`,
      );
    }

    const deliveryDate = new Date();

    // Actualizar addendum y rentals en transacción
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar addendum
      const updatedAddendum = await tx.contractAddendum.update({
        where: { id: addendumId },
        data: {
          status: "delivered",
          deliveredById: deliveredBy,
          deliveredAt: deliveryDate,
          notes: notes
            ? `${addendum.notes || ""}\n\n[Entrega] ${notes}`
            : addendum.notes,
        },
      });

      // Actualizar todos los rentals: establecer fecha de inicio real (actualStartDate)
      // Esto permite que el cron de cargos diarios los procese
      for (const rental of addendum.rentals) {
        await tx.assetRental.update({
          where: { id: rental.id },
          data: {
            // Establecer el inicio real para que los cargos diarios comiencen
            withdrawalDate: deliveryDate,
          },
        });
      }

      return updatedAddendum;
    });

    // Notificar al creador y al cliente
    await notificationService.create({
      tenantId: addendum.tenantId,
      businessUnitId: addendum.businessUnitId,
      type: "delivery_confirmed",
      title: "📦 Entrega confirmada",
      body: `El addendum ${addendum.code} fue entregado al cliente ${addendum.contract.client.displayName}. Los cargos diarios comenzarán a partir de ahora.`,
      data: {
        addendumId: addendum.id,
        addendumCode: addendum.code,
        contractId: addendum.contractId,
        deliveredAt: deliveryDate.toISOString(),
      },
    });

    return updated;
  }

  /**
   * Generar PDF del addendum
   */
  async generateAddendumPDF(addendumId: string): Promise<string> {
    // TODO: Implementar generación de PDF con plantillas personalizables
    // Similar a como se hace en quotation.service.ts

    const addendum = await this.getAddendumById(addendumId);

    // Por ahora retornar URL placeholder
    return `https://storage.example.com/addendums/${addendum.code}.pdf`;
  }
}

export const contractAddendumService = new ContractAddendumService();

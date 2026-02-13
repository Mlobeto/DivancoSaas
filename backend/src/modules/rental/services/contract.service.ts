/**
 * CONTRACT SERVICE
 * Gestión de contratos de alquiler con crédito compartido
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import { accountService } from "./account.service";

export interface CreateContractParams {
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  quotationId?: string;
  startDate: Date;
  estimatedEndDate?: Date;
  estimatedTotal?: number;
  templateId?: string;
  pdfUrl?: string;
  notes?: string;
  metadata?: any;
  createdBy: string;
}

export interface WithdrawAssetParams {
  contractId: string;
  assetId: string;
  expectedReturnDate?: Date;
  operatorId?: string;
  initialHourometer?: number;
  initialOdometer?: number;
  evidenceUrls?: string[];
  notes?: string;
  createdBy: string;
}

export interface ReturnAssetParams {
  rentalId: string;
  returnDate: Date;
  finalHourometer?: number;
  finalOdometer?: number;
  evidenceUrls?: string[];
  condition?: string;
  notes?: string;
  createdBy: string;
}

export class ContractService {
  /**
   * Crear contrato de alquiler
   */
  async createContract(params: CreateContractParams) {
    // 1. Verificar o crear ClientAccount
    let clientAccount = await prisma.clientAccount.findUnique({
      where: { clientId: params.clientId },
    });

    if (!clientAccount) {
      // Crear cuenta si no existe
      clientAccount = await accountService.createAccount({
        tenantId: params.tenantId,
        clientId: params.clientId,
        initialBalance: 0,
        alertAmount: 100000, // Default $100k
        statementFrequency: "monthly",
      });
    }

    // 2. Generar código único
    const code = await this.generateContractCode(
      params.tenantId,
      params.businessUnitId,
    );

    // 3. Crear contrato
    const contract = await prisma.rentalContract.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        clientId: params.clientId,
        clientAccountId: clientAccount.id,
        quotationId: params.quotationId,
        code,
        status: "active",
        startDate: params.startDate,
        estimatedEndDate: params.estimatedEndDate,
        estimatedTotal: params.estimatedTotal
          ? new Decimal(params.estimatedTotal)
          : undefined,
        templateId: params.templateId,
        pdfUrl: params.pdfUrl,
        notes: params.notes,
        metadata: params.metadata,
        createdBy: params.createdBy,
      },
      include: {
        client: true,
        clientAccount: true,
        quotation: {
          include: {
            items: true,
          },
        },
      },
    });

    return contract;
  }

  /**
   * Retirar asset (iniciar alquiler)
   */
  async withdrawAsset(params: WithdrawAssetParams) {
    // 1. Validar contrato
    const contract = await prisma.rentalContract.findUnique({
      where: { id: params.contractId },
      include: {
        clientAccount: true,
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "active") {
      throw new Error(`Contract status is ${contract.status}, must be active`);
    }

    // 2. Validar asset
    const asset = await prisma.asset.findUnique({
      where: { id: params.assetId },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (!asset.trackingType) {
      throw new Error("Asset must have trackingType configured");
    }

    // 3. Validar balance (opcional, warning)
    const balance = Number(contract.clientAccount.balance);
    if (balance <= 0) {
      console.warn(
        `Warning: Client ${contract.clientId} has zero or negative balance`,
      );
    }

    // 4. Crear AssetRental
    const rental = await prisma.assetRental.create({
      data: {
        contractId: params.contractId,
        assetId: params.assetId,
        withdrawalDate: new Date(),
        expectedReturnDate: params.expectedReturnDate,
        trackingType: asset.trackingType,

        // Para MACHINERY
        hourlyRate: asset.pricePerHour,
        operatorCostType: asset.operatorCostType,
        operatorCostRate: asset.operatorCostRate,
        initialHourometer: params.initialHourometer
          ? new Decimal(params.initialHourometer)
          : undefined,
        currentHourometer: params.initialHourometer
          ? new Decimal(params.initialHourometer)
          : undefined,
        initialOdometer: params.initialOdometer
          ? new Decimal(params.initialOdometer)
          : undefined,
        currentOdometer: params.initialOdometer
          ? new Decimal(params.initialOdometer)
          : undefined,

        // Para TOOL
        dailyRate: asset.pricePerDay,

        withdrawalEvidence: params.evidenceUrls || [],
        notes: params.notes,
        createdBy: params.createdBy,
      },
      include: {
        asset: true,
        contract: true,
      },
    });

    // 5. Registrar movimiento (NO se descuenta en retiro)
    await accountService.createMovement({
      accountId: contract.clientAccountId,
      contractId: params.contractId,
      movementType: "WITHDRAWAL_START",
      amount: 0, // NO se descuenta al retirar
      description: `Retiro de ${asset.name} (${asset.code}) - Inicio de tracking`,
      assetRentalId: rental.id,
      evidenceUrls: params.evidenceUrls,
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return rental;
  }

  /**
   * Devolver asset (finalizar alquiler)
   */
  async returnAsset(params: ReturnAssetParams) {
    // 1. Validar rental
    const rental = await prisma.assetRental.findUnique({
      where: { id: params.rentalId },
      include: {
        asset: true,
        contract: {
          include: {
            clientAccount: true,
          },
        },
      },
    });

    if (!rental) {
      throw new Error("Rental not found");
    }

    if (rental.actualReturnDate) {
      throw new Error("Asset already returned");
    }

    // 2. Actualizar AssetRental
    const updatedRental = await prisma.assetRental.update({
      where: { id: params.rentalId },
      data: {
        actualReturnDate: params.returnDate,
        returnEvidence: params.evidenceUrls || [],
        notes: rental.notes
          ? `${rental.notes}\n\nDevolución: ${params.notes || ""}`
          : params.notes,

        // Actualizar métricas finales si aplica
        currentHourometer: params.finalHourometer
          ? new Decimal(params.finalHourometer)
          : rental.currentHourometer,
        currentOdometer: params.finalOdometer
          ? new Decimal(params.finalOdometer)
          : rental.currentOdometer,
      },
    });

    // 3. Registrar movimiento (NO se descuenta en devolución, ya se descontó día a día)
    await accountService.createMovement({
      accountId: rental.contract.clientAccountId,
      contractId: rental.contractId,
      movementType: "RETURN_END",
      amount: 0, // NO se descuenta al devolver
      description: `Devolución de ${rental.asset.name} (${rental.asset.code}) - Fin de tracking. Total: $${rental.totalCost}`,
      assetRentalId: rental.id,
      evidenceUrls: params.evidenceUrls,
      metadata: {
        condition: params.condition,
        totalHoursUsed: rental.totalHoursUsed,
        totalKmUsed: rental.totalKmUsed,
        totalCost: rental.totalCost,
      },
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return updatedRental;
  }

  /**
   * Obtener contrato por ID
   */
  async getContractById(contractId: string) {
    return prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        clientAccount: true,
        quotation: {
          include: {
            items: true,
          },
        },
        activeRentals: {
          where: {
            actualReturnDate: null, // Assets actualmente en uso
          },
          include: {
            asset: true,
            usageReports: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  }

  /**
   * Listar contratos
   */
  async listContracts(filters: {
    tenantId: string;
    businessUnitId?: string;
    clientId?: string;
    status?: string;
  }) {
    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.businessUnitId) where.businessUnitId = filters.businessUnitId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status;

    return prisma.rentalContract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        clientAccount: true,
        activeRentals: {
          where: {
            actualReturnDate: null,
          },
          include: {
            asset: true,
          },
        },
      },
    });
  }

  /**
   * Finalizar contrato
   */
  async completeContract(contractId: string, createdBy: string) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        activeRentals: {
          where: {
            actualReturnDate: null,
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.activeRentals.length > 0) {
      throw new Error(
        `Cannot complete contract: ${contract.activeRentals.length} assets still in use`,
      );
    }

    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "completed",
        actualEndDate: new Date(),
      },
    });
  }

  /**
   * Suspender contrato
   */
  async suspendContract(contractId: string, reason: string, createdBy: string) {
    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "suspended",
        notes: `Suspendido: ${reason}`,
      },
    });
  }

  /**
   * Reactivar contrato
   */
  async reactivateContract(contractId: string, createdBy: string) {
    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "active",
      },
    });
  }

  /**
   * Generar código único de contrato
   */
  private async generateContractCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const lastContract = await prisma.rentalContract.findFirst({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: `CON-${year}-`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let sequence = 1;
    if (lastContract) {
      const match = lastContract.code.match(/CON-\d{4}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `CON-${year}-${sequence.toString().padStart(3, "0")}`;
  }
}

export const contractService = new ContractService();

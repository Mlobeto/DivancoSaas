/**
 * ACCOUNT SERVICE
 * Gestión de ClientAccount (cuentas de alquiler con balance compartido)
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import { nowInBUTimezone } from "@core/utils/timezone-utils";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";

export interface CreateAccountParams {
  tenantId: string;
  clientId: string;
  businessUnitId?: string; // Para obtener currency
  initialBalance?: number;
  creditLimit?: number; // Límite de crédito (v7.0)
  timeLimit?: number; // Límite de días (v7.0)
  alertAmount?: number;
  statementFrequency?: "weekly" | "biweekly" | "monthly" | "manual";
  notes?: string;
}

export interface ReloadCreditParams {
  accountId: string;
  amount: number;
  description: string;
  paymentMethod?: string;
  referenceNumber?: string;
  createdBy: string;
  proofFile?: Express.Multer.File;
  tenantId?: string;
  businessUnitId?: string;
}

export interface AccountMovementParams {
  accountId: string;
  contractId?: string;
  movementType: string;
  amount: number;
  machineryCost?: number;
  operatorCost?: number;
  toolCost?: number;
  description: string;
  evidenceUrls?: string[];
  assetRentalId?: string;
  usageReportId?: string;
  notes?: string;
  metadata?: any;
  createdBy?: string;
}

export class AccountService {
  /**
   * Crear cuenta de alquiler para un cliente
   */
  async createAccount(params: CreateAccountParams) {
    // Obtener currency de BusinessUnit si se proporciona
    let currency = "USD"; // Default
    if (params.businessUnitId) {
      const bu = await prisma.businessUnit.findUnique({
        where: { id: params.businessUnitId },
        select: { currency: true },
      });
      if (bu) {
        currency = bu.currency;
      }
    }

    const account = await prisma.clientAccount.create({
      data: {
        tenantId: params.tenantId,
        clientId: params.clientId,
        balance: new Decimal(params.initialBalance || 0),
        totalConsumed: new Decimal(0),
        totalReloaded: new Decimal(params.initialBalance || 0),
        creditLimit: params.creditLimit
          ? new Decimal(params.creditLimit)
          : new Decimal(0),
        timeLimit: params.timeLimit || 30, // Default 30 días
        activeDays: 0,
        alertAmount: new Decimal(params.alertAmount || 0),
        statementFrequency: params.statementFrequency,
        currency,
        notes: params.notes,
      },
      include: {
        client: true,
      },
    });

    // Si hay balance inicial, crear movimiento
    if (params.initialBalance && params.initialBalance > 0) {
      await this.createMovement({
        accountId: account.id,
        movementType: "INITIAL_CREDIT",
        amount: params.initialBalance,
        description: "Balance inicial de la cuenta",
      });
    }

    return account;
  }

  /**
   * Obtener cuenta por ID
   */
  async getAccountById(accountId: string) {
    return prisma.clientAccount.findUnique({
      where: { id: accountId },
      include: {
        client: true,
        movements: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            contract: true,
            assetRental: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Obtener cuenta por clientId
   */
  async getAccountByClientId(clientId: string) {
    return prisma.clientAccount.findUnique({
      where: { clientId },
      include: {
        client: true,
        movements: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            contract: true,
            assetRental: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Recargar crédito en la cuenta
   */
  async reloadCredit(params: ReloadCreditParams) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: params.accountId },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const newBalance = Number(account.balance) + params.amount;
    const newTotalReloaded = Number(account.totalReloaded) + params.amount;

    // Validar límites de Decimal(15, 2) - máximo: 9,999,999,999,999.99
    const MAX_DECIMAL_VALUE = 9999999999999.99;
    if (newBalance > MAX_DECIMAL_VALUE) {
      throw new Error(
        `El nuevo saldo (${newBalance.toLocaleString()}) excedería el límite máximo permitido`,
      );
    }
    if (newTotalReloaded > MAX_DECIMAL_VALUE) {
      throw new Error(
        `El total recargado (${newTotalReloaded.toLocaleString()}) excedería el límite máximo permitido`,
      );
    }

    // Si hay archivo, subirlo a Azure
    let proofUrl: string | undefined;
    if (params.proofFile) {
      try {
        const uploadResult = await azureBlobStorageService.uploadFile({
          file: params.proofFile.buffer,
          fileName: params.proofFile.originalname,
          contentType: params.proofFile.mimetype,
          folder: "payment-proofs",
          tenantId: params.tenantId || account.tenantId,
          businessUnitId: params.businessUnitId,
          containerName: "payment-proofs",
        });
        proofUrl = uploadResult.url;
      } catch (error) {
        console.error("[AccountService] Error uploading proof file:", error);
        // No fallar la recarga si el archivo no se puede subir
      }
    }

    // Actualizar cuenta con valores calculados
    const updatedAccount = await prisma.clientAccount.update({
      where: { id: params.accountId },
      data: {
        balance: new Decimal(newBalance),
        totalReloaded: new Decimal(newTotalReloaded),
        alertTriggered: false, // Reset alert
      },
    });

    // Crear movimiento con evidencia si existe
    await this.createMovement({
      accountId: params.accountId,
      movementType: "CREDIT_RELOAD",
      amount: params.amount,
      description: params.description,
      evidenceUrls: proofUrl ? [proofUrl] : undefined,
      metadata: {
        paymentMethod: params.paymentMethod,
        referenceNumber: params.referenceNumber,
      },
      createdBy: params.createdBy,
    });

    return updatedAccount;
  }

  /**
   * Crear movimiento en la cuenta
   * Este método actualiza el balance automáticamente
   */
  async createMovement(params: AccountMovementParams) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: params.accountId },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const balanceBefore = Number(account.balance);
    const balanceAfter = balanceBefore + params.amount;

    // Validar límite máximo para Decimal(15, 2)
    const MAX_DECIMAL_VALUE = 9999999999999.99;
    if (Math.abs(balanceAfter) > MAX_DECIMAL_VALUE) {
      throw new Error(`El nuevo saldo excedería el límite máximo permitido`);
    }

    // Validar que no quede negativo
    if (balanceAfter < 0) {
      throw new Error(
        `Insufficient balance. Current: ${balanceBefore}, Required: ${Math.abs(params.amount)}`,
      );
    }

    // Calcular nuevo totalConsumed si es un cargo negativo
    let newTotalConsumed: number | undefined;
    if (params.amount < 0) {
      newTotalConsumed =
        Number(account.totalConsumed) + Math.abs(params.amount);
      if (newTotalConsumed > MAX_DECIMAL_VALUE) {
        throw new Error(
          `El total consumido excedería el límite máximo permitido`,
        );
      }
    }

    // Crear movimiento
    const movement = await prisma.rentalAccountMovement.create({
      data: {
        clientAccountId: params.accountId,
        contractId: params.contractId,
        movementType: params.movementType,
        amount: new Decimal(params.amount),
        balanceBefore: new Decimal(balanceBefore),
        balanceAfter: new Decimal(balanceAfter),
        machineryCost: params.machineryCost
          ? new Decimal(params.machineryCost)
          : undefined,
        operatorCost: params.operatorCost
          ? new Decimal(params.operatorCost)
          : undefined,
        toolCost: params.toolCost ? new Decimal(params.toolCost) : undefined,
        description: params.description,
        evidenceUrls: params.evidenceUrls || [],
        assetRentalId: params.assetRentalId,
        usageReportId: params.usageReportId,
        notes: params.notes,
        metadata: params.metadata,
        createdBy: params.createdBy,
      },
    });

    // Actualizar balance de la cuenta con valor calculado
    await prisma.clientAccount.update({
      where: { id: params.accountId },
      data: {
        balance: new Decimal(balanceAfter),
        totalConsumed: newTotalConsumed
          ? new Decimal(newTotalConsumed)
          : undefined,
      },
    });

    // Si es cargo de contrato, actualizar totalConsumed del contrato
    if (params.contractId && params.amount < 0) {
      const contract = await prisma.rentalContract.findUnique({
        where: { id: params.contractId },
        select: { totalConsumed: true },
      });

      if (contract) {
        const newContractConsumed =
          Number(contract.totalConsumed) + Math.abs(params.amount);

        // Validar límite
        const MAX_DECIMAL_VALUE = 9999999999999.99;
        if (newContractConsumed > MAX_DECIMAL_VALUE) {
          throw new Error(
            `El total consumido del contrato excedería el límite máximo`,
          );
        }

        await prisma.rentalContract.update({
          where: { id: params.contractId },
          data: {
            totalConsumed: new Decimal(newContractConsumed),
          },
        });
      }
    }

    // Verificar alertas
    await this.checkAlerts(params.accountId);

    return movement;
  }

  /**
   * Verificar si el balance está bajo el límite de alerta
   */
  async checkAlerts(accountId: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      include: {
        client: true,
      },
    });

    if (!account) return;

    const balance = Number(account.balance);
    const alertAmount = Number(account.alertAmount);

    // Si el balance está por debajo del monto de alerta y no se ha alertado
    if (balance <= alertAmount && !account.alertTriggered) {
      // Obtener businessUnitId del cliente para timezone
      const clientBU = await prisma.clientBusinessUnit.findFirst({
        where: { clientId: account.clientId },
        select: { businessUnitId: true },
      });

      const alertTimestamp = clientBU
        ? await nowInBUTimezone(clientBU.businessUnitId)
        : new Date();

      await prisma.clientAccount.update({
        where: { id: accountId },
        data: {
          alertTriggered: true,
          lastAlertSent: alertTimestamp,
        },
      });

      // TODO: Enviar notificación a usuarios internos
      // await notificationService.sendLowBalanceAlert(account);
    }
  }

  /**
   * Obtener estado de cuenta (historial de movimientos)
   */
  async getAccountStatement(
    accountId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {
      clientAccountId: accountId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const movements = await prisma.rentalAccountMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        contract: true,
        assetRental: {
          include: {
            asset: true,
          },
        },
        usage: true,
      },
    });

    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      include: {
        client: true,
      },
    });

    return {
      account,
      movements,
      summary: {
        currentBalance: account?.balance,
        totalConsumed: account?.totalConsumed,
        totalReloaded: account?.totalReloaded,
        period: {
          startDate: startDate || movements[movements.length - 1]?.createdAt,
          endDate: endDate || movements[0]?.createdAt,
        },
      },
    };
  }

  /**
   * Obtener balance consolidado por cliente
   */
  async getClientBalance(clientId: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { clientId },
      include: {
        client: true,
      },
    });

    if (!account) {
      return {
        hasAccount: false,
        balance: 0,
        totalConsumed: 0,
        totalReloaded: 0,
      };
    }

    // Contratos activos
    const activeContracts = await prisma.rentalContract.count({
      where: {
        clientAccountId: account.id,
        status: "active",
      },
    });

    // Assets rentados actualmente
    const activeRentals = await prisma.assetRental.count({
      where: {
        contract: {
          clientAccountId: account.id,
        },
        actualReturnDate: null, // Aún no devuelto
      },
    });

    return {
      hasAccount: true,
      accountId: account.id,
      balance: Number(account.balance),
      totalConsumed: Number(account.totalConsumed),
      totalReloaded: Number(account.totalReloaded),
      activeContracts,
      activeRentals,
      alertAmount: Number(account.alertAmount),
      alertTriggered: account.alertTriggered,
      statementFrequency: account.statementFrequency,
    };
  }

  /**
   * Listar todas las cuentas del tenant/businessUnit
   */
  async listAccounts(params: {
    tenantId: string;
    businessUnitId?: string;
    search?: string;
    status?: "active" | "inactive" | "alert";
    page?: number;
    limit?: number;
  }) {
    const {
      tenantId,
      businessUnitId,
      search,
      status,
      page = 1,
      limit = 20,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    // Filtrar por businessUnit si se especifica
    if (businessUnitId) {
      where.client = {
        businessUnits: {
          some: {
            businessUnitId,
          },
        },
      };
    }

    // Búsqueda por nombre de cliente
    if (search) {
      where.client = {
        ...where.client,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Filtrar por estado
    if (status === "alert") {
      where.alertTriggered = true;
    } else if (status === "active") {
      where.client = {
        ...where.client,
        status: "ACTIVE",
      };
    } else if (status === "inactive") {
      where.client = {
        ...where.client,
        status: { not: "ACTIVE" },
      };
    }

    const [accounts, total] = await Promise.all([
      prisma.clientAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              rentalContracts: true,
              movements: true,
            },
          },
        },
      }),
      prisma.clientAccount.count({ where }),
    ]);

    // Calcular contratos y rentals activos para cada cuenta
    const accountsWithDetails = await Promise.all(
      accounts.map(async (account) => {
        const [activeContracts, activeRentals] = await Promise.all([
          prisma.rentalContract.count({
            where: {
              clientAccountId: account.id,
              status: "active",
            },
          }),
          prisma.assetRental.count({
            where: {
              contract: {
                clientAccountId: account.id,
              },
              actualReturnDate: null,
            },
          }),
        ]);

        return {
          id: account.id,
          clientId: account.clientId,
          clientName: account.client.displayName || account.client.name,
          clientStatus: "ACTIVE", // Status is in ClientBusinessUnit relation
          balance: Number(account.balance),
          creditLimit: Number(account.creditLimit),
          timeLimit: account.timeLimit,
          activeDays: account.activeDays,
          totalConsumed: Number(account.totalConsumed),
          totalReloaded: Number(account.totalReloaded),
          alertAmount: Number(account.alertAmount),
          alertTriggered: account.alertTriggered,
          currency: account.currency,
          activeContracts,
          activeRentals,
          totalContracts: account._count.rentalContracts,
          totalMovements: account._count.movements,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        };
      }),
    );

    return {
      data: accountsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Verificar disponibilidad de saldo y tiempo para una entrega
   */
  async checkAvailability(params: {
    clientId: string;
    items: Array<{
      assetId: string;
      estimatedDays: number;
      dailyRate: number;
    }>;
  }): Promise<{
    canDeliver: boolean;
    estimatedCost: number;
    estimatedDays: number;
    currentBalance: number;
    remainingBalance: number;
    creditLimit: number;
    currentActiveDays: number;
    remainingDays: number;
    timeLimit: number;
    error?: string;
    errorCode?: string;
    shortfall?: number;
    options?: string[];
  }> {
    // Obtener cuenta del cliente
    const account = await prisma.clientAccount.findUnique({
      where: { clientId: params.clientId },
    });

    if (!account) {
      return {
        canDeliver: false,
        estimatedCost: 0,
        estimatedDays: 0,
        currentBalance: 0,
        remainingBalance: 0,
        creditLimit: 0,
        currentActiveDays: 0,
        remainingDays: 0,
        timeLimit: 0,
        error: "El cliente no tiene cuenta de alquiler configurada",
        errorCode: "NO_ACCOUNT",
      };
    }

    // Calcular costos estimados
    const estimatedCost = params.items.reduce(
      (sum, item) => sum + item.estimatedDays * item.dailyRate,
      0,
    );

    // Calcular días máximos estimados (el mayor de todos los items)
    const estimatedDays = Math.max(
      ...params.items.map((item) => item.estimatedDays),
    );

    const currentBalance = Number(account.balance);
    const creditLimit = Number(account.creditLimit);
    const currentActiveDays = account.activeDays;
    const timeLimit = account.timeLimit;

    const remainingBalance = currentBalance - estimatedCost;
    const remainingDays = timeLimit - (currentActiveDays + estimatedDays);

    // Validar saldo
    if (currentBalance < estimatedCost) {
      const shortfall = estimatedCost - currentBalance;
      return {
        canDeliver: false,
        estimatedCost,
        estimatedDays,
        currentBalance,
        remainingBalance,
        creditLimit,
        currentActiveDays,
        remainingDays,
        timeLimit,
        error: `Saldo insuficiente. Se requiere ${estimatedCost.toFixed(2)}, disponible: ${currentBalance.toFixed(2)}`,
        errorCode: "INSUFFICIENT_BALANCE",
        shortfall,
        options: ["reload_balance", "request_limit_increase"],
      };
    }

    // Validar tiempo
    if (currentActiveDays + estimatedDays > timeLimit) {
      return {
        canDeliver: false,
        estimatedCost,
        estimatedDays,
        currentBalance,
        remainingBalance,
        creditLimit,
        currentActiveDays,
        remainingDays,
        timeLimit,
        error: `Límite de tiempo excedido. Días activos: ${currentActiveDays}, estimados: ${estimatedDays}, límite: ${timeLimit}`,
        errorCode: "TIME_LIMIT_EXCEEDED",
        options: ["request_limit_increase"],
      };
    }

    // Todo OK
    return {
      canDeliver: true,
      estimatedCost,
      estimatedDays,
      currentBalance,
      remainingBalance,
      creditLimit,
      currentActiveDays,
      remainingDays,
      timeLimit,
    };
  }

  /**
   * Actualizar límites de crédito y/o tiempo de la cuenta directamente.
   * Solo puede ser llamado por usuarios con permiso `accounts:update` (Owner, SuperAdmin, Admin con permiso).
   */
  async updateLimits(
    accountId: string,
    params: {
      creditLimit?: number;
      timeLimit?: number;
      updatedBy: string;
      reason?: string;
    },
  ) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        creditLimit: true,
        timeLimit: true,
        tenantId: true,
        clientId: true,
      },
    });

    if (!account) {
      throw new Error("Cuenta no encontrada");
    }

    const updateData: any = {};
    if (params.creditLimit !== undefined) {
      updateData.creditLimit = new Decimal(params.creditLimit);
    }
    if (params.timeLimit !== undefined) {
      updateData.timeLimit = params.timeLimit;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error(
        "Se debe especificar al menos un límite a actualizar (creditLimit o timeLimit)",
      );
    }

    const updated = await prisma.clientAccount.update({
      where: { id: accountId },
      data: updateData,
    });

    // Registrar auditoría como movimiento de nota
    await prisma.clientAccountMovement.create({
      data: {
        clientAccountId: accountId,
        movementType: "limit_update",
        amount: 0,
        balanceBefore: Number(account.creditLimit),
        balanceAfter: Number(updated.creditLimit),
        description:
          params.reason ||
          `Límites actualizados directamente por usuario autorizado`,
        metadata: {
          previousCreditLimit: Number(account.creditLimit),
          previousTimeLimit: account.timeLimit,
          newCreditLimit: params.creditLimit ?? Number(account.creditLimit),
          newTimeLimit: params.timeLimit ?? account.timeLimit,
          updatedBy: params.updatedBy,
        },
        createdBy: params.updatedBy,
      },
    });

    return updated;
  }
}

export const accountService = new AccountService();

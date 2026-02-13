/**
 * ACCOUNT SERVICE
 * Gestión de ClientAccount (cuentas de alquiler con balance compartido)
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreateAccountParams {
  tenantId: string;
  clientId: string;
  initialBalance?: number;
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
    const account = await prisma.clientAccount.create({
      data: {
        tenantId: params.tenantId,
        clientId: params.clientId,
        balance: new Decimal(params.initialBalance || 0),
        totalConsumed: new Decimal(0),
        totalReloaded: new Decimal(params.initialBalance || 0),
        alertAmount: new Decimal(params.alertAmount || 0),
        statementFrequency: params.statementFrequency,
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

    // Actualizar cuenta
    const updatedAccount = await prisma.clientAccount.update({
      where: { id: params.accountId },
      data: {
        balance: new Decimal(newBalance),
        totalReloaded: {
          increment: params.amount,
        },
        alertTriggered: false, // Reset alert
      },
    });

    // Crear movimiento
    await this.createMovement({
      accountId: params.accountId,
      movementType: "CREDIT_RELOAD",
      amount: params.amount,
      description: params.description,
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

    // Validar que no quede negativo
    if (balanceAfter < 0) {
      throw new Error(
        `Insufficient balance. Current: ${balanceBefore}, Required: ${Math.abs(params.amount)}`,
      );
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

    // Actualizar balance de la cuenta
    await prisma.clientAccount.update({
      where: { id: params.accountId },
      data: {
        balance: new Decimal(balanceAfter),
        totalConsumed:
          params.amount < 0
            ? {
                increment: Math.abs(params.amount),
              }
            : undefined,
      },
    });

    // Si es cargo de contrato, actualizar totalConsumed del contrato
    if (params.contractId && params.amount < 0) {
      await prisma.rentalContract.update({
        where: { id: params.contractId },
        data: {
          totalConsumed: {
            increment: Math.abs(params.amount),
          },
        },
      });
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
    });

    if (!account) return;

    const balance = Number(account.balance);
    const alertAmount = Number(account.alertAmount);

    // Si el balance está por debajo del monto de alerta y no se ha alertado
    if (balance <= alertAmount && !account.alertTriggered) {
      await prisma.clientAccount.update({
        where: { id: accountId },
        data: {
          alertTriggered: true,
          lastAlertSent: new Date(),
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
}

export const accountService = new AccountService();

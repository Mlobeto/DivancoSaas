/**
 * AUTO CHARGE SERVICE
 * Cron jobs para cargos automáticos y notificaciones
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import { accountService } from "./account.service";

export class AutoChargeService {
  /**
   * Cargo automático diario de HERRAMIENTAS
   * Cron: Ejecutar cada día a las 00:01
   */
  async processToolCharges() {
    console.log("[AutoCharge] Iniciando cargo diario de herramientas...");

    // Buscar todos los rentals de tipo TOOL actualmente activos
    const activeToolRentals = await prisma.assetRental.findMany({
      where: {
        trackingType: "TOOL",
        actualReturnDate: null, // Aún no devuelto
        contract: {
          status: "active",
        },
      },
      include: {
        asset: true,
        contract: {
          include: {
            clientAccount: true,
          },
        },
      },
    });

    console.log(
      `[AutoCharge] Encontrados ${activeToolRentals.length} tool rentals activos`,
    );

    const results = {
      processed: 0,
      failed: 0,
      insufficientBalance: 0,
      errors: [] as string[],
    };

    for (const rental of activeToolRentals) {
      try {
        const dailyRate = Number(rental.dailyRate || 0);

        if (dailyRate <= 0) {
          console.warn(
            `[AutoCharge] Rental ${rental.id} has no daily rate configured`,
          );
          continue;
        }

        // Verificar balance
        const currentBalance = Number(rental.contract.clientAccount.balance);
        if (currentBalance < dailyRate) {
          console.warn(
            `[AutoCharge] Insufficient balance for rental ${rental.id}. Required: ${dailyRate}, Available: ${currentBalance}`,
          );
          results.insufficientBalance++;
          // TODO: Enviar notificación
          continue;
        }

        // Actualizar AssetRental
        await prisma.assetRental.update({
          where: { id: rental.id },
          data: {
            daysElapsed: {
              increment: 1,
            },
            totalCost: {
              increment: dailyRate,
            },
            lastChargeDate: new Date(),
          },
        });

        // Descontar de ClientAccount
        await accountService.createMovement({
          accountId: rental.contract.clientAccountId,
          contractId: rental.contractId,
          movementType: "DAILY_CHARGE",
          amount: -dailyRate,
          toolCost: dailyRate,
          description: `Cargo automático diario - ${rental.asset.name} (${rental.asset.code}): $${dailyRate}/día`,
          assetRentalId: rental.id,
          metadata: {
            autoCharge: true,
            chargeDate: new Date().toISOString(),
          },
        });

        results.processed++;
        console.log(
          `[AutoCharge] ✓ Procesado rental ${rental.id}: $${dailyRate}`,
        );
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Rental ${rental.id}: ${error.message}`);
        console.error(
          `[AutoCharge] ✗ Error procesando rental ${rental.id}:`,
          error,
        );
      }
    }

    console.log("[AutoCharge] Resumen:", results);
    return results;
  }

  /**
   * Notificar operarios con reportes pendientes
   * Cron: Ejecutar cada día a las 20:00
   */
  async notifyMissingReports() {
    console.log("[AutoCharge] Verificando reportes pendientes de operarios...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar rentals de MACHINERY sin reporte del día
    const machineryWithoutReport = await prisma.assetRental.findMany({
      where: {
        trackingType: "MACHINERY",
        actualReturnDate: null,
        contract: {
          status: "active",
        },
        usageReports: {
          none: {
            date: {
              gte: today,
            },
          },
        },
      },
      include: {
        asset: true,
        contract: {
          include: {
            client: true,
          },
        },
        creator: true, // Usuario que retiró el asset (posiblemente el operario)
      },
    });

    console.log(
      `[AutoCharge] Encontrados ${machineryWithoutReport.length} reportes pendientes`,
    );

    const notifications = [];

    for (const rental of machineryWithoutReport) {
      // TODO: Integrar con sistema de notificaciones
      // await notificationService.sendMissingReportAlert({
      //   userId: rental.createdBy,
      //   assetName: rental.asset.name,
      //   contractCode: rental.contract.code,
      //   clientName: rental.contract.client.name,
      // });

      notifications.push({
        rentalId: rental.id,
        assetName: rental.asset.name,
        operatorId: rental.createdBy,
        daysWithoutReport: Math.ceil(
          (Date.now() - rental.lastChargeDate!?.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      });

      console.log(
        `[AutoCharge] Notificación pendiente: ${rental.asset.name} - Operario: ${rental.createdBy}`,
      );
    }

    return {
      total: machineryWithoutReport.length,
      notifications,
    };
  }

  /**
   * Enviar estados de cuenta programados
   * Cron: Ejecutar cada día a las 08:00
   */
  async sendScheduledStatements() {
    console.log("[AutoCharge] Verificando estados de cuenta programados...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar cuentas que necesitan envío de estado de cuenta
    const accountsToProcess = await prisma.clientAccount.findMany({
      where: {
        statementFrequency: {
          not: null,
        },
        OR: [
          {
            nextStatementDue: {
              lte: today,
            },
          },
          {
            nextStatementDue: null,
            lastStatementSent: null,
          },
        ],
      },
      include: {
        client: true,
      },
    });

    console.log(
      `[AutoCharge] Encontradas ${accountsToProcess.length} cuentas para envío de estado`,
    );

    const results = {
      sent: 0,
      failed: 0,
    };

    for (const account of accountsToProcess) {
      try {
        // Calcular próxima fecha según frecuencia
        const nextDue = this.calculateNextStatementDue(
          account.statementFrequency!,
        );

        // TODO: Generar y enviar PDF del estado de cuenta
        // const statement = await accountService.getAccountStatement(account.id);
        // await emailService.sendStatement(account.client.email, statement);

        // Actualizar cuenta
        await prisma.clientAccount.update({
          where: { id: account.id },
          data: {
            lastStatementSent: new Date(),
            nextStatementDue: nextDue,
          },
        });

        results.sent++;
        console.log(
          `[AutoCharge] ✓ Estado de cuenta enviado a ${account.client.name}`,
        );
      } catch (error: any) {
        results.failed++;
        console.error(
          `[AutoCharge] ✗ Error enviando estado a ${account.client.name}:`,
          error,
        );
      }
    }

    console.log("[AutoCharge] Resumen de envíos:", results);
    return results;
  }

  /**
   * Verificar y enviar alertas de saldo bajo
   * Cron: Ejecutar cada hora
   */
  async checkLowBalanceAlerts() {
    console.log("[AutoCharge] Verificando alertas de saldo bajo...");

    const accountsWithLowBalance = await prisma.clientAccount.findMany({
      where: {
        balance: {
          lte: prisma.clientAccount.fields.alertAmount,
        },
        alertTriggered: false,
      },
      include: {
        client: true,
      },
    });

    console.log(
      `[AutoCharge] Encontradas ${accountsWithLowBalance.length} cuentas con saldo bajo`,
    );

    for (const account of accountsWithLowBalance) {
      // TODO: Enviar notificación a usuarios internos
      // await notificationService.sendLowBalanceAlert({
      //   clientName: account.client.name,
      //   currentBalance: Number(account.balance),
      //   alertAmount: Number(account.alertAmount),
      // });

      await prisma.clientAccount.update({
        where: { id: account.id },
        data: {
          alertTriggered: true,
          lastAlertSent: new Date(),
        },
      });

      console.log(
        `[AutoCharge] ✓ Alerta enviada: ${account.client.name} - Balance: $${account.balance}`,
      );
    }

    return {
      alertsSent: accountsWithLowBalance.length,
    };
  }

  /**
   * Calcular próxima fecha de estado de cuenta
   */
  private calculateNextStatementDue(frequency: string): Date {
    const next = new Date();

    switch (frequency) {
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "biweekly":
        next.setDate(next.getDate() + 14);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1); // Default monthly
    }

    return next;
  }

  /**
   * Proyectar consumo futuro de un contrato
   */
  async projectConsumption(contractId: string, days: number = 30) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        clientAccount: true,
        activeRentals: {
          where: {
            actualReturnDate: null,
          },
          include: {
            asset: {
              include: {
                rentalProfile: true, // Extensión opcional para vertical rental
              },
            },
            usageReports: {
              orderBy: { date: "desc" },
              take: 7, // Últimos 7 días
            },
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    let estimatedDailyCost = 0;

    for (const rental of contract.activeRentals) {
      if (rental.trackingType === "TOOL") {
        // Herramientas: Costo fijo por día
        estimatedDailyCost += Number(rental.dailyRate || 0);
      } else if (rental.trackingType === "MACHINERY") {
        // Maquinaria: Promedio de últimos reportes
        if (rental.usageReports.length > 0) {
          const avgDailyCost =
            rental.usageReports.reduce(
              (sum, r) => sum + Number(r.totalCost || 0),
              0,
            ) / rental.usageReports.length;
          estimatedDailyCost += avgDailyCost;
        } else {
          // Sin reportes: Usar standby + operario con fallback
          const minDailyHoursValue =
            rental.asset.rentalProfile?.minDailyHours ||
            rental.asset.minDailyHours;
          const standby = Number(minDailyHoursValue || 0);
          const machineryCost = standby * Number(rental.hourlyRate || 0);
          const operatorCost =
            rental.operatorCostType === "PER_DAY"
              ? Number(rental.operatorCostRate || 0)
              : standby * Number(rental.operatorCostRate || 0);
          estimatedDailyCost += machineryCost + operatorCost;
        }
      }
    }

    const projectedConsumption = estimatedDailyCost * days;
    const currentBalance = Number(contract.clientAccount.balance);
    const projectedBalance = currentBalance - projectedConsumption;
    const daysUntilEmpty =
      estimatedDailyCost > 0
        ? Math.floor(currentBalance / estimatedDailyCost)
        : 999;

    return {
      contractId,
      currentBalance,
      estimatedDailyCost,
      projectionDays: days,
      projectedConsumption,
      projectedBalance,
      daysUntilEmpty,
      needsReload: projectedBalance < 0,
      recommendedReload: projectedBalance < 0 ? Math.abs(projectedBalance) : 0,
      activeAssets: contract.activeRentals.length,
    };
  }
}

export const autoChargeService = new AutoChargeService();

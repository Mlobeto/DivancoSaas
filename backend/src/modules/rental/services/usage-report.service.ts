/**
 * USAGE REPORT SERVICE
 * Procesamiento de reportes diarios del operario con standby y viáticos
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import { accountService } from "./account.service";

export interface ProcessUsageReportParams {
  rentalId: string;
  reportedBy: string;
  reportDate?: Date;

  // Métricas
  metricType: "HOUROMETER" | "ODOMETER" | "BOTH";

  // Horómetro
  hourometerStart?: number;
  hourometerEnd?: number;

  // Odómetro
  odometerStart?: number;
  odometerEnd?: number;

  // Evidencias (OBLIGATORIAS)
  evidenceUrls: string[];

  // Contexto
  notes?: string;
  source?: string; // "APP" | "WEB" | "API"
}

export class UsageReportService {
  /**
   * Procesar reporte diario del operario
   */
  async processUsageReport(params: ProcessUsageReportParams) {
    // 1. Validar rental (incluir asset.rentalProfile para multi-vertical)
    const rental = await prisma.assetRental.findUnique({
      where: { id: params.rentalId },
      include: {
        asset: {
          include: {
            rentalProfile: true, // Extensión opcional para vertical rental
          },
        },
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

    if (rental.trackingType !== "MACHINERY") {
      throw new Error("Usage reports are only for MACHINERY type assets");
    }

    // 2. Validar evidencias
    if (!params.evidenceUrls || params.evidenceUrls.length === 0) {
      throw new Error("Evidence photos are required for usage reports");
    }

    // 3. Calcular horas trabajadas
    const hoursWorked = params.hourometerEnd
      ? params.hourometerEnd - (params.hourometerStart || 0)
      : 0;

    if (hoursWorked < 0) {
      throw new Error("Invalid hourometer reading: end < start");
    }

    // 4. Aplicar STANDBY (mínimo garantizado) con fallback
    const asset = rental.asset;
    const minDailyHoursValue =
      asset.rentalProfile?.minDailyHours || asset.minDailyHours;
    const minDailyHours = Number(minDailyHoursValue || 0);
    const hoursBilled = Math.max(hoursWorked, minDailyHours);

    // 5. Calcular costos
    const hourlyRate = Number(rental.hourlyRate || 0);
    const machineryCost = hoursBilled * hourlyRate;

    // 6. Calcular viáticos del operario
    let operatorCost = 0;
    if (rental.operatorCostType === "PER_DAY") {
      // Obra lejos: Fijo por día (hotel, comida)
      operatorCost = Number(rental.operatorCostRate || 0);
    } else if (rental.operatorCostType === "PER_HOUR") {
      // Obra cerca: Por hora trabajada (respeta standby)
      operatorCost = hoursBilled * Number(rental.operatorCostRate || 0);
    }

    const totalCost = machineryCost + operatorCost;

    // 7. Calcular kilómetros (si aplica)
    const kmTraveled = params.odometerEnd
      ? params.odometerEnd - (params.odometerStart || 0)
      : 0;

    // 8. Crear AssetUsage
    const usage = await prisma.assetUsage.create({
      data: {
        assetId: rental.assetId,
        rentalId: rental.id,
        reportedByUserId: params.reportedBy,
        date: params.reportDate || new Date(),

        metricType: params.metricType,

        // Horómetro
        hourometerStart: params.hourometerStart
          ? new Decimal(params.hourometerStart)
          : undefined,
        hourometerEnd: params.hourometerEnd
          ? new Decimal(params.hourometerEnd)
          : undefined,
        hoursWorked: new Decimal(hoursWorked),
        hoursBilled: new Decimal(hoursBilled), // Con standby aplicado

        // Odómetro
        odometerStart: params.odometerStart
          ? new Decimal(params.odometerStart)
          : undefined,
        odometerEnd: params.odometerEnd
          ? new Decimal(params.odometerEnd)
          : undefined,
        kmTraveled: kmTraveled > 0 ? new Decimal(kmTraveled) : undefined,

        // Costos
        machineryCost: new Decimal(machineryCost),
        operatorCost: new Decimal(operatorCost),
        totalCost: new Decimal(totalCost),

        // Evidencias
        evidenceUrls: params.evidenceUrls,

        source: params.source || "APP",
        notes: params.notes,
        status: "processed",
        processedAt: new Date(),
      },
    });

    // 9. Actualizar AssetRental
    await prisma.assetRental.update({
      where: { id: rental.id },
      data: {
        currentHourometer: params.hourometerEnd
          ? new Decimal(params.hourometerEnd)
          : rental.currentHourometer,
        currentOdometer: params.odometerEnd
          ? new Decimal(params.odometerEnd)
          : rental.currentOdometer,
        totalHoursUsed: {
          increment: hoursWorked,
        },
        totalKmUsed: kmTraveled > 0 ? { increment: kmTraveled } : undefined,
        totalMachineryCost: {
          increment: machineryCost,
        },
        totalOperatorCost: {
          increment: operatorCost,
        },
        totalCost: {
          increment: totalCost,
        },
        lastChargeDate: new Date(),
      },
    });

    // 10. Descontar de ClientAccount
    const standbyNote =
      hoursBilled > hoursWorked
        ? ` ⚠️ Standby aplicado: ${hoursWorked.toFixed(2)} hrs trabajadas, ${hoursBilled.toFixed(2)} hrs facturadas`
        : "";

    const viaticosNote =
      rental.operatorCostType === "PER_DAY"
        ? ` (Viáticos: $${operatorCost.toFixed(2)}/día)`
        : ` (Viáticos: ${hoursBilled.toFixed(2)} hrs × $${Number(rental.operatorCostRate || 0).toFixed(2)})`;

    await accountService.createMovement({
      accountId: rental.contract.clientAccountId,
      contractId: rental.contractId,
      movementType: "DAILY_CHARGE",
      amount: -totalCost, // Negativo (cargo)
      machineryCost,
      operatorCost,
      description: `Cargo diario - ${asset.name} (${asset.code}): ${hoursBilled.toFixed(2)} hrs × $${hourlyRate}${viaticosNote}${standbyNote}`,
      evidenceUrls: params.evidenceUrls,
      assetRentalId: rental.id,
      usageReportId: usage.id,
      metadata: {
        hoursWorked,
        hoursBilled,
        minDailyHours,
        standbyApplied: hoursBilled > hoursWorked,
        operatorCostType: rental.operatorCostType,
        kmTraveled,
      },
      createdBy: params.reportedBy,
    });

    return {
      usage,
      charges: {
        machineryCost,
        operatorCost,
        totalCost,
      },
      metrics: {
        hoursWorked,
        hoursBilled,
        standbyApplied: hoursBilled > hoursWorked,
        kmTraveled,
      },
    };
  }

  /**
   * Obtener reportes de un rental
   */
  async getUsageReports(rentalId: string) {
    return prisma.assetUsage.findMany({
      where: { rentalId },
      orderBy: { date: "desc" },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Obtener estadísticas de uso de un asset
   */
  async getAssetUsageStats(rentalId: string) {
    const rental = await prisma.assetRental.findUnique({
      where: { id: rentalId },
      include: {
        asset: true,
        usageReports: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!rental) {
      throw new Error("Rental not found");
    }

    const reports = rental.usageReports;

    return {
      rentalId,
      assetName: rental.asset.name,
      assetCode: rental.asset.code,
      withdrawalDate: rental.withdrawalDate,
      returnDate: rental.actualReturnDate,
      daysActive: rental.actualReturnDate
        ? Math.ceil(
            (rental.actualReturnDate.getTime() -
              rental.withdrawalDate.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : Math.ceil(
            (Date.now() - rental.withdrawalDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
      totalReports: reports.length,
      totalHoursWorked: reports.reduce(
        (sum, r) => sum + Number(r.hoursWorked || 0),
        0,
      ),
      totalHoursBilled: reports.reduce(
        (sum, r) => sum + Number(r.hoursBilled || 0),
        0,
      ),
      totalKm: Number(rental.totalKmUsed || 0),
      totalMachineryCost: Number(rental.totalMachineryCost || 0),
      totalOperatorCost: Number(rental.totalOperatorCost || 0),
      totalCost: Number(rental.totalCost || 0),
      averageHoursPerDay:
        reports.length > 0
          ? reports.reduce((sum, r) => sum + Number(r.hoursWorked || 0), 0) /
            reports.length
          : 0,
      standbyApplications: reports.filter(
        (r) => Number(r.hoursBilled || 0) > Number(r.hoursWorked || 0),
      ).length,
    };
  }

  /**
   * Validar reporte (para app móvil antes de enviar)
   */
  async validateUsageReport(params: ProcessUsageReportParams) {
    const rental = await prisma.assetRental.findUnique({
      where: { id: params.rentalId },
      include: {
        asset: {
          include: {
            rentalProfile: true, // Extensión opcional para vertical rental
          },
        },
      },
    });

    if (!rental) {
      return { valid: false, error: "Rental not found" };
    }

    if (rental.actualReturnDate) {
      return { valid: false, error: "Asset already returned" };
    }

    if (!params.evidenceUrls || params.evidenceUrls.length === 0) {
      return { valid: false, error: "Evidence photos are required" };
    }

    const hoursWorked = params.hourometerEnd
      ? params.hourometerEnd - (params.hourometerStart || 0)
      : 0;

    if (hoursWorked < 0) {
      return { valid: false, error: "Invalid hourometer reading" };
    }

    // Usar fallback para minDailyHours
    const minDailyHoursValue =
      rental.asset.rentalProfile?.minDailyHours || rental.asset.minDailyHours;
    const minDailyHours = Number(minDailyHoursValue || 0);
    const hoursBilled = Math.max(hoursWorked, minDailyHours);

    return {
      valid: true,
      preview: {
        hoursWorked,
        hoursBilled,
        standbyApplied: hoursBilled > hoursWorked,
        machineryCost: hoursBilled * Number(rental.hourlyRate || 0),
        operatorCost:
          rental.operatorCostType === "PER_DAY"
            ? Number(rental.operatorCostRate || 0)
            : hoursBilled * Number(rental.operatorCostRate || 0),
      },
    };
  }
}

export const usageReportService = new UsageReportService();

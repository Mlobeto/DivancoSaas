/**
 * resolveRentalRates
 *
 * Helper compartido que resuelve las tasas de facturación para un AssetRental.
 *
 * Prioridad:
 *  1. QuotationItem del contrato (precio negociado con el cliente)
 *  2. AssetRentalProfile (precio base configurado en el catálogo)
 *  3. Campos legacy del Asset (pricePerDay, pricePerHour)
 *
 * El período de facturación siempre se hereda del contrato (selectedPeriodType).
 * Aplica tanto a activos cotizados como a activos retirados sin cotización.
 */

import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@config/database";

export interface ResolvedRates {
  periodType: string;
  quotationItemId: string | null;
  dailyRate: Decimal | undefined;
  weeklyRate: Decimal | undefined;
  monthlyRate: Decimal | undefined;
  hourlyRate: Decimal | undefined;
  operatorCostType: string | undefined;
  operatorCostRate: Decimal | undefined;
}

/**
 * Resuelve las tasas de un AssetRental dado el contrato y el asset.
 *
 * @param contractId  - ID del RentalContract (ya debe estar cargado o se busca aquí)
 * @param assetId     - ID del Asset a retirar
 * @param contract    - Objeto contrato pre-cargado (opcional, evita un query extra)
 * @param asset       - Objeto asset pre-cargado con rentalProfile (opcional)
 */
export async function resolveRentalRates(params: {
  contractId: string;
  assetId: string;
  contract?: {
    selectedPeriodType?: string | null;
    quotationId?: string | null;
    quotation?: {
      selectedPeriodType?: string | null;
      items?: Array<{
        id: string;
        assetId?: string | null;
        pricePerDay?: any;
        pricePerWeek?: any;
        pricePerMonth?: any;
      }>;
    } | null;
  } | null;
  asset?: {
    pricePerHour?: any;
    pricePerDay?: any;
    operatorCostType?: string | null;
    operatorCostRate?: any;
    rentalProfile?: {
      pricePerHour?: any;
      pricePerDay?: any;
      pricePerWeek?: any;
      pricePerMonth?: any;
      operatorCostType?: string | null;
      operatorCostRate?: any;
    } | null;
  } | null;
}): Promise<ResolvedRates> {
  const { contractId, assetId } = params;

  // ── 1. Obtener contrato si no se pasó pre-cargado ─────────────────────────
  let contract = params.contract;
  if (!contract) {
    contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: {
        selectedPeriodType: true,
        quotationId: true,
        quotation: {
          select: {
            selectedPeriodType: true,
            items: {
              where: { assetId },
              select: {
                id: true,
                assetId: true,
                pricePerDay: true,
                pricePerWeek: true,
                pricePerMonth: true,
              },
            },
          },
        },
      },
    });
  }

  // ── 2. Obtener asset si no se pasó pre-cargado ───────────────────────────
  let asset = params.asset;
  if (!asset) {
    asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        pricePerHour: true,
        pricePerDay: true,
        operatorCostType: true,
        operatorCostRate: true,
        rentalProfile: {
          select: {
            pricePerHour: true,
            pricePerDay: true,
            pricePerWeek: true,
            pricePerMonth: true,
            operatorCostType: true,
            operatorCostRate: true,
          },
        },
      },
    });
  }

  // ── 3. Resolver período ───────────────────────────────────────────────────
  const periodType =
    (contract as any)?.selectedPeriodType ||
    (contract as any)?.quotation?.selectedPeriodType ||
    "daily";

  // ── 4. Buscar QuotationItem para este asset ───────────────────────────────
  const quotationItem = (contract as any)?.quotation?.items?.[0] ?? null;
  const quotationItemId: string | null = quotationItem?.id ?? null;

  // ── 5. Resolver rates: QuotationItem > AssetRentalProfile > Asset legacy ──
  function toDecimal(val: any): Decimal | undefined {
    if (val == null) return undefined;
    const n = Number(val);
    if (isNaN(n) || n <= 0) return undefined;
    return new Decimal(n);
  }

  const profile = asset?.rentalProfile;

  const dailyRate: Decimal | undefined =
    toDecimal(quotationItem?.pricePerDay) ??
    toDecimal(profile?.pricePerDay) ??
    toDecimal(asset?.pricePerDay);

  const weeklyRate: Decimal | undefined =
    toDecimal(quotationItem?.pricePerWeek) ?? toDecimal(profile?.pricePerWeek);

  const monthlyRate: Decimal | undefined =
    toDecimal(quotationItem?.pricePerMonth) ??
    toDecimal(profile?.pricePerMonth);

  const hourlyRate: Decimal | undefined =
    toDecimal(profile?.pricePerHour) ?? toDecimal(asset?.pricePerHour);

  const operatorCostType: string | undefined =
    profile?.operatorCostType ?? asset?.operatorCostType ?? undefined;

  const operatorCostRate: Decimal | undefined =
    toDecimal(profile?.operatorCostRate) ?? toDecimal(asset?.operatorCostRate);

  return {
    periodType,
    quotationItemId,
    dailyRate,
    weeklyRate,
    monthlyRate,
    hourlyRate,
    operatorCostType,
    operatorCostRate,
  };
}

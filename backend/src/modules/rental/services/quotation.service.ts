/**
 * QUOTATION SERVICE
 * Servicio para gestión de cotizaciones con firma digital
 */

import prisma from "@config/database";
import { templateService } from "@shared/templates/template.service";
import { digitalSignatureResolver } from "@integrations/adapters/digital-signature/digital-signature.resolver";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import {
  SignerInfo,
  SignatureRequest,
} from "@core/contracts/digital-signature.provider";
import { Decimal } from "@prisma/client/runtime/library";
import {
  nowInBUTimezone,
  parseDateInBUTimezone,
  addDaysInBUTimezone,
} from "@core/utils/timezone-utils";

export interface CreateQuotationParams {
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  assignedUserId?: string;
  validUntil: Date;

  // Tipo de cotización (v4.0)
  quotationType?: "time_based" | "service_based";
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  estimatedDays?: number;
  serviceDescription?: string;

  items: QuotationItemInput[];
  taxRate?: number;
  currency?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
}

export interface QuotationItemInput {
  assetId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice?: number; // Opcional si se usa auto-cálculo
  rentalDays?: number;
  rentalStartDate?: Date;
  rentalEndDate?: Date;

  // v4.0: Nuevos campos
  rentalPeriodType?: "hourly" | "daily" | "weekly" | "monthly";
  standbyHours?: number; // Horas mínimas garantizadas (MACHINERY)
  operatorIncluded?: boolean; // Si incluir operador en el cálculo
  operatorCostType?: "PER_DAY" | "PER_HOUR"; // Tipo de viáticos

  // v5.0: Multi-period selection
  selectedPeriods?: { daily: boolean; weekly: boolean; monthly: boolean };

  // Override manual
  customUnitPrice?: number; // Override manual del precio unitario
  customOperatorCost?: number; // Override manual del costo del operador

  // Costos adicionales personalizados
  transportCost?: number; // Costo de transporte
  otherCosts?: number; // Otros costos personalizados
  otherCostsDescription?: string; // Descripción de otros costos

  // Desglose detallado (opcional)
  basePrice?: number;
  operatorCostAmount?: number;
  maintenanceCost?: number;
  discount?: number;
  discountReason?: string;
}

export class QuotationService {
  /**
   * Calcular precios en TODAS las modalidades (día/semana/mes)
   * v5.0 - Multi-period pricing
   */
  private async calculateItemPrice(
    tenantId: string,
    businessUnitId: string,
    item: QuotationItemInput,
  ): Promise<{
    // Precios legacy (deprecados, mantener por compatibilidad)
    unitPrice: number;
    calculatedUnitPrice: number;
    operatorCost: number;
    calculatedOperatorCost: number;
    priceOverridden: boolean;
    operatorIncluded: boolean;
    // Nuevos: Precios multi-período
    pricePerDay: number | null;
    totalPerDay: number | null;
    pricePerWeek: number | null;
    totalPerWeek: number | null;
    pricePerMonth: number | null;
    totalPerMonth: number | null;
    operatorCostPerDay: number | null;
    operatorCostPerWeek: number | null;
    operatorCostPerMonth: number | null;
  }> {
    // Si no hay assetId, usar precio manual (service-based)
    if (!item.assetId) {
      const manualPrice = item.customUnitPrice || item.unitPrice || 0;
      return {
        unitPrice: manualPrice,
        calculatedUnitPrice: 0,
        operatorCost: 0,
        calculatedOperatorCost: 0,
        priceOverridden: false,
        operatorIncluded: false,
        pricePerDay: null,
        totalPerDay: null,
        pricePerWeek: null,
        totalPerWeek: null,
        pricePerMonth: null,
        totalPerMonth: null,
        operatorCostPerDay: null,
        operatorCostPerWeek: null,
        operatorCostPerMonth: null,
      };
    }

    // Obtener asset con precios
    const asset = await prisma.asset.findFirst({
      where: { id: item.assetId, tenantId, businessUnitId },
      include: { rentalProfile: true },
    });

    if (!asset) {
      throw new Error(`Asset ${item.assetId} not found`);
    }

    const trackingType =
      asset.rentalProfile?.trackingType || asset.trackingType;
    const estimatedDays = item.rentalDays || 1;

    // Inicializar precios multi-período
    let pricePerDay = 0;
    let pricePerWeek = 0;
    let pricePerMonth = 0;
    let operatorPerDay = 0;
    let operatorPerWeek = 0;
    let operatorPerMonth = 0;

    if (trackingType === "MACHINERY") {
      // MACHINERY: precio por hora con STANDBY
      const pricePerHourValue =
        asset.rentalProfile?.pricePerHour || asset.pricePerHour;

      if (!pricePerHourValue) {
        throw new Error(
          `Asset ${asset.code} does not have pricePerHour configured`,
        );
      }

      const minDailyHoursValue =
        asset.rentalProfile?.minDailyHours || asset.minDailyHours;
      const standbyHours: number =
        item.standbyHours !== undefined
          ? item.standbyHours
          : minDailyHoursValue
            ? Number(minDailyHoursValue)
            : 8;

      const pricePerHour = Number(pricePerHourValue);

      // Calcular precio por DÍA (1 día = standbyHours * pricePerHour)
      pricePerDay = standbyHours * pricePerHour;

      // Calcular precio por SEMANA (7 días)
      pricePerWeek = 7 * pricePerDay;

      // Calcular precio por MES (30 días)
      pricePerMonth = 30 * pricePerDay;

      // Calcular costos del operador si se incluye
      const operatorCostRateValue =
        asset.rentalProfile?.operatorCostRate || asset.operatorCostRate;
      if (item.operatorIncluded && operatorCostRateValue) {
        const operatorRate = Number(operatorCostRateValue);
        const operatorCostTypeValue =
          asset.rentalProfile?.operatorCostType || asset.operatorCostType;
        const costType = item.operatorCostType || operatorCostTypeValue;

        if (costType === "PER_HOUR") {
          operatorPerDay = standbyHours * operatorRate;
          operatorPerWeek = 7 * operatorPerDay;
          operatorPerMonth = 30 * operatorPerDay;
        } else if (costType === "PER_DAY") {
          operatorPerDay = operatorRate;
          operatorPerWeek = 7 * operatorRate;
          operatorPerMonth = 30 * operatorRate;
        }
      }
    } else if (trackingType === "TOOL") {
      // TOOL: usar precios configurados en el asset
      const pricePerDayValue =
        asset.rentalProfile?.pricePerDay || asset.pricePerDay;
      const pricePerWeekValue =
        asset.rentalProfile?.pricePerWeek || asset.pricePerWeek;
      const pricePerMonthValue =
        asset.rentalProfile?.pricePerMonth || asset.pricePerMonth;

      if (!pricePerDayValue && !pricePerWeekValue && !pricePerMonthValue) {
        throw new Error(`Asset ${asset.code} does not have pricing configured`);
      }

      // Usar precios directos del asset
      pricePerDay = pricePerDayValue ? Number(pricePerDayValue) : 0;
      pricePerWeek = pricePerWeekValue ? Number(pricePerWeekValue) : 0;
      pricePerMonth = pricePerMonthValue ? Number(pricePerMonthValue) : 0;

      // Si falta algún precio, calcularlo proporcionalmente
      if (!pricePerDay && pricePerWeek) pricePerDay = pricePerWeek / 7;
      if (!pricePerDay && pricePerMonth) pricePerDay = pricePerMonth / 30;
      if (!pricePerWeek && pricePerDay) pricePerWeek = pricePerDay * 7;
      if (!pricePerMonth && pricePerDay) pricePerMonth = pricePerDay * 30;

      // TOOL no incluye operador por defecto
      operatorPerDay = 0;
      operatorPerWeek = 0;
      operatorPerMonth = 0;
    }

    // Calcular totales por período (precio + operador) * tiempo estimado
    const totalPerDay = (pricePerDay + operatorPerDay) * estimatedDays;
    const totalPerWeek =
      (pricePerWeek + operatorPerWeek) * Math.ceil(estimatedDays / 7);
    const totalPerMonth =
      (pricePerMonth + operatorPerMonth) * Math.ceil(estimatedDays / 30);

    // Legacy: calcular unitPrice/operatorCost para compatibilidad (usar diario por defecto)
    const legacyUnitPrice = totalPerDay;
    const legacyOperatorCost = operatorPerDay * estimatedDays;

    // Aplicar custom prices si existen
    const hasCustomPrice = item.customUnitPrice !== undefined;
    const finalUnitPrice = hasCustomPrice
      ? item.customUnitPrice!
      : legacyUnitPrice;

    return {
      // Legacy (compatibilidad)
      unitPrice: finalUnitPrice,
      calculatedUnitPrice: legacyUnitPrice,
      operatorCost: legacyOperatorCost,
      calculatedOperatorCost: legacyOperatorCost,
      priceOverridden: hasCustomPrice,
      operatorIncluded: item.operatorIncluded || false,

      // Multi-período (nuevos)
      pricePerDay: pricePerDay > 0 ? pricePerDay : null,
      totalPerDay: totalPerDay > 0 ? totalPerDay : null,
      pricePerWeek: pricePerWeek > 0 ? pricePerWeek : null,
      totalPerWeek: totalPerWeek > 0 ? totalPerWeek : null,
      pricePerMonth: pricePerMonth > 0 ? pricePerMonth : null,
      totalPerMonth: totalPerMonth > 0 ? totalPerMonth : null,
      operatorCostPerDay: operatorPerDay > 0 ? operatorPerDay : null,
      operatorCostPerWeek: operatorPerWeek > 0 ? operatorPerWeek : null,
      operatorCostPerMonth: operatorPerMonth > 0 ? operatorPerMonth : null,
    };
  }

  /**
   * Crear cotización con auto-cálculo de precios
   */
  async createQuotation(params: CreateQuotationParams) {
    // 1. Calcular precios de cada item (con auto-cálculo si aplica)
    const itemsWithPrices = await Promise.all(
      params.items.map(async (item) => {
        const pricing = await this.calculateItemPrice(
          params.tenantId,
          params.businessUnitId,
          item,
        );
        return { ...item, ...pricing };
      }),
    );

    // 2. Calcular totales
    const subtotal = itemsWithPrices.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice + item.operatorCost),
      0,
    );
    const taxRate = params.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // 3. Generar código único
    const code = await this.generateQuotationCode(
      params.tenantId,
      params.businessUnitId,
    );

    // Resolver moneda por BU (rental settings) con fallback seguro
    let resolvedCurrency = params.currency;
    if (!resolvedCurrency) {
      const businessUnit = await prisma.businessUnit.findFirst({
        where: {
          id: params.businessUnitId,
          tenantId: params.tenantId,
        },
        select: { settings: true },
      });

      const settings = (businessUnit?.settings as any) || {};
      resolvedCurrency = settings?.rental?.defaultCurrency || "COP";
    }

    // 4. Crear cotización con precios calculados
    const quotation = await prisma.quotation.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        code,
        clientId: params.clientId,
        assignedUserId: params.assignedUserId,
        status: "draft",
        subtotal: new Decimal(subtotal),
        taxRate: new Decimal(taxRate),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        currency: resolvedCurrency,
        validUntil: params.validUntil,

        // v4.0: Tipo de cotización
        quotationType: params.quotationType || "time_based",
        estimatedStartDate: params.estimatedStartDate,
        estimatedEndDate: params.estimatedEndDate,
        estimatedDays: params.estimatedDays,
        serviceDescription: params.serviceDescription,

        notes: params.notes,
        termsAndConditions: params.termsAndConditions,
        createdBy: params.createdBy,
        items: {
          create: itemsWithPrices.map((item, index) => ({
            assetId: item.assetId,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal(
              item.quantity * (item.unitPrice + item.operatorCost),
            ),
            calculatedUnitPrice:
              item.calculatedUnitPrice > 0
                ? new Decimal(item.calculatedUnitPrice)
                : null,
            priceOverridden: item.priceOverridden,
            operatorIncluded: item.operatorIncluded,
            operatorCost:
              item.operatorCost > 0 ? new Decimal(item.operatorCost) : null,
            calculatedOperatorCost:
              item.calculatedOperatorCost > 0
                ? new Decimal(item.calculatedOperatorCost)
                : null,
            rentalDays: item.rentalDays,
            rentalStartDate: item.rentalStartDate || null,
            rentalEndDate: item.rentalEndDate || null,

            // v4.0: Nuevos campos legacy
            rentalPeriodType: item.rentalPeriodType,
            standbyHours: item.standbyHours
              ? new Decimal(item.standbyHours)
              : null,
            operatorCostType: item.operatorCostType,
            basePrice: item.basePrice ? new Decimal(item.basePrice) : null,
            operatorCostAmount: item.operatorCostAmount
              ? new Decimal(item.operatorCostAmount)
              : null,
            maintenanceCost: item.maintenanceCost
              ? new Decimal(item.maintenanceCost)
              : null,
            discount: item.discount ? new Decimal(item.discount) : null,
            discountReason: item.discountReason,

            // Costos adicionales personalizados
            transportCost: item.transportCost
              ? new Decimal(item.transportCost)
              : null,
            otherCosts: item.otherCosts ? new Decimal(item.otherCosts) : null,
            otherCostsDescription: item.otherCostsDescription,

            // v5.0: Multi-period pricing
            pricePerDay: item.pricePerDay
              ? new Decimal(item.pricePerDay)
              : null,
            totalPerDay: item.totalPerDay
              ? new Decimal(item.totalPerDay)
              : null,
            pricePerWeek: item.pricePerWeek
              ? new Decimal(item.pricePerWeek)
              : null,
            totalPerWeek: item.totalPerWeek
              ? new Decimal(item.totalPerWeek)
              : null,
            pricePerMonth: item.pricePerMonth
              ? new Decimal(item.pricePerMonth)
              : null,
            totalPerMonth: item.totalPerMonth
              ? new Decimal(item.totalPerMonth)
              : null,
            operatorCostPerDay: item.operatorCostPerDay
              ? new Decimal(item.operatorCostPerDay)
              : null,
            operatorCostPerWeek: item.operatorCostPerWeek
              ? new Decimal(item.operatorCostPerWeek)
              : null,
            operatorCostPerMonth: item.operatorCostPerMonth
              ? new Decimal(item.operatorCostPerMonth)
              : null,

            // v5.0: Selected periods (guardar como JSON string)
            selectedPeriods: item.selectedPeriods
              ? JSON.stringify(item.selectedPeriods)
              : null,

            sortOrder: index,
          })),
        },
      },
      include: {
        items: {
          include: {
            asset: true,
          },
        },
        client: true,
        assignedUser: true,
      },
    });

    return quotation;
  }

  /**
   * Actualizar cotización completa (campos + items).
   * Solo se permite si el status no es "paid" ni "cancelled".
   * Si estaba en estado distinto a "draft", vuelve a "draft" y limpia el PDF
   * para que se regenere y reenvíe.
   */
  async updateQuotation(
    quotationId: string,
    params: Partial<CreateQuotationParams> & { updatedBy?: string },
  ) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) throw new Error(`Cotización ${quotationId} no encontrada`);
    if (["paid", "cancelled"].includes(quotation.status)) {
      throw new Error(
        `No se puede editar una cotización en estado "${quotation.status}"`,
      );
    }

    // Recalcular precios de los items nuevos
    const itemsWithPrices = await Promise.all(
      (params.items || []).map(async (item) => {
        const pricing = await this.calculateItemPrice(
          quotation.tenantId,
          quotation.businessUnitId,
          item,
        );
        return { ...item, ...pricing };
      }),
    );

    const subtotal = itemsWithPrices.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice + item.operatorCost),
      0,
    );
    const taxRate =
      params.taxRate !== undefined ? params.taxRate : Number(quotation.taxRate);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Calcular validUntil si viene validityDays
    let validUntil = params.validUntil || quotation.validUntil;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Eliminar items actuales
      await tx.quotationItem.deleteMany({ where: { quotationId } });

      // 2. Actualizar cabecera y crear los nuevos items
      return tx.quotation.update({
        where: { id: quotationId },
        data: {
          // Volver a draft si estaba en otro estado (necesita re-enviarse)
          status: "draft",
          // Limpiar PDF ya que el contenido cambió
          pdfUrl: null,

          clientId: params.clientId ?? quotation.clientId,
          validUntil,
          subtotal: new Decimal(subtotal),
          taxRate: new Decimal(taxRate),
          taxAmount: new Decimal(taxAmount),
          totalAmount: new Decimal(totalAmount),

          quotationType:
            params.quotationType ?? (quotation.quotationType as any),
          estimatedStartDate:
            params.estimatedStartDate !== undefined
              ? params.estimatedStartDate
              : quotation.estimatedStartDate,
          estimatedEndDate:
            params.estimatedEndDate !== undefined
              ? params.estimatedEndDate
              : quotation.estimatedEndDate,
          estimatedDays:
            params.estimatedDays !== undefined
              ? params.estimatedDays
              : quotation.estimatedDays,
          serviceDescription:
            params.serviceDescription !== undefined
              ? params.serviceDescription
              : quotation.serviceDescription,

          notes: params.notes !== undefined ? params.notes : quotation.notes,
          termsAndConditions:
            params.termsAndConditions !== undefined
              ? params.termsAndConditions
              : quotation.termsAndConditions,

          metadata: {
            ...((quotation.metadata as any) || {}),
            lastUpdatedBy: params.updatedBy,
            lastUpdatedAt: (
              await nowInBUTimezone(quotation.businessUnitId)
            ).toISOString(),
          },

          items: {
            create: itemsWithPrices.map((item, index) => ({
              assetId: item.assetId,
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice),
              total: new Decimal(
                item.quantity * (item.unitPrice + item.operatorCost),
              ),
              calculatedUnitPrice:
                item.calculatedUnitPrice > 0
                  ? new Decimal(item.calculatedUnitPrice)
                  : null,
              priceOverridden: item.priceOverridden,
              operatorIncluded: item.operatorIncluded,
              operatorCost:
                item.operatorCost > 0 ? new Decimal(item.operatorCost) : null,
              calculatedOperatorCost:
                item.calculatedOperatorCost > 0
                  ? new Decimal(item.calculatedOperatorCost)
                  : null,
              rentalDays: item.rentalDays,
              rentalStartDate: item.rentalStartDate || null,
              rentalEndDate: item.rentalEndDate || null,
              rentalPeriodType: item.rentalPeriodType,
              standbyHours: item.standbyHours
                ? new Decimal(item.standbyHours)
                : null,
              operatorCostType: item.operatorCostType,
              basePrice: item.basePrice ? new Decimal(item.basePrice) : null,
              operatorCostAmount: item.operatorCostAmount
                ? new Decimal(item.operatorCostAmount)
                : null,
              maintenanceCost: item.maintenanceCost
                ? new Decimal(item.maintenanceCost)
                : null,
              discount: item.discount ? new Decimal(item.discount) : null,
              discountReason: item.discountReason,

              // Costos adicionales personalizados
              transportCost: item.transportCost
                ? new Decimal(item.transportCost)
                : null,
              otherCosts: item.otherCosts ? new Decimal(item.otherCosts) : null,
              otherCostsDescription: item.otherCostsDescription,

              // v5.0: Multi-period pricing
              pricePerDay: item.pricePerDay
                ? new Decimal(item.pricePerDay)
                : null,
              totalPerDay: item.totalPerDay
                ? new Decimal(item.totalPerDay)
                : null,
              pricePerWeek: item.pricePerWeek
                ? new Decimal(item.pricePerWeek)
                : null,
              totalPerWeek: item.totalPerWeek
                ? new Decimal(item.totalPerWeek)
                : null,
              pricePerMonth: item.pricePerMonth
                ? new Decimal(item.pricePerMonth)
                : null,
              totalPerMonth: item.totalPerMonth
                ? new Decimal(item.totalPerMonth)
                : null,
              operatorCostPerDay: item.operatorCostPerDay
                ? new Decimal(item.operatorCostPerDay)
                : null,
              operatorCostPerWeek: item.operatorCostPerWeek
                ? new Decimal(item.operatorCostPerWeek)
                : null,
              operatorCostPerMonth: item.operatorCostPerMonth
                ? new Decimal(item.operatorCostPerMonth)
                : null,

              // v5.0: Selected periods (guardar como JSON string)
              selectedPeriods: item.selectedPeriods
                ? JSON.stringify(item.selectedPeriods)
                : null,

              sortOrder: index,
            })),
          },
        },
        include: {
          items: { include: { asset: true } },
          client: true,
          assignedUser: true,
        },
      });
    });

    return updated;
  }

  /**
   * Actualizar precios de items manualmente (override)
   */
  async updateQuotationItemPrices(
    quotationId: string,
    itemUpdates: Array<{
      itemId: string;
      customUnitPrice?: number;
      customOperatorCost?: number;
    }>,
  ) {
    // Verificar que la cotización existe y está en estado editable
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    if (quotation.status !== "draft") {
      throw new Error(
        `Cannot update prices for quotation in status ${quotation.status}`,
      );
    }

    // Actualizar cada item
    await Promise.all(
      itemUpdates.map(async (update) => {
        const item = quotation.items.find((i) => i.id === update.itemId);
        if (!item) {
          throw new Error(`Item ${update.itemId} not found in quotation`);
        }

        // Calcular nuevo precio con override
        const newUnitPrice =
          update.customUnitPrice !== undefined
            ? update.customUnitPrice
            : Number(item.unitPrice);

        const newOperatorCost =
          update.customOperatorCost !== undefined
            ? update.customOperatorCost
            : Number(item.operatorCost || 0);

        const newTotal = item.quantity * (newUnitPrice + newOperatorCost);

        // Actualizar item
        await prisma.quotationItem.update({
          where: { id: update.itemId },
          data: {
            unitPrice: new Decimal(newUnitPrice),
            operatorCost:
              newOperatorCost > 0 ? new Decimal(newOperatorCost) : null,
            total: new Decimal(newTotal),
            priceOverridden:
              update.customUnitPrice !== undefined
                ? true
                : item.priceOverridden,
          },
        });
      }),
    );

    // Recalcular totales de la cotización
    const updatedQuotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });

    if (!updatedQuotation) {
      throw new Error("Failed to fetch updated quotation");
    }

    const newSubtotal = updatedQuotation.items.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    const taxRate = Number(updatedQuotation.taxRate);
    const newTaxAmount = newSubtotal * (taxRate / 100);
    const newTotalAmount = newSubtotal + newTaxAmount;

    // Actualizar totales
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        subtotal: new Decimal(newSubtotal),
        taxAmount: new Decimal(newTaxAmount),
        totalAmount: new Decimal(newTotalAmount),
      },
    });

    // Retornar cotización actualizada
    return prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: {
            asset: true,
          },
        },
        client: true,
        assignedUser: true,
      },
    });
  }

  /**
   * Generar PDF de cotización
   * Soporta dos tipos: time_based (rental) y service_based (servicios/proyectos)
   */
  async generateQuotationPDF(quotationId: string): Promise<string> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: {
            asset: {
              include: {
                template: true, // Para obtener categoría y nombre del template
              },
            },
          },
        },
        client: true,
        businessUnit: {
          include: {
            branding: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    // Detectar tipo de cotización
    const quotationType = quotation.quotationType || "time_based";

    // Obtener plantilla activa: primero busca el tipo específico, luego el legado "quotation"
    const preferredType =
      quotationType === "service_based"
        ? "quotation_service"
        : "quotation_rental";

    let template =
      (await templateService.getActiveTemplateByType(
        quotation.businessUnitId,
        preferredType,
      )) ??
      (await templateService.getActiveTemplateByType(
        quotation.businessUnitId,
        "quotation",
      ));

    if (!template) {
      throw new Error(
        `No hay una plantilla activa de cotización para esta unidad de negocio. ` +
          `Crea una plantilla de tipo "${preferredType}" o "quotation" en Configuración → Plantillas PDF.`,
      );
    }
    const isTimeBased = quotationType === "time_based";
    const isServiceBased = quotationType === "service_based";

    // Preparar items con información detallada según tipo
    const itemsData = quotation.items.map((item) => {
      const baseItem = {
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        assetName: item.asset?.name || null,
        assetCategory: item.asset?.template?.category || null,
        priceOverridden: item.priceOverridden,
        discount: item.discount ? Number(item.discount) : null,
        discountReason: item.discountReason,
        transportCost: item.transportCost ? Number(item.transportCost) : null,
        otherCosts: item.otherCosts ? Number(item.otherCosts) : null,
        otherCostsDescription: item.otherCostsDescription || null,
      };

      // Para cotizaciones TIME_BASED: incluir detalles de rental
      if (isTimeBased) {
        return {
          ...baseItem,
          rentalDays: item.rentalDays,
          rentalStartDate: item.rentalStartDate,
          rentalEndDate: item.rentalEndDate,
          rentalPeriodType: item.rentalPeriodType, // "hourly" | "daily" | "weekly" | "monthly"
          standbyHours: item.standbyHours ? Number(item.standbyHours) : null,
          operatorIncluded: item.operatorIncluded,
          operatorCostType: item.operatorCostType, // "PER_DAY" | "PER_HOUR"
          operatorCost: item.operatorCost ? Number(item.operatorCost) : null,
          basePrice: item.basePrice ? Number(item.basePrice) : null,
          operatorCostAmount: item.operatorCostAmount
            ? Number(item.operatorCostAmount)
            : null,
          maintenanceCost: item.maintenanceCost
            ? Number(item.maintenanceCost)
            : null,
          calculatedUnitPrice: item.calculatedUnitPrice
            ? Number(item.calculatedUnitPrice)
            : null,
          calculatedOperatorCost: item.calculatedOperatorCost
            ? Number(item.calculatedOperatorCost)
            : null,

          // v5.0: Multi-period pricing
          selectedPeriods: item.selectedPeriods
            ? JSON.parse(item.selectedPeriods as string)
            : null,
          pricePerDay: item.pricePerDay ? Number(item.pricePerDay) : null,
          pricePerWeek: item.pricePerWeek ? Number(item.pricePerWeek) : null,
          pricePerMonth: item.pricePerMonth ? Number(item.pricePerMonth) : null,
          operatorCostPerDay: item.operatorCostPerDay
            ? Number(item.operatorCostPerDay)
            : null,
          operatorCostPerWeek: item.operatorCostPerWeek
            ? Number(item.operatorCostPerWeek)
            : null,
          operatorCostPerMonth: item.operatorCostPerMonth
            ? Number(item.operatorCostPerMonth)
            : null,
          totalPerDay: item.totalPerDay ? Number(item.totalPerDay) : null,
          totalPerWeek: item.totalPerWeek ? Number(item.totalPerWeek) : null,
          totalPerMonth: item.totalPerMonth ? Number(item.totalPerMonth) : null,
          assetCode: item.asset?.code || null,
          trackingType: item.asset?.trackingType || null,
        };
      }

      // Para cotizaciones SERVICE_BASED: estructura simple
      return baseItem;
    });

    // v5.0: Calcular totales por modalidad para time-based quotations
    // IMPORTANTE: Los precios de los activos YA INCLUYEN IVA, por lo que debemos descontarlo
    let totalsByPeriod = null;
    if (isTimeBased) {
      const daily = { subtotal: 0, tax: 0, total: 0, hasItems: false };
      const weekly = { subtotal: 0, tax: 0, total: 0, hasItems: false };
      const monthly = { subtotal: 0, tax: 0, total: 0, hasItems: false };

      // Divisor para descontar el IVA del precio total
      const taxDivisor = 1 + Number(quotation.taxRate) / 100;

      itemsData.forEach((item: any) => {
        // Costos adicionales por item
        const additionalCosts =
          (item.transportCost || 0) + (item.otherCosts || 0);

        if (item.selectedPeriods) {
          if (item.selectedPeriods.daily && item.totalPerDay) {
            const total =
              Number(item.totalPerDay) * item.quantity + additionalCosts;
            daily.total += total;
            daily.hasItems = true;
          }

          if (item.selectedPeriods.weekly && item.totalPerWeek) {
            const total =
              Number(item.totalPerWeek) * item.quantity + additionalCosts;
            weekly.total += total;
            weekly.hasItems = true;
          }

          if (item.selectedPeriods.monthly && item.totalPerMonth) {
            const total =
              Number(item.totalPerMonth) * item.quantity + additionalCosts;
            monthly.total += total;
            monthly.hasItems = true;
          }
        }
      });

      // Descontar IVA del total para obtener subtotal e impuesto
      daily.subtotal = daily.total / taxDivisor;
      daily.tax = daily.total - daily.subtotal;

      weekly.subtotal = weekly.total / taxDivisor;
      weekly.tax = weekly.total - weekly.subtotal;

      monthly.subtotal = monthly.total / taxDivisor;
      monthly.tax = monthly.total - monthly.subtotal;

      totalsByPeriod = { daily, weekly, monthly };
    }

    // Preparar datos para renderizado según tipo
    const templateData = {
      // Información básica
      quotationCode: quotation.code,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      quotationType: quotationType,
      isTimeBased: isTimeBased,
      isServiceBased: isServiceBased,

      // Cliente
      clientName: quotation.client.name,
      clientEmail: quotation.client.email,
      clientPhone: quotation.client.phone,

      // Campos específicos TIME_BASED
      estimatedStartDate: quotation.estimatedStartDate,
      estimatedEndDate: quotation.estimatedEndDate,
      estimatedDays: quotation.estimatedDays,

      // Campos específicos SERVICE_BASED
      serviceDescription: quotation.serviceDescription,

      // Items con detalles
      items: itemsData,
      itemCount: itemsData.length,

      // Totales (legacy, para compatibilidad)
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate),
      taxAmount: Number(quotation.taxAmount),
      totalAmount: Number(quotation.totalAmount),
      currency: quotation.currency,

      // v5.0: Totales por modalidad (solo para time-based)
      totals: totalsByPeriod,

      // Notas y términos
      notes: quotation.notes,
      termsAndConditions: quotation.termsAndConditions,

      // Logo desde BusinessUnit Branding
      logoUrl: quotation.businessUnit.branding?.logoUrl || null,

      // Información del BusinessUnit
      businessUnitName: quotation.businessUnit.name,
    };

    // Generar PDF
    const pdfBuffer = await templateService.renderAndGeneratePDF({
      templateId: template.id,
      data: templateData,
    });

    // Subir a Azure Blob Storage
    const uploadResult = await azureBlobStorageService.uploadFile({
      file: pdfBuffer,
      fileName: `${quotation.code}.pdf`,
      contentType: "application/pdf",
      folder: "quotations",
      tenantId: quotation.tenantId,
      businessUnitId: quotation.businessUnitId,
    });

    // Actualizar cotización con URL del PDF (sin SAS, se genera bajo demanda)
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        pdfUrl: uploadResult.url, // Guardamos URL base
        templateId: template.id,
      },
    });

    // Generar URL con SAS token temporal (7 días de acceso)
    const sasUrl = await azureBlobStorageService.generateSasUrl(
      uploadResult.containerName,
      uploadResult.blobName,
      60 * 24 * 7, // 7 días en minutos
    );

    return sasUrl; // Retornamos URL con SAS token
  }

  /**
   * Solicitar firma digital
   */
  async requestSignature(
    quotationId: string,
    signers: SignerInfo[],
  ): Promise<SignatureRequest> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { client: true },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    if (!quotation.pdfUrl) {
      throw new Error("PDF must be generated before requesting signature");
    }

    // Resolver proveedor de firma digital
    const signatureProvider = await digitalSignatureResolver.resolveProvider(
      quotation.businessUnitId,
    );

    // Crear solicitud de firma
    const request = await signatureProvider.createSignatureRequest({
      tenantId: quotation.tenantId,
      businessUnitId: quotation.businessUnitId,
      documentName: `Cotización ${quotation.code}`,
      documentUrl: quotation.pdfUrl,
      signers,
      message: `Por favor firme la cotización ${quotation.code}`,
      expiresInDays: 15,
      metadata: {
        quotationId: quotation.id,
        clientId: quotation.clientId,
      },
    });

    // Actualizar cotización
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        signatureRequestId: request.id,
        signatureStatus: "pending",
        signatureProvider: signatureProvider.name,
        status: "signature_pending",
      },
    });

    return request;
  }

  /**
   * Procesar webhook de firma completada
   */
  async handleSignatureCompleted(
    signatureRequestId: string,
    signedDocumentBuffer: Buffer,
  ): Promise<void> {
    const quotation = await prisma.quotation.findFirst({
      where: { signatureRequestId },
    });

    if (!quotation) {
      throw new Error(
        `Quotation with signature request ${signatureRequestId} not found`,
      );
    }

    // Subir documento firmado a Azure Blob Storage
    const uploadResult = await azureBlobStorageService.uploadFile({
      file: signedDocumentBuffer,
      fileName: `${quotation.code}-signed.pdf`,
      contentType: "application/pdf",
      folder: "quotations/signed",
      tenantId: quotation.tenantId,
      businessUnitId: quotation.businessUnitId,
    });

    // Actualizar cotización
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        signatureStatus: "signed",
        signedPdfUrl: uploadResult.url,
        signedAt: await nowInBUTimezone(quotation.businessUnitId),
        status: "signed",
      },
    });

    // TODO: Notificar al vendedor por email usando Sistema de Intenciones
  }

  /**
   * Transformar cotización en contrato después del pago
   */
  async createContractFromQuotation(quotationId: string): Promise<any> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: {
            asset: true, // Incluir info del activo
          },
        },
        client: true,
      },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    if (quotation.signatureStatus !== "signed") {
      throw new Error("Quotation must be signed before creating contract");
    }

    if (quotation.paymentStatus !== "paid") {
      throw new Error("Quotation must be paid before creating contract");
    }

    // Generar código de contrato
    const contractCode = await this.generateContractCode(
      quotation.tenantId,
      quotation.businessUnitId,
    );

    // Calcular fechas del contrato
    const startDate =
      quotation.items[0]?.rentalStartDate ||
      (await nowInBUTimezone(quotation.businessUnitId));
    const endDate =
      quotation.items[0]?.rentalEndDate ||
      (await addDaysInBUTimezone(
        await nowInBUTimezone(quotation.businessUnitId),
        30,
        quotation.businessUnitId,
      ));

    // Detectar si es un contrato de alquiler (tiene items con assetId)
    const hasRentalAssets = quotation.items.some((item) => item.assetId);

    // Usar transacción para crear todos los registros relacionados
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear QuotationContract (registro de conversión)
      const quotationContract = await tx.quotationContract.create({
        data: {
          tenantId: quotation.tenantId,
          businessUnitId: quotation.businessUnitId,
          quotationId: quotation.id,
          code: contractCode,
          status: "active",
          startDate,
          endDate,
          pdfUrl: `https://storage.divancosaas.com/${quotation.tenantId}/contracts/${contractCode}.pdf`,
          signedPdfUrl: quotation.signedPdfUrl!,
          totalAmount: quotation.totalAmount,
          currency: quotation.currency,
        },
      });

      let rentalContract = null;

      // 2. Si tiene activos de alquiler, crear RentalContract operativo
      // TODO: Migrar a nuevo sistema de RentalContract con ClientAccount
      if (hasRentalAssets) {
        // Por ahora, lanzar error indicando que debe usarse el nuevo flujo
        throw new Error(
          "Rental contracts must be created via POST /api/v1/rental/contracts with ClientAccount",
        );

        /* Código obsoleto - requiere migración
        rentalContract = await tx.rentalContract.create({
          data: {
            tenantId: quotation.tenantId,
            businessUnitId: quotation.businessUnitId,
            clientId: quotation.clientId,
            clientAccountId: '', // REQUERIDO - debe obtener/crear ClientAccount
            code: '', // REQUERIDO - debe generar código
            startDate: startDate, // REQUERIDO
            status: "ACTIVE",
            contractAssets: {
              create: quotation.items
                .filter((item) => item.assetId) // Solo items con activos
                .map((item) => ({
                  assetId: item.assetId!,
                  obra: quotation.notes || "Obra por definir",
                  estimatedStart: item.rentalStartDate || startDate,
                  estimatedEnd: item.rentalEndDate || endDate,
                  estimatedDays: item.rentalDays || null,
                  estimatedHours: null,
                  needsPostObraMaintenance: false,
                })),
            },
          },
          include: {
            contractAssets: true,
          },
        });
        */
      }

      // 3. Actualizar ubicación de los activos y emitir eventos (comentado temporalmente)
      /* Código obsoleto
      const assetIds = quotation.items
          .filter((item) => item.assetId)
          .map((item) => item.assetId!);

        // Actualizar ubicación de assets
        await tx.asset.updateMany({
          where: {
            id: { in: assetIds },
          },
          data: {
            currentLocation: quotation.notes || "En obra",
          },
        });

        // Emitir eventos de renta para cada asset (el sistema workflow procesará el cambio de estado)
        for (const assetId of assetIds) {
          await tx.assetEvent.create({
            data: {
              tenantId: quotation.tenantId,
              businessUnitId: quotation.businessUnitId,
              assetId,
              eventType: "asset.rented",
              source: "rental_contract",
              payload: {
                contractId: rentalContract.id,
                quotationId,
              },
            },
          });
        }
      */

      // 4. Actualizar estado de cotización
      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: "contract_created" },
      });

      return {
        quotationContract,
        rentalContract,
        hasRentalAssets,
      };
    });

    // TODO: Generar PDF de contrato con plantilla específica
    // TODO: Enviar notificación al cliente con contrato generado
    // TODO: Si es rental, emitir evento para iniciar seguimiento de obra

    return result;
  }

  /**
   * Listar cotizaciones con filtros
   */
  async listQuotations(filters: {
    businessUnitId: string;
    status?: string;
    clientId?: string;
    clientResponse?: string;
  }): Promise<any[]> {
    const where: any = {
      businessUnitId: filters.businessUnitId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.clientResponse) {
      where.clientResponse = filters.clientResponse;
    }

    return await prisma.quotation.findMany({
      where,
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Obtener cotización por ID
   */
  async getQuotationById(id: string): Promise<any> {
    return await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Listar contratos con filtros
   */
  async listContracts(filters: {
    businessUnitId: string;
    status?: string;
    quotationId?: string;
  }): Promise<any[]> {
    const where: any = {
      businessUnitId: filters.businessUnitId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.quotationId) {
      where.quotationId = filters.quotationId;
    }

    return await prisma.quotationContract.findMany({
      where,
      include: {
        quotation: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Obtener contrato por ID
   */
  async getContractById(id: string): Promise<any> {
    return await prisma.quotationContract.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: true,
          },
        },
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // ============================================
  // WORKFLOW: SEND / APPROVE / REJECT / CONFIRM-PAYMENT
  // ============================================

  /**
   * Enviar cotización al cliente (o solicitar aprobación si no tiene permiso).
   * Llamado por el empleado que creó la cotización.
   *
   * - Si userPermissions incluye "quotations:send" → genera PDF + envía email → status = "sent"
   * - Si no tiene permiso → status = "pending_approval" + notifica a los aprobadores
   */
  async sendOrRequestApproval(
    quotationId: string,
    actorId: string,
    userPermissions: string[],
  ): Promise<{ sent: boolean; status: string }> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        client: true,
        businessUnit: true,
        items: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!quotation) throw new Error("Cotización no encontrada");
    if (!["draft", "rejected"].includes(quotation.status)) {
      throw new Error(
        `No se puede enviar una cotización en estado "${quotation.status}"`,
      );
    }

    const canSendDirect =
      userPermissions.includes("quotations:send") ||
      userPermissions.includes("OWNER") ||
      userPermissions.includes("SUPER_ADMIN");

    // Validar política de crédito por cliente+BU (solo vertical rental)
    const isOwnerOrSuperAdmin =
      userPermissions.includes("OWNER") ||
      userPermissions.includes("SUPER_ADMIN");

    const creditValidation =
      await this.validateCreditPolicyForQuotation(quotation);

    if (creditValidation.requiresApproval && !isOwnerOrSuperAdmin) {
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: "pending_approval",
          metadata: {
            ...((quotation.metadata as any) || {}),
            approvalReason: "credit_limit_exceeded",
            creditValidation,
            requestedBy: actorId,
            requestedAt: new Date().toISOString(),
          },
        },
      });

      await this.notifyApprovers(quotation, "credit_limit_exceeded");
      return { sent: false, status: "pending_approval" };
    }

    if (canSendDirect) {
      // Generar PDF si no existe
      if (!quotation.pdfUrl) {
        await this.generateQuotationPDF(quotationId);
      }

      // Enviar email al cliente
      const { quotationEmailService } =
        await import("./quotation-email.service");
      await quotationEmailService.sendQuotationEmail(quotationId);

      // Actualizar status
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { status: "sent" },
      });

      return { sent: true, status: "sent" };
    } else {
      // Sin permiso → solicitar aprobación
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: "pending_approval",
          metadata: {
            ...((quotation.metadata as any) || {}),
            approvalReason: "permission_required",
            requestedBy: actorId,
            requestedAt: new Date().toISOString(),
          },
        },
      });

      // Notificar a aprobadores
      await this.notifyApprovers(quotation, "permission_required");

      return { sent: false, status: "pending_approval" };
    }
  }

  /**
   * Aprobar cotización (requiere quotations:approve).
   * Genera PDF si no existe y envía al cliente.
   */
  async approveAndSend(quotationId: string, approverId: string): Promise<void> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) throw new Error("Cotización no encontrada");
    if (quotation.status !== "pending_approval") {
      throw new Error(
        `Solo se pueden aprobar cotizaciones en estado "pending_approval"`,
      );
    }

    // Generar PDF si no existe
    if (!quotation.pdfUrl) {
      await this.generateQuotationPDF(quotationId);
    }

    // Enviar email al cliente
    const { quotationEmailService } = await import("./quotation-email.service");
    await quotationEmailService.sendQuotationEmail(quotationId);

    // Actualizar status
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: "sent",
        metadata: {
          ...((quotation.metadata as any) || {}),
          approvedBy: approverId,
          approvedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Rechazar cotización (requiere quotations:approve).
   * Vuelve a "draft" con motivo de rechazo.
   */
  async rejectQuotation(
    quotationId: string,
    approverId: string,
    reason: string,
  ): Promise<void> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        creator: { select: { email: true, firstName: true } },
      },
    });

    if (!quotation) throw new Error("Cotización no encontrada");
    if (quotation.status !== "pending_approval") {
      throw new Error(
        `Solo se pueden rechazar cotizaciones en estado "pending_approval"`,
      );
    }

    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: "draft",
        metadata: {
          ...((quotation.metadata as any) || {}),
          rejectedBy: approverId,
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
        },
      },
    });

    // Notificar al creador del rechazo
    if (quotation.creator?.email) {
      try {
        const { emailService } = await import("@core/services/email.service");
        await emailService.sendGenericEmail(quotation.businessUnitId, {
          to: quotation.creator.email,
          subject: `Cotización ${quotation.code} rechazada`,
          html: `
            <p>Hola ${quotation.creator.firstName},</p>
            <p>Tu cotización <strong>${quotation.code}</strong> ha sido rechazada.</p>
            <p><strong>Motivo:</strong> ${reason}</p>
            <p>Puedes editarla y volver a enviarla para aprobación.</p>
          `,
        });
      } catch (e) {
        console.error("[QuotationService] Error notificando rechazo:", e);
      }
    }
  }

  /**
   * Confirmar pago recibido por transferencia bancaria (requiere quotations:confirm-payment).
   * - Actualiza paymentStatus = "paid" y status = "paid"
   * - Crea QuotationContract automáticamente
   * - Acredita el monto en la ClientAccount del cliente
   */
  async confirmPayment(
    quotationId: string,
    actorId: string,
    paymentReference: string,
    notes?: string,
  ): Promise<{ contractId: string; accountMovementId: string }> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        client: true,
        items: { include: { asset: true } },
      },
    });

    if (!quotation) throw new Error("Cotización no encontrada");
    if (!["sent", "viewed"].includes(quotation.status)) {
      throw new Error(
        `Solo se pueden confirmar pagos en cotizaciones enviadas al cliente`,
      );
    }
    if (quotation.paymentStatus === "paid") {
      throw new Error("El pago ya fue confirmado anteriormente");
    }

    // 1. Marcar cotización como pagada
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        paymentStatus: "paid",
        paidAt: new Date(),
        status: "paid",
        metadata: {
          ...((quotation.metadata as any) || {}),
          paymentReference,
          paymentConfirmedBy: actorId,
          paymentNotes: notes,
        },
      },
    });

    // 2. Crear contrato desde la cotización
    const contractResult = await this.createContractFromQuotation(quotationId);
    const contractId = contractResult.quotationContract.id;

    // 3. Acreditar en la ClientAccount del cliente
    let movementId = "";
    try {
      // Obtener o crear cuenta de alquiler del cliente
      let account = await prisma.clientAccount.findFirst({
        where: { clientId: quotation.clientId, tenantId: quotation.tenantId },
      });

      if (!account) {
        account = await prisma.clientAccount.create({
          data: {
            tenantId: quotation.tenantId,
            clientId: quotation.clientId,
            balance: new Decimal(0),
            totalConsumed: new Decimal(0),
            totalReloaded: new Decimal(0),
            alertAmount: new Decimal(0),
          },
        });
      }

      const amount = Number(quotation.totalAmount);
      const balanceBefore = new Decimal(Number(account.balance));
      const balanceAfter = new Decimal(Number(account.balance) + amount);

      // Crear movimiento de crédito en la cuenta de alquiler
      const movement = await prisma.rentalAccountMovement.create({
        data: {
          clientAccountId: account.id,
          movementType: "PAYMENT_RECEIVED",
          amount: new Decimal(amount),
          balanceBefore,
          balanceAfter,
          description: `Pago cotización ${quotation.code} — Ref: ${paymentReference}${notes ? ` — ${notes}` : ""}`,
          createdBy: actorId,
        },
      });

      movementId = movement.id;

      // Actualizar balance de la cuenta
      await prisma.clientAccount.update({
        where: { id: account.id },
        data: {
          balance: balanceAfter,
          totalReloaded: new Decimal(Number(account.totalReloaded) + amount),
        },
      });
    } catch (e) {
      console.error("[QuotationService] Error acreditando en cuenta:", e);
    }

    return { contractId, accountMovementId: movementId };
  }

  /**
   * Notificar a usuarios con permisos de aprobación según motivo.
   */
  private async notifyApprovers(
    quotation: any,
    approvalReason: "credit_limit_exceeded" | "permission_required",
  ): Promise<void> {
    try {
      const requiredActions =
        approvalReason === "credit_limit_exceeded"
          ? ["approve", "approve-credit-limit"]
          : ["approve"];

      const roleApprovers = await prisma.userBusinessUnit.findMany({
        where: {
          businessUnitId: quotation.businessUnitId,
          role: {
            permissions: {
              some: {
                permission: {
                  resource: "quotations",
                  action: {
                    in: requiredActions,
                  },
                },
              },
            },
          },
        },
        include: {
          user: { select: { id: true, email: true, firstName: true } },
        },
      });

      const additionalApprovers = await prisma.userPermission.findMany({
        where: {
          businessUnitId: quotation.businessUnitId,
          permission: {
            resource: "quotations",
            action: {
              in: requiredActions,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
            },
          },
        },
      });

      const approversMap = new Map<
        string,
        { id: string; email: string | null; firstName: string | null }
      >();

      for (const ub of roleApprovers) {
        approversMap.set(ub.user.id, ub.user);
      }

      for (const up of additionalApprovers) {
        approversMap.set(up.user.id, up.user);
      }

      const approvers = Array.from(approversMap.values());

      const { emailService } = await import("@core/services/email.service");

      for (const approver of approvers) {
        if (!approver.email) continue;

        const approvalHint =
          approvalReason === "credit_limit_exceeded"
            ? "Motivo: excede límite de crédito del cliente."
            : "Motivo: requiere aprobación interna para envío.";

        await emailService
          .sendGenericEmail(quotation.businessUnitId, {
            to: approver.email,
            subject: `Cotización ${quotation.code} pendiente de aprobación`,
            html: `
            <p>Hola ${approver.firstName || "equipo"},</p>
            <p>La cotización <strong>${quotation.code}</strong> para el cliente 
            <strong>${quotation.client?.name || ""}</strong> está pendiente de tu aprobación.</p>
            <p><strong>${approvalHint}</strong></p>
            <p>Por favor ingresa al sistema para aprobarla o rechazarla.</p>
          `,
          })
          .catch(() => {});
      }
    } catch (e) {
      console.error("[QuotationService] Error notificando aprobadores:", e);
    }
  }

  /**
   * Valida límites de crédito para una cotización en el contexto cliente+BU.
   * Si no existe perfil o está inactivo, no bloquea el envío.
   */
  private async validateCreditPolicyForQuotation(quotation: any): Promise<{
    requiresApproval: boolean;
    hasProfile: boolean;
    exceededAmount: boolean;
    exceededDays: boolean;
    projectedAmount: number;
    projectedDays: number;
    amountLimit: number;
    daysLimit: number;
  }> {
    const profile = await prisma.rentalClientCreditProfile.findUnique({
      where: {
        tenantId_businessUnitId_clientId: {
          tenantId: quotation.tenantId,
          businessUnitId: quotation.businessUnitId,
          clientId: quotation.clientId,
        },
      },
    });

    if (!profile || !profile.isActive) {
      return {
        requiresApproval: false,
        hasProfile: false,
        exceededAmount: false,
        exceededDays: false,
        projectedAmount: Number(quotation.totalAmount || 0),
        projectedDays: Number(quotation.estimatedDays || 0),
        amountLimit: 0,
        daysLimit: 0,
      };
    }

    const projectedAmount = Number(quotation.totalAmount || 0);
    const projectedDays = Math.max(
      Number(quotation.estimatedDays || 0),
      ...(Array.isArray(quotation.items)
        ? quotation.items.map((it: any) => Number(it.rentalDays || 0))
        : [0]),
    );

    const amountLimit = Number(profile.creditLimitAmount || 0);
    const daysLimit = Number(profile.creditLimitDays || 0);

    const exceededAmount = amountLimit > 0 && projectedAmount > amountLimit;
    const exceededDays = daysLimit > 0 && projectedDays > daysLimit;

    return {
      requiresApproval:
        profile.requiresOwnerApprovalOnExceed &&
        (exceededAmount || exceededDays),
      hasProfile: true,
      exceededAmount,
      exceededDays,
      projectedAmount,
      projectedDays,
      amountLimit,
      daysLimit,
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async generateQuotationCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const year = (await nowInBUTimezone(businessUnitId)).getFullYear();
    const count = await prisma.quotation.count({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: `QU-${year}-`,
        },
      },
    });
    return `QU-${year}-${String(count + 1).padStart(3, "0")}`;
  }

  private async generateContractCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const year = (await nowInBUTimezone(businessUnitId)).getFullYear();
    const count = await prisma.quotationContract.count({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: `CON-${year}-`,
        },
      },
    });
    return `CON-${year}-${String(count + 1).padStart(3, "0")}`;
  }
}

export const quotationService = new QuotationService();

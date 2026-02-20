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

  // Override manual
  customUnitPrice?: number; // Override manual del precio unitario
  customOperatorCost?: number; // Override manual del costo del operador

  // Desglose detallado (opcional)
  basePrice?: number;
  operatorCostAmount?: number;
  maintenanceCost?: number;
  discount?: number;
  discountReason?: string;
}

export class QuotationService {
  /**
   * Calcular precio automático de un item desde el asset
   */
  private async calculateItemPrice(
    tenantId: string,
    businessUnitId: string,
    item: QuotationItemInput,
  ): Promise<{
    unitPrice: number;
    calculatedUnitPrice: number;
    operatorCost: number;
    calculatedOperatorCost: number;
    priceOverridden: boolean;
    operatorIncluded: boolean;
  }> {
    // Si no hay assetId, usar precio manual
    if (!item.assetId) {
      return {
        unitPrice: item.customUnitPrice || item.unitPrice || 0,
        calculatedUnitPrice: 0,
        operatorCost: 0,
        calculatedOperatorCost: 0,
        priceOverridden: false,
        operatorIncluded: false,
      };
    }

    // Obtener asset con precios
    const asset = await prisma.asset.findFirst({
      where: {
        id: item.assetId,
        tenantId,
        businessUnitId,
      },
    });

    if (!asset) {
      throw new Error(`Asset ${item.assetId} not found`);
    }

    // Calcular precio según trackingType y rentalDays
    let calculatedUnitPrice = 0;
    let calculatedOperatorCost = 0;

    if (asset.trackingType === "MACHINERY") {
      // MACHINERY: precio por hora con STANDBY
      if (!asset.pricePerHour) {
        throw new Error(
          `Asset ${asset.code} does not have pricePerHour configured`,
        );
      }

      const rentalDays: number = item.rentalDays || 1;

      // v4.0: Usar standbyHours del item o minDailyHours del asset como fallback
      const standbyHours: number =
        item.standbyHours !== undefined
          ? item.standbyHours
          : asset.minDailyHours
            ? Number(asset.minDailyHours)
            : 8;

      // Precio = días * standby horas * precio por hora
      const pricePerHour: number = asset.pricePerHour
        ? Number(asset.pricePerHour)
        : 0;
      calculatedUnitPrice = rentalDays * standbyHours * pricePerHour;

      // Calcular costo del operador si se incluye
      if (item.operatorIncluded && asset.operatorCostRate) {
        const operatorRate: number = Number(asset.operatorCostRate);
        // v4.0: Usar operatorCostType del item o del asset como fallback
        const costType = item.operatorCostType || asset.operatorCostType;

        if (costType === "PER_HOUR") {
          calculatedOperatorCost = rentalDays * standbyHours * operatorRate;
        } else if (costType === "PER_DAY") {
          calculatedOperatorCost = rentalDays * operatorRate;
        }
      }
    } else if (asset.trackingType === "TOOL") {
      // TOOL: precio por día/semana/mes
      const rentalDays = item.rentalDays || 1;

      if (rentalDays >= 30 && asset.pricePerMonth) {
        // Usar precio mensual
        const months = Math.ceil(rentalDays / 30);
        calculatedUnitPrice = months * Number(asset.pricePerMonth);
      } else if (rentalDays >= 7 && asset.pricePerWeek) {
        // Usar precio semanal
        const weeks = Math.ceil(rentalDays / 7);
        calculatedUnitPrice = weeks * Number(asset.pricePerWeek);
      } else if (asset.pricePerDay) {
        // Usar precio diario
        calculatedUnitPrice = rentalDays * Number(asset.pricePerDay);
      } else {
        throw new Error(`Asset ${asset.code} does not have pricing configured`);
      }

      // TOOL no incluye operador típicamente
      calculatedOperatorCost = 0;
    }

    // Determinar precio final y si fue overridden
    const hasCustomPrice = item.customUnitPrice !== undefined;
    const finalUnitPrice = hasCustomPrice
      ? item.customUnitPrice!
      : calculatedUnitPrice;

    const hasCustomOperatorCost = item.customOperatorCost !== undefined;
    const finalOperatorCost = hasCustomOperatorCost
      ? item.customOperatorCost!
      : calculatedOperatorCost;

    return {
      unitPrice: finalUnitPrice,
      calculatedUnitPrice,
      operatorCost: finalOperatorCost,
      calculatedOperatorCost,
      priceOverridden: hasCustomPrice,
      operatorIncluded: item.operatorIncluded || false,
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
        currency: params.currency || "USD",
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
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,

            // v4.0: Nuevos campos
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

    // Obtener plantilla activa
    const template = await templateService.getActiveTemplateByType(
      quotation.businessUnitId,
      "quotation",
    );

    if (!template) {
      throw new Error(
        `No active quotation template found for BU ${quotation.businessUnitId}`,
      );
    }

    // Detectar tipo de cotización
    const quotationType = quotation.quotationType || "time_based";
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
        };
      }

      // Para cotizaciones SERVICE_BASED: estructura simple
      return baseItem;
    });

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

      // Totales
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate),
      taxAmount: Number(quotation.taxAmount),
      totalAmount: Number(quotation.totalAmount),
      currency: quotation.currency,

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
        signedAt: new Date(),
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
    const startDate = quotation.items[0]?.rentalStartDate || new Date();
    const endDate =
      quotation.items[0]?.rentalEndDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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
  // PRIVATE METHODS
  // ============================================

  private async generateQuotationCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
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
    const year = new Date().getFullYear();
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

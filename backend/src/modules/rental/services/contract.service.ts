/**
 * CONTRACT SERVICE
 * Gestión de contratos de alquiler con crédito compartido
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import { accountService } from "./account.service";
import { digitalSignatureResolver } from "@integrations/adapters/digital-signature/digital-signature.resolver";
import type { SignerInfo } from "@core/contracts/digital-signature.provider";
import { brandingService } from "@core/services/branding.service";
import {
  buildDocument,
  type BrandingConfig,
  type BusinessUnitInfo,
} from "@core/services/document-builder.service";
import { nowInBUTimezone } from "@core/utils/timezone-utils";
import { resolveRentalRates } from "../utils/resolve-rental-rates";

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

/**
 * Parámetros para crear un Master Contract (v7.0)
 * Los master contracts NO tienen items específicos inicialmente
 */
export interface CreateMasterContractParams {
  tenantId: string;
  businessUnitId: string;
  clientId: string;

  // Cotización origen (opcional — si viene, hereda selectedPeriodType y precios)
  quotationId?: string;

  // Período de facturación: heredado de la cotización o elegido manualmente
  // "daily" | "weekly" | "monthly"  — default "daily" si no hay cotización
  selectedPeriodType?: string;

  startDate: Date;
  estimatedEndDate?: Date;

  // Límites acordados (pueden ser diferentes a los de la cuenta)
  agreedCreditLimit?: number; // Si no se especifica, usa el de ClientAccount
  agreedTimeLimit?: number; // Si no se especifica, usa el de ClientAccount

  // Documentación
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
    // 1. Obtener currency de BusinessUnit
    const bu = await prisma.businessUnit.findUnique({
      where: { id: params.businessUnitId },
      select: { currency: true },
    });
    const currency = bu?.currency || "USD";

    // 2. Verificar o crear ClientAccount
    let clientAccount = await prisma.clientAccount.findUnique({
      where: { clientId: params.clientId },
    });

    if (!clientAccount) {
      // Crear cuenta si no existe
      clientAccount = await accountService.createAccount({
        tenantId: params.tenantId,
        clientId: params.clientId,
        businessUnitId: params.businessUnitId,
        initialBalance: 0,
        alertAmount: 100000, // Default $100k
        statementFrequency: "monthly",
      });
    }

    // 3. Generar código único
    const code = await this.generateContractCode(
      params.tenantId,
      params.businessUnitId,
    );

    // 4. Crear contrato
    const contract = await prisma.rentalContract.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        clientId: params.clientId,
        clientAccountId: clientAccount.id,
        quotationId: params.quotationId,
        code,
        contractType: "specific", // Explicit contract type (v7.0)
        status: "active",
        startDate: params.startDate,
        estimatedEndDate: params.estimatedEndDate,
        estimatedTotal: params.estimatedTotal
          ? new Decimal(params.estimatedTotal)
          : undefined,
        currency,
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
   * Crear Master Contract (v7.0)
   * Contratos sin items específicos, que usan addendums para entregas
   */
  async createMasterContract(params: CreateMasterContractParams) {
    // 1. Obtener currency de BusinessUnit
    const bu = await prisma.businessUnit.findUnique({
      where: { id: params.businessUnitId },
      select: { currency: true },
    });
    const currency = bu?.currency || "USD";

    // 2. Verificar o crear ClientAccount
    let clientAccount = await prisma.clientAccount.findUnique({
      where: { clientId: params.clientId },
    });

    if (!clientAccount) {
      // Crear cuenta si no existe
      clientAccount = await accountService.createAccount({
        tenantId: params.tenantId,
        clientId: params.clientId,
        businessUnitId: params.businessUnitId,
        initialBalance: 0,
        alertAmount: 100000, // Default $100k
        statementFrequency: "monthly",
      });
    }

    // 3. Generar código único
    const code = await this.generateContractCode(
      params.tenantId,
      params.businessUnitId,
    );

    // 4. Determinar límites acordados
    const agreedCreditLimit =
      params.agreedCreditLimit || clientAccount.creditLimit.toNumber();
    const agreedTimeLimit = params.agreedTimeLimit || clientAccount.timeLimit;

    // 5. Heredar selectedPeriodType desde la cotización (si viene vinculada)
    let selectedPeriodType = params.selectedPeriodType || "daily";
    if (params.quotationId) {
      const quotation = await prisma.quotation.findUnique({
        where: { id: params.quotationId },
        select: { selectedPeriodType: true },
      });
      if (quotation?.selectedPeriodType) {
        selectedPeriodType = quotation.selectedPeriodType;
      }
    }

    // 6. Crear master contract
    const contract = await prisma.rentalContract.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        clientId: params.clientId,
        clientAccountId: clientAccount.id,
        quotationId: params.quotationId,
        code,

        // Master contract específicos
        contractType: "master",
        agreedAmount: agreedCreditLimit
          ? new Decimal(agreedCreditLimit)
          : clientAccount.creditLimit,
        agreedPeriod: agreedTimeLimit,
        totalActiveDays: 0,

        // Período de facturación heredado de la cotización o elegido manualmente
        selectedPeriodType,

        status: "active",
        startDate: params.startDate,
        estimatedEndDate: params.estimatedEndDate,
        currency,
        templateId: params.templateId,
        pdfUrl: params.pdfUrl,
        notes: params.notes,
        metadata: params.metadata,
        createdBy: params.createdBy,
      },
      include: {
        client: true,
        clientAccount: true,
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
        // Incluir cotización para resolver precios negociados
        quotation: {
          include: {
            items: {
              where: { assetId: params.assetId },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "active") {
      throw new Error(`Contract status is ${contract.status}, must be active`);
    }

    // 2. Validar asset (incluir rentalProfile para multi-vertical)
    const asset = await prisma.asset.findUnique({
      where: { id: params.assetId },
      include: {
        rentalProfile: true, // Extensión opcional para vertical rental
        state: true, // Estado actual del activo
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    // Bloquear retiro si el activo está pendiente de mantenimiento
    if (asset.state?.currentState === "PENDING_MAINTENANCE") {
      throw new Error(
        "El activo requiere mantenimiento post-obra antes de ser retirado nuevamente",
      );
    }

    // Determinar trackingType con fallback
    const trackingType =
      asset.rentalProfile?.trackingType || asset.trackingType;
    if (!trackingType) {
      throw new Error("Asset must have trackingType configured");
    }

    // 3. Validar balance (opcional, warning)
    const balance = Number(contract.clientAccount.balance);
    if (balance <= 0) {
      console.warn(
        `Warning: Client ${contract.clientId} has zero or negative balance`,
      );
    }

    // 4. Resolver precios según período del contrato (helper compartido con addendum)
    const rates = await resolveRentalRates({
      contractId: params.contractId,
      assetId: params.assetId,
      contract: contract as any,
      asset: asset as any,
    });

    // 5. Crear AssetRental
    const rental = await prisma.assetRental.create({
      data: {
        contractId: params.contractId,
        assetId: params.assetId,
        withdrawalDate: await nowInBUTimezone(contract.businessUnitId),
        expectedReturnDate: params.expectedReturnDate,
        trackingType: trackingType,

        // Período heredado del contrato
        periodType: rates.periodType,
        quotationItemId: rates.quotationItemId,

        // Para MACHINERY - usar rentalProfile con fallback
        hourlyRate: rates.hourlyRate,
        operatorCostType: rates.operatorCostType,
        operatorCostRate: rates.operatorCostRate,
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

        // Para TOOL - tasas por período
        dailyRate: rates.dailyRate,
        weeklyRate: rates.weeklyRate,
        monthlyRate: rates.monthlyRate,

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

    // 4. Marcar activo como pendiente de mantenimiento post-obra
    await prisma.assetState.upsert({
      where: { assetId: rental.assetId },
      create: {
        assetId: rental.assetId,
        workflowId: "default",
        currentState: "PENDING_MAINTENANCE",
      },
      update: { currentState: "PENDING_MAINTENANCE" },
    });

    await prisma.asset.update({
      where: { id: rental.assetId },
      data: { isCurrentlyRented: false, currentRentalContract: null },
    });

    await prisma.assetEvent.create({
      data: {
        tenantId: rental.contract.tenantId,
        businessUnitId: rental.contract.businessUnitId,
        assetId: rental.assetId,
        eventType: "asset.pending_maintenance",
        source: "system",
        payload: {
          rentalId: rental.id,
          returnDate: params.returnDate,
          condition: params.condition,
        },
      },
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
        actualEndDate: await nowInBUTimezone(contract.businessUnitId),
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
    const year = (await nowInBUTimezone(businessUnitId)).getFullYear();
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

  /**
   * Subir o registrar comprobante de pago
   */
  async uploadPaymentProof(
    contractId: string,
    data: {
      paymentType: string | null;
      paymentProofUrl: string | null;
      paymentDetails: any;
    },
  ) {
    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        paymentType: data.paymentType,
        paymentProofUrl: data.paymentProofUrl,
        paymentDetails: data.paymentDetails,
      },
      include: {
        client: true,
        quotation: true,
      },
    });
  }

  /**
   * Verificar comprobante de pago (admin)
   */
  async verifyPaymentProof(
    contractId: string,
    verifiedBy: string,
    notes?: string,
  ) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (!contract.paymentProofUrl && !contract.paymentType) {
      throw new Error("No payment proof to verify");
    }

    // Agregar nota de verificación a paymentDetails
    const updatedDetails = {
      ...(contract.paymentDetails as any),
      verificationNotes: notes,
      verifiedAt: new Date(),
    };

    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        paymentVerifiedBy: verifiedBy,
        paymentVerifiedAt: new Date(),
        paymentDetails: updatedDetails,
      },
      include: {
        client: true,
        quotation: true,
      },
    });
  }

  /**
   * Solicitar firma digital del contrato (SignNow)
   */
  async requestSignature(contractId: string, signers: SignerInfo[]) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        businessUnit: true,
        tenant: true,
      },
    });

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    if (!contract.pdfUrl) {
      throw new Error("PDF must be generated before requesting signature");
    }

    // Verificar que el pago esté verificado si es requerido
    if (contract.paymentType && !contract.paymentVerifiedBy) {
      throw new Error(
        "Payment proof must be verified before requesting signature",
      );
    }

    // Resolver proveedor de firma digital
    const signatureProvider = await digitalSignatureResolver.resolveProvider(
      contract.businessUnitId,
    );

    // Crear solicitud de firma
    const request = await signatureProvider.createSignatureRequest({
      tenantId: contract.tenantId,
      businessUnitId: contract.businessUnitId,
      documentName: `Contrato ${contract.code}`,
      documentUrl: contract.pdfUrl,
      signers,
      message: `Por favor firme el contrato ${contract.code}`,
      expiresInDays: 30,
      metadata: {
        contractId: contract.id,
        clientId: contract.clientId,
      },
    });

    // Actualizar contrato
    await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        signatureRequestId: request.id,
        signatureStatus: "pending",
        signatureProvider: signatureProvider.name,
      },
    });

    return request;
  }

  /**
   * Obtener estado de firma digital
   */
  async getSignatureStatus(contractId: string) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: {
        signatureRequestId: true,
        signatureStatus: true,
        signatureProvider: true,
        businessUnitId: true,
      },
    });

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    if (!contract.signatureRequestId) {
      return {
        status: "none",
        signers: [],
      };
    }

    // Resolver proveedor
    const signatureProvider = await digitalSignatureResolver.resolveProvider(
      contract.businessUnitId,
    );

    // Obtener estado desde el proveedor
    const statusInfo = await signatureProvider.getSignatureStatus(
      contract.signatureRequestId,
    );

    return {
      status: statusInfo.status,
      signers: statusInfo.signers,
      signedAt: statusInfo.signedAt,
      signedDocumentUrl: statusInfo.signedDocumentUrl,
    };
  }

  /**
   * Procesar webhook de firma completada
   */
  async handleSignatureCompleted(
    signatureRequestId: string,
    signedDocumentBuffer: Buffer,
  ): Promise<void> {
    const contract = await prisma.rentalContract.findFirst({
      where: { signatureRequestId },
    });

    if (!contract) {
      throw new Error(
        `Contract with signature request ${signatureRequestId} not found`,
      );
    }

    // Subir documento firmado a Azure Blob Storage
    const { azureBlobStorageService } =
      await import("@shared/storage/azure-blob-storage.service");

    const fileName = `contracts/${contract.code}-signed-${Date.now()}.pdf`;
    const uploadResult = await azureBlobStorageService.uploadFile({
      file: signedDocumentBuffer,
      fileName,
      contentType: "application/pdf",
      folder: "contracts",
      tenantId: contract.tenantId,
      businessUnitId: contract.businessUnitId,
    });

    // Actualizar contrato
    await prisma.rentalContract.update({
      where: { id: contract.id },
      data: {
        signatureStatus: "signed",
        signedPdfUrl: uploadResult.url,
      },
    });
  }

  /**
   * Obtener PDF del contrato (usando template v2.0 si está disponible, con branding).
   * Si el contrato no tiene templateId propio, busca el template activo de tipo "contract"
   * en la BusinessUnit. Si tampoco existe, genera un HTML de fallback con branding.
   */
  async getContractPdf(contractId: string): Promise<Buffer> {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        tenant: true,
        businessUnit: {
          include: { branding: true },
        },
        quotation: {
          include: {
            items: {
              include: { asset: true },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    // Determinar templateId: del contrato o buscar uno activo en la BU
    let resolvedTemplateId = contract.templateId;
    if (!resolvedTemplateId) {
      const { templateService } =
        await import("@shared/templates/template.service");
      const activeTmpl = await templateService.getActiveTemplateByType(
        contract.businessUnitId,
        "contract" as any,
      );
      if (activeTmpl) {
        resolvedTemplateId = (activeTmpl as any).id;
      }
    }

    // Helper reutilizable: construir BrandingConfig + BusinessUnitInfo
    const buildBrandingParams = async () => {
      const branding = await brandingService.getOrCreateDefault(
        contract.businessUnitId,
      );
      const brandingConfig: BrandingConfig = {
        logoUrl: branding.logoUrl || undefined,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        fontFamily: branding.fontFamily,
        contactInfo: branding.contactInfo,
        headerConfig: branding.headerConfig,
        footerConfig: branding.footerConfig,
      };
      const contactInfo = (branding.contactInfo as any) || {};
      const businessUnitInfo: BusinessUnitInfo = {
        name: contract.businessUnit.name,
        taxId: (contract.businessUnit.settings as any)?.taxId,
        email: contactInfo.email,
        phone: contactInfo.phone,
        address: contactInfo.address,
        website: contactInfo.website,
      };
      return { brandingConfig, businessUnitInfo };
    };

    // Si hay template (propio o de BU), renderizar con branding
    if (resolvedTemplateId) {
      try {
        const { contractTemplateService } =
          await import("./contract-template.service");

        const html = await contractTemplateService.renderContract({
          templateId: resolvedTemplateId,
          contractId,
          tenantId: contract.tenantId,
        });

        const { brandingConfig, businessUnitInfo } =
          await buildBrandingParams();

        const styleBlocks = html.match(/<style[\s\S]*?<\/style>/gi) || [];
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : html;
        const contentWithStyles = `${styleBlocks.join("\n")}${bodyContent}`;

        const brandedHtml = buildDocument(
          brandingConfig,
          businessUnitInfo,
          contentWithStyles,
          "contract",
          `Contrato ${contract.code}`,
        );

        const { pdfGeneratorService } =
          await import("@core/services/pdf-generator.service");
        return pdfGeneratorService.generatePDF(brandedHtml, { format: "A4" });
      } catch (error) {
        console.warn(
          "Error al usar el template de contrato, generando PDF con branding por defecto:",
          error,
        );
      }
    }

    // Fallback con branding: generar HTML del Contrato Marco con cláusulas seleccionadas
    return this._buildBrandedFallbackPdf(contract, buildBrandingParams);
  }

  /**
   * Genera un PDF de fallback usando el branding de la BU.
   * Incluye las cláusulas de ContractClauseTemplate almacenadas en metadata.clauseIds.
   */
  private async _buildBrandedFallbackPdf(
    contract: any,
    buildBrandingParams: () => Promise<{
      brandingConfig: BrandingConfig;
      businessUnitInfo: BusinessUnitInfo;
    }>,
  ): Promise<Buffer> {
    // Cargar cláusulas seleccionadas desde metadata (wizard v7.0)
    const clauseIds: string[] = (contract.metadata as any)?.clauseIds || [];
    const clauses =
      clauseIds.length > 0
        ? await prisma.contractClauseTemplate.findMany({
            where: { id: { in: clauseIds } },
            orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
          })
        : [];

    const fmt = (n: number, currency = contract.currency) =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n);

    const fmtDate = (d: Date | string | null) =>
      d
        ? new Date(d).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—";

    // Agrupar cláusulas por categoría
    const clausesByCategory: Record<string, typeof clauses> = {};
    for (const c of clauses) {
      if (!clausesByCategory[c.category]) clausesByCategory[c.category] = [];
      clausesByCategory[c.category].push(c);
    }

    const CATEGORY_LABELS: Record<string, string> = {
      general: "Cláusulas Generales",
      safety: "Seguridad y Operación",
      maintenance: "Mantenimiento",
      insurance: "Seguro y Cobertura",
      liability: "Responsabilidad",
      termination: "Terminación del Contrato",
      custom: "Condiciones Especiales",
    };

    const clausesHtml =
      clauses.length > 0
        ? Object.entries(clausesByCategory)
            .map(
              ([cat, items], catIdx) => `
        <h3>${CATEGORY_LABELS[cat] || cat}</h3>
        <ol start="${catIdx === 0 ? 1 : undefined}">
          ${items
            .map((c) => `<li><strong>${c.name}:</strong> ${c.content}</li>`)
            .join("")}
        </ol>`,
            )
            .join("")
        : `<p class="text-muted">Sin cláusulas específicas. Aplican los términos estándar de la empresa.</p>`;

    const quotationItems =
      contract.quotation?.items
        ?.map(
          (item: any) => `
      <tr>
        <td>${item.description || item.asset?.name || "—"}</td>
        <td>${item.quantity}</td>
        <td>${fmt(Number(item.unitPrice))}</td>
        <td>${fmt(Number(item.total))}</td>
      </tr>`,
        )
        .join("") ?? "";

    const bodyContent = `
      <style>
        .contract-body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; }
        .contract-title { text-align: center; margin-bottom: 24px; }
        .contract-title h1 { font-size: 20pt; margin: 0; }
        .contract-title p { color: #555; margin: 4px 0; }
        .section { margin-bottom: 20px; }
        .section h2 { font-size: 13pt; border-bottom: 2px solid #2563eb; padding-bottom: 6px; margin-bottom: 12px; color: #1e3a5f; }
        .section h3 { font-size: 11pt; margin-top: 16px; margin-bottom: 6px; color: #374151; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 16px; }
        .info-item label { display: block; font-size: 9pt; color: #6b7280; margin-bottom: 2px; }
        .info-item span { font-size: 11pt; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th { background: #2563eb; color: white; padding: 8px 12px; text-align: left; font-size: 10pt; }
        td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
        .totals-row td { font-weight: bold; background: #f3f4f6; }
        ol { padding-left: 20px; }
        ol li { margin: 8px 0; line-height: 1.5; }
        .signature-block { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; }
        .signature-box { border-top: 2px solid #374151; padding-top: 8px; text-align: center; }
        .signature-box .sig-line { height: 60px; }
        .text-muted { color: #9ca3af; font-style: italic; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9pt; font-weight: 600; }
        .badge-master { background: #dbeafe; color: #1d4ed8; }
      </style>
      <div class="contract-body">
        <div class="contract-title">
          <h1>CONTRATO MARCO DE ARRENDAMIENTO</h1>
          <p>No. <strong>${contract.code}</strong> &nbsp;·&nbsp; <span class="badge badge-master">Contrato Marco</span></p>
          <p>Fecha: ${fmtDate(contract.startDate)}</p>
        </div>

        <div class="section">
          <h2>1. Partes del Contrato</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Arrendador</label>
              <span>${contract.businessUnit.name}</span>
            </div>
            <div class="info-item">
              <label>Arrendatario (Cliente)</label>
              <span>${contract.client?.name || contract.client?.businessName || "—"}</span>
            </div>
            ${contract.client?.email ? `<div class="info-item"><label>Email</label><span>${contract.client.email}</span></div>` : ""}
            ${contract.client?.phone ? `<div class="info-item"><label>Teléfono</label><span>${contract.client.phone}</span></div>` : ""}
          </div>
        </div>

        <div class="section">
          <h2>2. Vigencia y Límites</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Fecha de inicio</label>
              <span>${fmtDate(contract.startDate)}</span>
            </div>
            <div class="info-item">
              <label>Fecha de fin estimada</label>
              <span>${fmtDate(contract.estimatedEndDate)}</span>
            </div>
            ${contract.agreedAmount ? `<div class="info-item"><label>Monto acordado</label><span>${fmt(Number(contract.agreedAmount))}</span></div>` : ""}
            ${contract.agreedPeriod ? `<div class="info-item"><label>Período máximo</label><span>${contract.agreedPeriod} días</span></div>` : ""}
          </div>
        </div>

        ${
          quotationItems
            ? `<div class="section">
          <h2>3. Activos de Referencia (Cotización ${contract.quotation?.code || ""})</h2>
          <table>
            <thead><tr><th>Descripción</th><th>Cant.</th><th>Tarifa unit.</th><th>Subtotal</th></tr></thead>
            <tbody>${quotationItems}</tbody>
            <tfoot><tr class="totals-row"><td colspan="3">Total estimado</td><td>${fmt(Number(contract.quotation?.totalAmount || 0))}</td></tr></tfoot>
          </table>
        </div>`
            : ""
        }

        <div class="section">
          <h2>${quotationItems ? "4" : "3"}. Cláusulas y Condiciones</h2>
          ${clausesHtml}
        </div>

        ${
          contract.notes
            ? `<div class="section">
          <h2>${quotationItems ? "5" : "4"}. Observaciones</h2>
          <p>${contract.notes}</p>
        </div>`
            : ""
        }

        <div class="signature-block">
          <div class="signature-box">
            <div class="sig-line"></div>
            <strong>${contract.businessUnit.name}</strong><br/>
            <span style="font-size:9pt;color:#6b7280">Arrendador</span>
          </div>
          <div class="signature-box">
            <div class="sig-line"></div>
            <strong>${contract.client?.name || "Cliente"}</strong><br/>
            <span style="font-size:9pt;color:#6b7280">Arrendatario</span>
          </div>
        </div>
      </div>`;

    const { brandingConfig, businessUnitInfo } = await buildBrandingParams();
    const brandedHtml = buildDocument(
      brandingConfig,
      businessUnitInfo,
      bodyContent,
      "contract",
      `Contrato Marco ${contract.code}`,
    );

    const { pdfGeneratorService } =
      await import("@core/services/pdf-generator.service");
    return pdfGeneratorService.generatePDF(brandedHtml, { format: "A4" });
  }

  /**
   * Genera el PDF del contrato, lo sube a Azure Blob Storage y actualiza contract.pdfUrl.
   * Retorna la URL con SAS temporal (7 días).
   */
  async generateAndStorePdf(
    contractId: string,
    tenantId: string,
  ): Promise<string> {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId, tenantId },
      select: { code: true, tenantId: true, businessUnitId: true },
    });

    if (!contract) {
      throw new Error(`Contrato ${contractId} no encontrado`);
    }

    // 1. Generar buffer del PDF (con branding)
    const pdfBuffer = await this.getContractPdf(contractId);

    // 2. Subir a Azure Blob Storage
    const { azureBlobStorageService } =
      await import("@shared/storage/azure-blob-storage.service");

    const uploadResult = await azureBlobStorageService.uploadFile({
      file: pdfBuffer,
      fileName: `${contract.code}.pdf`,
      contentType: "application/pdf",
      folder: "contracts",
      tenantId: contract.tenantId,
      businessUnitId: contract.businessUnitId,
    });

    // 3. Actualizar pdfUrl en la BD
    await prisma.rentalContract.update({
      where: { id: contractId },
      data: { pdfUrl: uploadResult.url },
    });

    // 4. Devolver URL con SAS (7 días)
    const sasUrl = await azureBlobStorageService.generateSasUrl(
      uploadResult.containerName,
      uploadResult.blobName,
      60 * 24 * 7,
    );

    return sasUrl;
  }

  /**
   * Listar contratos activos con sus activos en campo
   * Para el panel de recepción de devoluciones en taller
   */
  async listActiveContractsWithFieldAssets(
    tenantId: string,
    businessUnitId: string,
  ) {
    return prisma.rentalContract.findMany({
      where: {
        tenantId,
        businessUnitId,
        status: "active",
        activeRentals: {
          some: { actualReturnDate: null },
        },
      },
      orderBy: { startDate: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        clientAccount: {
          select: { balance: true, creditLimit: true },
        },
        activeRentals: {
          where: { actualReturnDate: null },
          include: {
            asset: {
              select: {
                id: true,
                code: true,
                name: true,
                assetType: true,
                imageUrl: true,
                currentLocation: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Devolución parcial por lotes con destino configurable
   * destination: "MAINTENANCE" → PENDING_MAINTENANCE (default)
   * destination: "STOCK"        → AVAILABLE (sin mantenimiento)
   */
  async batchReturnAssets(
    tenantId: string,
    businessUnitId: string,
    params: {
      contractId: string;
      returns: Array<{
        rentalId: string;
        destination: "MAINTENANCE" | "STOCK";
        notes?: string;
        condition?: string;
      }>;
      createdBy: string;
    },
  ) {
    // Validate contract belongs to tenant/BU
    const contract = await prisma.rentalContract.findFirst({
      where: { id: params.contractId, tenantId, businessUnitId },
      include: { clientAccount: true },
    });
    if (!contract) throw new Error("Contract not found");

    const results = [];

    for (const ret of params.returns) {
      const rental = await prisma.assetRental.findUnique({
        where: { id: ret.rentalId },
        include: { asset: true },
      });

      if (!rental || rental.contractId !== params.contractId) continue;
      if (rental.actualReturnDate) continue; // Ya devuelto

      const returnDate = await nowInBUTimezone(businessUnitId);

      // 1. Cerrar el rental
      const updatedRental = await prisma.assetRental.update({
        where: { id: ret.rentalId },
        data: {
          actualReturnDate: returnDate,
          notes: ret.notes ?? rental.notes,
        },
      });

      // 2. Cambiar estado del activo según destino
      const newState =
        ret.destination === "MAINTENANCE" ? "PENDING_MAINTENANCE" : "AVAILABLE";

      await prisma.assetState.upsert({
        where: { assetId: rental.assetId },
        create: {
          assetId: rental.assetId,
          workflowId: "default",
          currentState: newState,
        },
        update: { currentState: newState },
      });

      await prisma.asset.update({
        where: { id: rental.assetId },
        data: { isCurrentlyRented: false, currentRentalContract: null },
      });

      // 3. Evento de auditoría
      const eventType =
        ret.destination === "MAINTENANCE"
          ? "asset.pending_maintenance"
          : "asset.returned_to_stock";

      await prisma.assetEvent.create({
        data: {
          tenantId,
          businessUnitId,
          assetId: rental.assetId,
          eventType,
          source: "system",
          payload: {
            rentalId: rental.id,
            contractId: params.contractId,
            returnDate,
            destination: ret.destination,
            condition: ret.condition,
          },
        },
      });

      // 4. Movimiento en cuenta (informativo, sin monto)
      await accountService.createMovement({
        accountId: contract.clientAccountId,
        contractId: params.contractId,
        movementType: "RETURN_END",
        amount: 0,
        description: `Devolución de ${rental.asset.name} (${rental.asset.code}) → ${ret.destination === "MAINTENANCE" ? "Mantenimiento" : "Stock directo"}`,
        assetRentalId: rental.id,
        notes: ret.notes,
        createdBy: params.createdBy,
      });

      results.push({
        rentalId: ret.rentalId,
        assetId: rental.assetId,
        destination: ret.destination,
        newState,
      });
    }

    return results;
  }
}

export const contractService = new ContractService();

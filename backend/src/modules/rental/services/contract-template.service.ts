/**
 * CONTRACT TEMPLATE SERVICE V2.0
 * Sistema de renderizado modular de contratos con herencia de cotizaciones
 * 
 * Features:
 * - Renderizado basado en secciones JSON modulares
 * - Herencia automática de datos de cotizaciones
 * - Cláusulas dinámicas por tipo de activo
 * - Integración con comprobantes de pago
 * - Soporte para firmas digitales (SignNow)
 */

import prisma from "@config/database";
import Handlebars from "handlebars";
import { Decimal } from "@prisma/client/runtime/library";

// ============================================
// TYPES - Template Structure V2.0
// ============================================

export interface TemplateSection {
  id: string;
  type: SectionType;
  order: number;
  title: string;
  isRequired: boolean;
  config: Record<string, any>;
}

export type SectionType =
  | "header"
  | "quotation_summary"
  | "contract_terms"
  | "asset_clauses"
  | "payment_proof"
  | "signatures"
  | "custom_html";

export interface TemplateV2 {
  version: string;
  sections: TemplateSection[];
}

export interface RenderContractParams {
  contractId: string;
  templateId: string;
  tenantId: string;
  variables?: Record<string, any>; // Variables personalizadas adicionales
}

export interface ContractRenderData {
  contract: any;
  quotation?: any;
  client: any;
  tenant: any;
  businessUnit: any;
  assets: any[];
  clauses: any[];
  quotationItems: any[];
  paymentProof?: any;
  signatures?: any[];
  customVariables?: Record<string, any>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Registrar helpers de Handlebars
 */
function registerHandlebarsHelpers() {
  // Helper para formatear dinero
  Handlebars.registerHelper("currency", (value: number | Decimal) => {
    const num = typeof value === "number" ? value : Number(value);
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(num);
  });

  // Helper para formatear fechas
  Handlebars.registerHelper("date", (value: Date | string) => {
    const date = typeof value === "string" ? new Date(value) : value;
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  });

  // Helper para formatear fechas cortas
  Handlebars.registerHelper("shortDate", (value: Date | string) => {
    const date = typeof value === "string" ? new Date(value) : value;
    return new Intl.DateTimeFormat("es-CO").format(date);
  });

  // Helper condicional
  Handlebars.registerHelper("eq", (a: any, b: any) => a === b);

  // Helper para mostrar cantidad con unidad
  Handlebars.registerHelper("quantity", (value: number, unit: string) => {
    return `${value} ${unit}${value !== 1 ? "s" : ""}`;
  });
}

// Registrar helpers una sola vez al importar el módulo
registerHandlebarsHelpers();

// ============================================
// CONTRACT TEMPLATE SERVICE
// ============================================

export class ContractTemplateService {
  /**
   * Renderizar contrato completo desde template v2.0
   */
  async renderContract(params: RenderContractParams): Promise<string> {
    // 1. Obtener template
    const template = await prisma.template.findUnique({
      where: {
        id: params.templateId,
        tenantId: params.tenantId,
      },
    });

    if (!template) {
      throw new Error(`Template not found: ${params.templateId}`);
    }

    // 2. Obtener datos del contrato
    const data = await this.getContractRenderData(
      params.contractId,
      params.tenantId,
      params.variables,
    );

    // 3. Parsear template JSON
    const templateJson = template.content as unknown as TemplateV2;

    // 4. Renderizar todas las secciones en orden
    const sections = templateJson.sections.sort((a, b) => a.order - b.order);
    const renderedSections = await Promise.all(
      sections.map((section) => this.renderSection(section, data)),
    );

    // 5. Ensamblar HTML final
    const html = this.assembleContract(renderedSections, template);

    return html;
  }

  /**
   * Obtener todos los datos necesarios para renderizar el contrato
   */
  private async getContractRenderData(
    contractId: string,
    tenantId: string,
    customVariables?: Record<string, any>,
  ): Promise<ContractRenderData> {
    // Obtener contrato con todas sus relaciones
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId, tenantId },
      include: {
        client: true,
        tenant: true,
        businessUnit: true,
        quotation: {
          include: {
            items: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    // Obtener cláusulas aplicables
    const assetTypeIds = [
      ...new Set(
        contract.quotation?.items.map((item: any) => item.asset?.assetTypeId) ||
          [],
      ),
    ].filter(Boolean) as string[];

    const clauses = await this.getApplicableClauses(tenantId, assetTypeIds);

    // Obtener datos de pago si existen
    const paymentProof = contract.paymentProofUrl
      ? {
          type: contract.paymentType,
          url: contract.paymentProofUrl,
          details: contract.paymentDetails,
          verifiedBy: contract.paymentVerifiedBy,
          verifiedAt: contract.paymentVerifiedAt,
        }
      : undefined;

    return {
      contract,
      quotation: contract.quotation,
      client: contract.client,
      tenant: contract.tenant,
      businessUnit: contract.businessUnit,
      assets: contract.quotation?.items.map((item: any) => item.asset) || [],
      clauses,
      quotationItems: contract.quotation?.items || [],
      paymentProof,
      signatures: [], // TODO: Integrar con SignNow
      customVariables,
    };
  }

  /**
   * Obtener cláusulas aplicables según tipos de activo
   */
  private async getApplicableClauses(
    tenantId: string,
    assetTypeIds: string[],
  ) {
    return prisma.contractClause.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { applicableAssetTypes: { isEmpty: true } }, // Cláusulas generales
          { applicableAssetTypes: { hasSome: assetTypeIds } }, // Cláusulas específicas
        ],
      },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });
  }

  /**
   * Renderizar una sección específica
   */
  private async renderSection(
    section: TemplateSection,
    data: ContractRenderData,
  ): Promise<string> {
    switch (section.type) {
      case "header":
        return this.renderHeaderSection(section, data);

      case "quotation_summary":
        return this.renderQuotationSummarySection(section, data);

      case "contract_terms":
        return this.renderContractTermsSection(section, data);

      case "asset_clauses":
        return this.renderAssetClausesSection(section, data);

      case "payment_proof":
        return this.renderPaymentProofSection(section, data);

      case "signatures":
        return this.renderSignaturesSection(section, data);

      case "custom_html":
        return this.renderCustomHtmlSection(section, data);

      default:
        console.warn(`Unknown section type: ${section.type}`);
        return "";
    }
  }

  /**
   * SECTION RENDERERS
   */

  private renderHeaderSection(
    section: TemplateSection,
    data: ContractRenderData,
  ): string {
    const { config } = section;
    const template = config.template || `
      <div class="contract-header">
        <div class="logo">
          {{#if tenant.logoUrl}}
            <img src="{{tenant.logoUrl}}" alt="{{tenant.name}}" />
          {{/if}}
        </div>
        <h1>{{config.title}}</h1>
        <div class="contract-info">
          <p><strong>Contrato:</strong> {{contract.code}}</p>
          <p><strong>Fecha:</strong> {{date contract.startDate}}</p>
          {{#if config.showCompanyInfo}}
            <p><strong>{{tenant.name}}</strong></p>
            <p>{{tenant.taxId}}</p>
          {{/if}}
        </div>
      </div>
    `;

    const compiled = Handlebars.compile(template);
    return compiled({ ...data, config });
  }

  private renderQuotationSummarySection(
    section: TemplateSection,
    data: ContractRenderData,
  ): string {
    if (!data.quotation) {
      return ""; // No quotation, skip section
    }

    const { config } = section;
    const template = config.template || `
      <div class="quotation-summary">
        <h2>{{config.title}}</h2>
        <p><strong>Cotización:</strong> {{quotation.code}}</p>
        <p><strong>Cliente:</strong> {{client.fullName}}</p>
        <p><strong>Fecha de cotización:</strong> {{shortDate quotation.createdAt}}</p>
        
        {{#if config.showItems}}
          <table class="quotation-items">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Tarifa</th>
                <th>Unidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {{#each quotationItems}}
                <tr>
                  <td>{{this.asset.name}}</td>
                  <td>{{this.asset.assetType.name}}</td>
                  <td>{{this.quantity}}</td>
                  <td>{{currency this.unitPrice}}</td>
                  <td>{{this.billingUnit}}</td>
                  <td>{{currency this.subtotal}}</td>
                </tr>
              {{/each}}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5"><strong>Total estimado:</strong></td>
                <td><strong>{{currency quotation.total}}</strong></td>
              </tr>
            </tfoot>
          </table>
        {{/if}}
      </div>
    `;

    const compiled = Handlebars.compile(template);
    return compiled({ ...data, config });
  }

  private renderContractTermsSection(
    section: TemplateSection,
    data: ContractRenderData,
  ): string {
    const { config } = section;

    // Si hay template personalizado, usarlo
    if (config.template) {
      const compiled = Handlebars.compile(config.template);
      return compiled({ ...data, config });
    }

    // Template por defecto con términos estándar
    const terms = config.terms || [
      "El presente contrato rige la relación de alquiler entre las partes.",
      "El cliente se compromete a pagar conforme a la cotización aprobada.",
      "Los activos deben ser devueltos en las mismas condiciones.",
      "El cliente es responsable de cualquier daño o pérdida.",
    ];

    let html = `<div class="contract-terms"><h2>${section.title}</h2><ol>`;
    terms.forEach((term: string) => {
      html += `<li>${term}</li>`;
    });
    html += `</ol></div>`;

    return html;
  }

  private renderAssetClausesSection(
    section: TemplateSection,
    data: ContractRenderData,
  ): string {
    const { config } = section;
    const { clauses, assets } = data;

    // Agrupar cláusulas por categoría
    const clausesByCategory = clauses.reduce(
      (acc, clause) => {
        if (!acc[clause.category]) {
          acc[clause.category] = [];
        }
        acc[clause.category].push(clause);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    let html = `<div class="asset-clauses"><h2>${section.title}</h2>`;

    // Renderizar cláusulas generales
    if (clausesByCategory["general"]) {
      html += `<h3>Cláusulas Generales</h3><ol>`;
      clausesByCategory["general"].forEach((clause: any) => {
        html += `<li><strong>${clause.name}:</strong> ${clause.content}</li>`;
      });
      html += `</ol>`;
    }

    // Renderizar cláusulas específicas por tipo de activo
    const assetTypes = [...new Set(assets.map((a) => a.assetType?.name))];
    assetTypes.forEach((assetType) => {
      const typeClauses = clauses.filter(
        (c) =>
          c.applicableAssetTypes.length > 0 &&
          assets.some(
            (a) =>
              a.assetType?.name === assetType &&
              c.applicableAssetTypes.includes(a.assetTypeId),
          ),
      );

      if (typeClauses.length > 0) {
        html += `<h3>Cláusulas para ${assetType}</h3><ol>`;
        typeClauses.forEach((clause) => {
          html += `<li><strong>${clause.name}:</strong> ${clause.content}</li>`;
        });
        html += `</ol>`;
      }
    });

    html += `</div>`;
    return html;
  }

  private renderPaymentProofSection(
    section: TemplateSection,
    data: ContractRenderData,
  ): string {
    const { config } = section;
    const { paymentProof, contract } = data;

    let html = `<div class="payment-proof"><h2>${section.title}</h2>`;

    if (paymentProof) {
      // Ya hay comprobante cargado
      if (paymentProof.type === "local") {
        html += `
          <p>✓ <strong>Pago realizado en efectivo/local</strong></p>
          <p>Verificado por: ${paymentProof.verifiedBy || "Pendiente"}</p>
          ${paymentProof.verifiedAt ? `<p>Fecha: ${new Date(paymentProof.verifiedAt).toLocaleString("es-CO")}</p>` : ""}
        `;
      } else {
        html += `
          <p>✓ <strong>Comprobante de pago cargado</strong></p>
          <p><a href="${paymentProof.url}" target="_blank">Ver comprobante</a></p>
          ${paymentProof.details ? `<p>Detalles: ${JSON.stringify(paymentProof.details)}</p>` : ""}
        `;
      }
    } else {
      // Instrucciones para cargar comprobante
      html += `
        <p>${config.instructions || "El cliente debe cargar el comprobante de pago antes de la firma del contrato."}</p>
        ${config.allowLocalPayment ? '<p><em>O marcar la opción "Pago local/efectivo" si el pago se realizó en persona.</em></p>' : ""}
        <div class="payment-upload-placeholder">
          <p>[Zona de carga de comprobante - se habilitará en el sistema]</p>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  private renderSignaturesSection(
    section: TemplateSection,
    data: ContractRenderData,
  ): string {
    const { config } = section;
    const { signatures = [] } = data;

    let html = `<div class="signatures"><h2>${section.title}</h2>`;

    const signatories = config.signatories || [
      { role: "Arrendador", name: data.tenant.name },
      { role: "Arrendatario", name: data.client.fullName },
    ];

    if (signatures.length > 0) {
      // Mostrar firmas existentes
      html += `<div class="signatures-grid">`;
      signatures.forEach((sig: any) => {
        html += `
          <div class="signature-box">
            <img src="${sig.imageUrl}" alt="Firma ${sig.role}" />
            <p><strong>${sig.role}:</strong> ${sig.name}</p>
            <p>Fecha: ${new Date(sig.signedAt).toLocaleString("es-CO")}</p>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      // Placeholders para firmas pendientes
      html += `<div class="signatures-grid">`;
      signatories.forEach((signatory: any) => {
        html += `
          <div class="signature-box signature-pending">
            <div class="signature-placeholder">
              <p>[Firma pendiente]</p>
            </div>
            <p><strong>${signatory.role}:</strong> ${signatory.name}</p>
            <p>___________________________</p>
          </div>
        `;
      });
      html += `</div>`;

      if (config.signNowEnabled) {
        html += `<p><em>Este contrato será enviado para firma digital mediante SignNow.</em></p>`;
      }
    }

    html += `</div>`;
    return html;
  }

  private renderCustomHtmlSection(
    section: TemplateSection,
    data: ContractRenderData,
  ): string {
    const { config } = section;
    const htmlContent = config.html || "";

    // Compilar con Handlebars para permitir variables
    const compiled = Handlebars.compile(htmlContent);
    return compiled(data);
  }

  /**
   * Ensamblar HTML final del contrato
   */
  private assembleContract(
    renderedSections: string[],
    template: any,
  ): string {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .contract-header { text-align: center; margin-bottom: 30px; }
        .contract-header .logo img { max-width: 200px; margin-bottom: 20px; }
        .contract-header h1 { font-size: 24px; margin: 10px 0; }
        .contract-info { font-size: 14px; }
        
        h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 30px; }
        h3 { color: #34495e; margin-top: 20px; }
        
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3498db; color: white; }
        tfoot td { font-weight: bold; background-color: #ecf0f1; }
        
        ol { padding-left: 20px; }
        ol li { margin: 10px 0; }
        
        .signatures-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin-top: 20px; }
        .signature-box { border: 1px solid #ddd; padding: 20px; text-align: center; }
        .signature-box img { max-width: 200px; margin-bottom: 10px; }
        .signature-placeholder { height: 100px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
        
        .payment-proof { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
        .payment-upload-placeholder { border: 2px dashed #adb5bd; padding: 30px; text-align: center; color: #6c757d; margin: 20px 0; }
        
        @media print {
          .payment-upload-placeholder { display: none; }
        }
      </style>
    `;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Alquiler - ${template.name}</title>
  ${styles}
</head>
<body>
  <div class="contract-document">
    ${renderedSections.join("\n")}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Crear o actualizar un template en formato v2.0
   */
  async createTemplate(
    tenantId: string,
    name: string,
    templateJson: TemplateV2,
    options: {
      businessUnitId?: string;
      requiresSignature?: boolean;
      requiresPaymentProof?: boolean;
      allowLocalPayment?: boolean;
    } = {},
  ) {
    const data: any = {
      tenantId,
      name,
      type: "contract",
      version: templateJson.version,
      content: templateJson as any,
      requiresSignature: options.requiresSignature ?? false,
      requiresPaymentProof: options.requiresPaymentProof ?? false,
      allowLocalPayment: options.allowLocalPayment ?? true,
      isActive: true,
    };

    if (options.businessUnitId) {
      data.businessUnitId = options.businessUnitId;
    }

    return prisma.template.create({ data });
  }

  /**
   * Migrar template legacy (HTML) a formato v2.0
   */
  async migrateTemplateToV2(templateId: string, tenantId: string) {
    const template = await prisma.template.findUnique({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const content = template.content as any;

    // Si ya es v2, no hacer nada
    if (content.version && content.sections) {
      return template;
    }

    // Si es HTML legacy, envolver en sección custom_html
    const legacyHtml =
      typeof content === "string" ? content : content.legacy_html || "";

    const v2Content: TemplateV2 = {
      version: "2.0",
      sections: [
        {
          id: "legacy_content",
          type: "custom_html",
          order: 1,
          title: "Contenido",
          isRequired: true,
          config: {
            html: legacyHtml,
          },
        },
      ],
    };

    return prisma.template.update({
      where: { id: templateId },
      data: {
        content: v2Content as any,
        version: "2.0",
      },
    });
  }
}

// Export singleton instance
export const contractTemplateService = new ContractTemplateService();

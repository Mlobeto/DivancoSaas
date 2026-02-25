/**
 * TEMPLATE SERVICE
 * Servicio para gestión de plantillas HTML y generación de PDFs
 * Ubicación: shared (transversal a múltiples módulos)
 *
 * IMPORTANTE: Templates ahora SOLO contienen el body (content).
 * Header, footer y logo vienen de BusinessUnitBranding.
 */

import Handlebars from "handlebars";
import { chromium } from "playwright";
import prisma from "@config/database";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import { brandingService } from "@core/services/branding.service";
import { pdfGeneratorService } from "@core/services/pdf-generator.service";
import {
  buildDocument,
  type BrandingConfig,
  type BusinessUnitInfo,
} from "@core/services/document-builder.service";

// ============================================
// TYPES
// ============================================

export interface Template {
  id: string;
  tenantId: string;
  businessUnitId: string;
  name: string;
  type: TemplateType;
  content: string;
  styles?: string;
  variables: TemplateVariable[];
  isActive: boolean;
  // REMOVED: logoUrl, headerHtml, footerHtml (now from BusinessUnitBranding)
}

export type TemplateType =
  | "quotation" // Plantilla de cotización
  | "contract" // Plantilla de contrato
  | "contract_report" // Informe de estado de cuenta del contrato
  | "attachment"; // Adjunto personalizable

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "array";
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface CreateTemplateParams {
  tenantId: string;
  businessUnitId: string;
  name: string;
  type: TemplateType;
  content: string;
  styles?: string;
  variables: TemplateVariable[];
  // REMOVED: logoUrl, headerHtml, footerHtml (now from BusinessUnitBranding)
}

export interface UpdateTemplateParams {
  name?: string;
  content?: string;
  styles?: string;
  variables?: TemplateVariable[];
  isActive?: boolean;
  // REMOVED: logoUrl, headerHtml, footerHtml (now from BusinessUnitBranding)
}

export interface RenderTemplateParams {
  templateId: string;
  data: Record<string, any>;
  options?: RenderOptions;
}

export interface RenderOptions {
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  currencySymbol?: string;
}

export interface PDFGenerationOptions {
  format?: "A4" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  scale?: number;
}

// ============================================
// SERVICE
// ============================================

export class TemplateService {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Crear plantilla
   */
  async createTemplate(params: CreateTemplateParams): Promise<Template> {
    const template = await prisma.template.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        name: params.name,
        type: params.type,
        content: params.content,
        styles: params.styles,
        variables: params.variables as any,
        isActive: true,
      },
    });

    return template as any as Template;
  }

  /**
   * Obtener plantilla por ID
   */
  async getTemplateById(templateId: string): Promise<Template | null> {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    return template as any as Template | null;
  }

  /**
   * Obtener plantilla por ID (alias para compatibilidad)
   */
  async getTemplate(templateId: string): Promise<Template | null> {
    return this.getTemplateById(templateId);
  }

  /**
   * Obtener plantilla activa por tipo y BusinessUnit
   */
  async getActiveTemplateByType(
    businessUnitId: string,
    type: TemplateType,
  ): Promise<Template | null> {
    const template = await prisma.template.findFirst({
      where: {
        businessUnitId,
        type,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return template as any as Template | null;
  }

  /**
   * Listar plantillas de una BusinessUnit
   */
  async listTemplates(filters: {
    businessUnitId: string;
    type?: string;
  }): Promise<Template[]> {
    const templates = await prisma.template.findMany({
      where: {
        businessUnitId: filters.businessUnitId,
        ...(filters.type && { type: filters.type as TemplateType }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return templates as any as Template[];
  }

  /**
   * Actualizar plantilla
   */
  async updateTemplate(
    templateId: string,
    params: UpdateTemplateParams,
  ): Promise<Template> {
    const template = await prisma.template.update({
      where: { id: templateId },
      data: {
        ...(params.name && { name: params.name }),
        ...(params.content && { content: params.content }),
        ...(params.styles !== undefined && { styles: params.styles }),
        ...(params.variables && { variables: params.variables as any }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        updatedAt: new Date(),
      },
    });

    return template as any as Template;
  }

  /**
   * Eliminar plantilla (soft delete)
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await prisma.template.update({
      where: { id: templateId },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Upload logo for template to Azure Blob Storage
   */
  /**
   * @deprecated Logos are now managed in BusinessUnitBranding, not in Templates.
   * Use BrandingService.update() to update logos.
   */
  async uploadTemplateLogo(
    templateId: string,
    file: Express.Multer.File,
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    throw new Error(
      "uploadTemplateLogo is deprecated. Use BrandingService to manage logos per BusinessUnit.",
    );
  }

  /**
   * Renderizar plantilla con datos (solo el body, sin branding)
   */
  async renderTemplate(params: RenderTemplateParams): Promise<string> {
    const template = await this.getTemplate(params.templateId);
    if (!template) {
      throw new Error(`Template ${params.templateId} not found`);
    }

    if (!template.isActive) {
      throw new Error(`Template ${params.templateId} is not active`);
    }

    // Compilar plantilla
    const compiledTemplate = this.handlebars.compile(template.content);

    // Preparar datos con helpers y opciones
    const enrichedData = this.enrichData(params.data, params.options);

    // Renderizar
    const html = compiledTemplate(enrichedData);

    // Añadir estilos si existen
    if (template.styles) {
      return this.wrapWithStyles(html, template.styles);
    }

    return html;
  }

  /**
   * Generar PDF desde HTML
   */
  async generatePDF(
    html: string,
    options?: PDFGenerationOptions,
  ): Promise<Buffer> {
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Establecer contenido
      await page.setContent(html, {
        waitUntil: "networkidle",
      });

      // Opciones de PDF
      const pdfOptions = {
        format: (options?.format || "A4") as "A4" | "Letter",
        landscape: options?.orientation === "landscape",
        margin: options?.margin || {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
        displayHeaderFooter: options?.displayHeaderFooter || false,
        headerTemplate: options?.headerTemplate || "",
        footerTemplate: options?.footerTemplate || "",
        printBackground: true,
        scale: options?.scale || 1,
      };

      // Generar PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Renderizar plantilla y generar PDF en un solo paso
   */
  /**
   * Renderizar template y generar PDF con branding
   * Este método ahora integra BusinessUnitBranding automáticamente
   */
  async renderAndGeneratePDF(
    params: RenderTemplateParams,
    pdfOptions?: PDFGenerationOptions,
  ): Promise<Buffer> {
    // 1. Get template
    const template = await this.getTemplate(params.templateId);
    if (!template) {
      throw new Error(`Template ${params.templateId} not found`);
    }

    if (!template.isActive) {
      throw new Error(`Template ${params.templateId} is not active`);
    }

    // 2. Get branding for business unit
    const branding = await brandingService.getOrCreateDefault(
      template.businessUnitId,
    );

    // 3. Get business unit info
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: template.businessUnitId },
    });

    if (!businessUnit) {
      throw new Error(`BusinessUnit ${template.businessUnitId} not found`);
    }

    // 4. Render content with Handlebars
    const compiledTemplate = this.handlebars.compile(template.content);
    const enrichedData = this.enrichData(params.data, params.options);
    let renderedContent = compiledTemplate(enrichedData);

    // Add custom styles if exists
    if (template.styles) {
      renderedContent = `<style>${template.styles}</style>${renderedContent}`;
    }

    // 5. Build branding config
    const brandingConfig: BrandingConfig = {
      logoUrl: branding.logoUrl || undefined,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      fontFamily: branding.fontFamily,
      headerConfig: branding.headerConfig,
      footerConfig: branding.footerConfig,
    };

    // 6. Build business unit info
    const businessUnitInfo: BusinessUnitInfo = {
      name: businessUnit.name,
      taxId: (businessUnit.settings as any)?.taxId,
      email: (businessUnit.settings as any)?.email,
      phone: (businessUnit.settings as any)?.phone,
      address: (businessUnit.settings as any)?.address,
      website: (businessUnit.settings as any)?.website,
    };

    // 7. Build complete document (branding header + content + branding footer)
    const completeHtml = buildDocument(
      brandingConfig,
      businessUnitInfo,
      renderedContent,
      template.type as any,
      template.name,
    );

    // 8. Generate PDF using new PDF service
    const format = pdfOptions?.format === "Letter" ? "A4" : "A4"; // Map to our supported formats
    return pdfGeneratorService.generatePDF(completeHtml, { format });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Registrar helpers de Handlebars
   */
  private registerHelpers(): void {
    // Helper para formatear moneda
    this.handlebars.registerHelper(
      "formatCurrency",
      (value: number, symbol = "$") => {
        return `${symbol}${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
      },
    );

    // Helper para formatear fecha
    this.handlebars.registerHelper(
      "formatDate",
      (date: Date, format = "long") => {
        if (!date) return "";
        const d = new Date(date);
        if (format === "short") {
          return d.toLocaleDateString();
        }
        return d.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    );

    // Helper para formatear número
    this.handlebars.registerHelper("formatNumber", (value: number) => {
      return value.toLocaleString();
    });

    // Helper condicional (block helper)
    this.handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
      // @ts-ignore
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Helper para comparación simple (retorna boolean)
    this.handlebars.registerHelper("eq", (a: any, b: any) => {
      return a === b;
    });

    // Helper para comparación NOT EQUAL
    this.handlebars.registerHelper("ne", (a: any, b: any) => {
      return a !== b;
    });

    // Helper para mayor que
    this.handlebars.registerHelper("gt", (a: number, b: number) => {
      return a > b;
    });

    // Helper para menor que
    this.handlebars.registerHelper("lt", (a: number, b: number) => {
      return a < b;
    });

    // Helper para sumas
    this.handlebars.registerHelper("sum", (...args: any[]) => {
      args.pop(); // Remover options object
      return args.reduce((sum, val) => sum + (Number(val) || 0), 0);
    });

    // Helper para multiplicación
    this.handlebars.registerHelper("multiply", (a: number, b: number) => {
      return (a || 0) * (b || 0);
    });

    // Helper para uppercase
    this.handlebars.registerHelper("uppercase", (str: string) => {
      return str ? str.toUpperCase() : "";
    });

    // Helper para lowercase
    this.handlebars.registerHelper("lowercase", (str: string) => {
      return str ? str.toLowerCase() : "";
    });

    // Helper para truncar texto
    this.handlebars.registerHelper(
      "truncate",
      (str: string, length: number) => {
        if (!str) return "";
        return str.length > length ? str.substring(0, length) + "..." : str;
      },
    );
  }

  /**
   * Enriquecer datos con valores adicionales
   */
  private enrichData(
    data: Record<string, any>,
    options?: RenderOptions,
  ): Record<string, any> {
    return {
      ...data,
      _locale: options?.locale || "es-ES",
      _timezone: options?.timezone || "America/Bogota",
      _dateFormat: options?.dateFormat || "long",
      _currencySymbol: options?.currencySymbol || "$",
      _now: new Date(),
    };
  }

  /**
   * Envolver HTML con estilos
   */
  private wrapWithStyles(html: string, styles: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${styles}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  }
}

// Export singleton
export const templateService = new TemplateService();

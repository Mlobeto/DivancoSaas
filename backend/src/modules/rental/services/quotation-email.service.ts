/**
 * QUOTATION EMAIL SERVICE
 * Servicio para envío de cotizaciones por email con PDF adjunto
 */

import { emailService } from "@core/services/email.service";
import { quotationService } from "./quotation.service";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import { ensureClientReviewToken } from "./quotation-approval.service";
import prisma from "@config/database";
import { brandingService } from "@core/services/branding.service";
import Handlebars from "handlebars";

export class QuotationEmailService {
  private compileTemplate(template: string, data: Record<string, any>): string {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }

  private injectBrandingInEmailHtml(
    htmlContent: string,
    options: {
      businessUnitName: string;
      logoUrl?: string;
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
    },
  ): string {
    const headerBlock = `
      <div style="background:${options.primaryColor};color:#fff;padding:18px 20px;text-align:center;border-radius:8px 8px 0 0;">
        ${
          options.logoUrl
            ? `<img src="${options.logoUrl}" alt="${options.businessUnitName}" style="max-height:56px;max-width:220px;object-fit:contain;margin-bottom:10px;" />`
            : ""
        }
        <div style="font-size:18px;font-weight:700;">${options.businessUnitName}</div>
      </div>
    `;

    const footerBlock = `
      <div style="background:${options.secondaryColor};color:#fff;padding:14px 20px;text-align:center;font-size:12px;border-radius:0 0 8px 8px;">
        © ${new Date().getFullYear()} ${options.businessUnitName}
      </div>
    `;

    const hasHtmlTag = /<html[\s>]/i.test(htmlContent);
    const hasBodyTag = /<body[\s>]/i.test(htmlContent);

    if (hasHtmlTag && hasBodyTag) {
      return htmlContent
        .replace(/<body([^>]*)>/i, (match, bodyAttrs) => {
          return `<body${bodyAttrs} style="font-family:${options.fontFamily},Arial,sans-serif;">${headerBlock}`;
        })
        .replace(/<\/body>/i, `${footerBlock}</body>`);
    }

    return `
      <div style="max-width:680px;margin:0 auto;font-family:${options.fontFamily},Arial,sans-serif;line-height:1.6;color:#333;">
        ${headerBlock}
        <div style="padding:24px 20px;background:#f9f9f9;">${htmlContent}</div>
        ${footerBlock}
      </div>
    `;
  }

  /**
   * Enviar cotización por email al cliente
   */
  async sendQuotationEmail(
    quotationId: string,
    options?: {
      customMessage?: string;
      cc?: string[];
    },
  ): Promise<void> {
    // 1. Obtener cotización completa
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        client: true,
        businessUnit: true,
        items: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    if (!quotation.pdfUrl) {
      throw new Error("PDF must be generated before sending email");
    }

    const branding = await brandingService.getOrCreateDefault(
      quotation.businessUnitId,
    );
    const primaryColor = branding.primaryColor || "#0066cc";
    const secondaryColor = branding.secondaryColor || "#333333";
    const logoUrl = branding.logoUrl || "";
    const emailFont = branding.fontFamily || "Arial";

    const emailTemplate = await prisma.emailTemplate.findFirst({
      where: {
        businessUnitId: quotation.businessUnitId,
        emailType: "quotation_sent",
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

    // Generar token único de revisión para el cliente (approve/request-changes)
    const clientReviewToken = await ensureClientReviewToken(quotationId);

    const backendUrl =
      process.env.BACKEND_URL ||
      (process.env.WEBSITE_HOSTNAME
        ? `https://${process.env.WEBSITE_HOSTNAME}`
        : "http://localhost:3001");
    const reviewUrl = `${backendUrl}/api/v1/public/quotations/${clientReviewToken}/review`;

    // 2. Extraer containerName y blobName de la URL
    // URL format: https://[account].blob.core.windows.net/[container]/[blobPath]
    const url = new URL(quotation.pdfUrl);
    const pathParts = url.pathname.split("/").filter((p) => p);
    const containerName = pathParts[0];
    const blobName = pathParts.slice(1).join("/");

    // 3. Generar SAS URL temporal (60 minutos)
    const pdfUrlWithSas = await azureBlobStorageService.generateSasUrl(
      containerName,
      blobName,
      60,
    );

    // 4. Descargar PDF desde Azure Blob Storage con SAS
    const pdfResponse = await fetch(pdfUrlWithSas);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // 3. Preparar email
    const fallbackSubject = `Cotización ${quotation.code} - ${quotation.businessUnit.name}`;

    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: ${emailFont}, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${primaryColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .footer { background: ${secondaryColor}; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            .button { 
              background: ${primaryColor}; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px;
              display: inline-block;
              margin: 20px 0;
            }
            .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
            .item-list { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .badge { 
              background: #e3f2fd; 
              color: ${primaryColor}; 
              padding: 4px 12px; 
              border-radius: 12px; 
              font-size: 12px; 
              font-weight: bold;
              display: inline-block;
              margin-top: 10px;
            }
            .badge-service { background: #f3e5f5; color: #7b1fa2; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" alt="${quotation.businessUnit.name}" style="max-height: 56px; max-width: 220px; object-fit: contain; margin-bottom: 12px;" />`
                  : ""
              }
              <h1 style="margin: 0;">📋 Nueva Cotización</h1>
              <h2 style="margin: 10px 0 0 0;">${quotation.code}</h2>
              ${
                quotation.quotationType === "time_based"
                  ? '<span class="badge">Alquiler por Tiempo</span>'
                  : '<span class="badge badge-service">Servicio/Proyecto</span>'
              }
            </div>
            
            <div class="content">
              <p>Estimado/a <strong>${quotation.client.name}</strong>,</p>
              
              <p>Es un placer enviarle nuestra cotización para los servicios solicitados.</p>
              
              ${
                options?.customMessage
                  ? `
                <div class="highlight">
                  <strong>📝 Mensaje personalizado:</strong><br>
                  ${options.customMessage}
                </div>
              `
                  : ""
              }
              
              <div class="item-list">
                <h3 style="margin-top: 0; color: ${primaryColor};">📊 Resumen de la Cotización</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Código:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${quotation.code}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tipo:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
                      ${quotation.quotationType === "time_based" ? "Alquiler por Tiempo" : "Servicio/Proyecto"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Fecha:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
                      ${new Date(quotation.quotationDate).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Válida hasta:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
                      ${new Date(quotation.validUntil).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Items:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${quotation.items.length}</td>
                  </tr>
                  <tr style="background: #f0f8ff;">
                    <td style="padding: 12px 0; font-size: 18px;"><strong>TOTAL:</strong></td>
                    <td style="padding: 12px 0; text-align: right; font-size: 18px; color: ${primaryColor}; font-weight: bold;">
                      ${quotation.currency} ${Number(quotation.totalAmount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </table>
                
                ${
                  quotation.quotationType === "time_based" &&
                  quotation.estimatedDays
                    ? `
                  <div style="margin-top: 20px; padding: 15px; background: #fff3e0; border-radius: 5px;">
                    <strong>📅 Período Estimado:</strong> ${quotation.estimatedDays} días
                    <br>
                    <small style="color: #666;">
                      Del ${new Date(quotation.estimatedStartDate!).toLocaleDateString("es-MX")} 
                      al ${new Date(quotation.estimatedEndDate!).toLocaleDateString("es-MX")}
                    </small>
                  </div>
                `
                    : ""
                }
                
                ${
                  quotation.quotationType === "service_based" &&
                  quotation.serviceDescription
                    ? `
                  <div style="margin-top: 20px; padding: 15px; background: #fce4ec; border-radius: 5px;">
                    <strong>🔧 Descripción del Servicio:</strong><br>
                    <p style="margin: 10px 0 0 0; color: #666;">${quotation.serviceDescription}</p>
                  </div>
                `
                    : ""
                }
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;">
                  📎 <strong>Adjunto encontrará el PDF con los detalles completos de la cotización.</strong>
                </p>
              </div>

              <div style="background: #f0fff4; border: 2px solid #9ae6b4; padding: 24px; border-radius: 10px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #276749; font-weight: bold; font-size: 16px;">
                  ✅ Revise y responda su cotización
                </p>
                <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 13px;">
                  Puede aprobar la cotización o solicitar modificaciones usando el enlace de abajo.<br>
                  Una vez aprobada, generaremos su contrato automáticamente.
                </p>
                <a href="${reviewUrl}"
                   style="display: inline-block; background: #38a169; color: white; padding: 14px 32px;
                          border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;
                          letter-spacing: 0.3px; margin-bottom: 8px;">
                  📋 Ver y responder cotización
                </a>
                <p style="margin: 12px 0 0 0; color: #a0aec0; font-size: 11px;">
                  Si el botón no funciona, copie y pegue este enlace:<br>
                  <span style="word-break: break-all; color: #4a5568;">${reviewUrl}</span>
                </p>
              </div>
              
              ${
                quotation.notes
                  ? `
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <strong>📝 Notas:</strong><br>
                  <p style="margin: 10px 0 0 0; color: #666;">${quotation.notes}</p>
                </div>
              `
                  : ""
              }
              
              <p>Si tiene alguna pregunta o requiere modificaciones, no dude en contactarnos.</p>
              
              <p>Quedamos atentos a su respuesta.</p>
              
              <p style="margin-top: 30px;">
                Atentamente,<br>
                <strong>${quotation.businessUnit.name}</strong>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 5px 0;">Este es un email automático generado por DivancoSaas</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} ${quotation.businessUnit.name} - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const templateData = {
      quotation,
      client: quotation.client,
      businessUnit: quotation.businessUnit,
      reviewUrl,
      year: new Date().getFullYear(),
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily: emailFont,
      quotationCode: quotation.code,
      quotationType: quotation.quotationType,
      quotationDate: new Date(quotation.quotationDate).toLocaleDateString(
        "es-MX",
      ),
      validUntil: new Date(quotation.validUntil).toLocaleDateString("es-MX"),
      totalAmount: Number(quotation.totalAmount).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      currency: quotation.currency,
      itemCount: quotation.items.length,
      notes: quotation.notes,
      customMessage: options?.customMessage,
    };

    let subject = fallbackSubject;
    let html = fallbackHtml;
    let text = `Cotización ${quotation.code} adjunta. Total: ${quotation.currency} ${quotation.totalAmount}`;

    if (emailTemplate) {
      const customColors =
        emailTemplate.customColors &&
        typeof emailTemplate.customColors === "object"
          ? (emailTemplate.customColors as Record<string, any>)
          : {};

      const templatePrimaryColor =
        emailTemplate.useBranding === false
          ? customColors.primary || primaryColor
          : primaryColor;
      const templateSecondaryColor =
        emailTemplate.useBranding === false
          ? customColors.secondary || secondaryColor
          : secondaryColor;

      const themedData = {
        ...templateData,
        primaryColor: templatePrimaryColor,
        secondaryColor: templateSecondaryColor,
      };

      subject = this.compileTemplate(emailTemplate.subject, themedData);
      const renderedHtml = this.compileTemplate(
        emailTemplate.htmlContent,
        themedData,
      );
      html = this.injectBrandingInEmailHtml(renderedHtml, {
        businessUnitName: quotation.businessUnit.name,
        logoUrl,
        primaryColor: templatePrimaryColor,
        secondaryColor: templateSecondaryColor,
        fontFamily: emailFont,
      });

      if (emailTemplate.textContent) {
        text = this.compileTemplate(emailTemplate.textContent, themedData);
      }
    }

    // 4. Enviar email con PDF adjunto via EmailService (con fallback a consola en dev)
    if (!quotation.client.email) {
      throw new Error(
        `El cliente "${quotation.client.name}" no tiene email registrado.`,
      );
    }
    await emailService.sendGenericEmail(quotation.businessUnitId, {
      to: quotation.client.email,
      cc: options?.cc,
      subject: subject,
      html: html,
      text,
      skipBranding: true,
      attachments: [
        {
          filename: `${quotation.code}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    // 5. Actualizar status de la cotización
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: "sent",
        updatedAt: new Date(),
      },
    });

    console.log(
      `✅ Quotation ${quotation.code} sent to ${quotation.client.email}`,
    );
  }
}

export const quotationEmailService = new QuotationEmailService();

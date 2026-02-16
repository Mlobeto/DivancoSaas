/**
 * HTML Document Builder
 * Generates branded HTML documents with dynamic header, content, and footer
 */

import type {
  HeaderConfig,
  FooterConfig,
  DocumentType,
} from "../types/branding.types";

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
}

export interface BusinessUnitInfo {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

/**
 * Build document header based on branding configuration
 */
export function buildHeader(
  branding: BrandingConfig,
  businessUnit: BusinessUnitInfo,
): string {
  const { headerConfig } = branding;
  const alignClass =
    headerConfig.logoAlign === "center"
      ? "justify-center"
      : headerConfig.logoAlign === "right"
        ? "justify-end"
        : "justify-start";

  return `
    <div class="document-header" style="
      min-height: ${headerConfig.height}px;
      padding: 20px;
      border-bottom: 2px solid ${branding.primaryColor};
      background: linear-gradient(to bottom, ${branding.primaryColor}08, transparent);
      display: flex;
      align-items: center;
      ${headerConfig.logoAlign === "center" ? "justify-content: center;" : ""}
      ${headerConfig.logoAlign === "right" ? "justify-content: flex-end;" : ""}
      gap: 20px;
    ">
      ${
        headerConfig.showLogo && branding.logoUrl
          ? `
        <div class="header-logo">
          <img src="${branding.logoUrl}" alt="${businessUnit.name}" style="
            max-height: ${headerConfig.height - 40}px;
            max-width: 200px;
            object-fit: contain;
          " />
        </div>
      `
          : ""
      }
      
      <div class="header-info" style="flex: 1;">
        ${
          headerConfig.showBusinessName
            ? `
          <h1 style="
            margin: 0 0 8px 0;
            color: ${branding.primaryColor};
            font-size: 24px;
            font-weight: 700;
            font-family: ${branding.fontFamily}, sans-serif;
          ">${businessUnit.name}</h1>
        `
            : ""
        }
        
        ${
          headerConfig.showTaxInfo && businessUnit.taxId
            ? `
          <p style="
            margin: 0;
            color: ${branding.secondaryColor};
            font-size: 14px;
            font-family: ${branding.fontFamily}, sans-serif;
          ">
            ${businessUnit.taxId}
          </p>
        `
            : ""
        }
      </div>
    </div>
  `;
}

/**
 * Build document footer based on branding configuration
 */
export function buildFooter(
  branding: BrandingConfig,
  businessUnit: BusinessUnitInfo,
): string {
  const { footerConfig } = branding;

  return `
    <div class="document-footer" style="
      min-height: ${footerConfig.height}px;
      padding: 20px;
      border-top: 1px solid ${branding.secondaryColor}40;
      background: ${branding.secondaryColor}08;
      font-family: ${branding.fontFamily}, sans-serif;
      font-size: 12px;
      color: ${branding.secondaryColor};
    ">
      ${
        footerConfig.showContactInfo
          ? `
        <div class="footer-contact" style="margin-bottom: 12px;">
          ${businessUnit.email ? `<span style="margin-right: 16px;">📧 ${businessUnit.email}</span>` : ""}
          ${businessUnit.phone ? `<span style="margin-right: 16px;">📞 ${businessUnit.phone}</span>` : ""}
          ${businessUnit.website ? `<span>🌐 ${businessUnit.website}</span>` : ""}
        </div>
        ${businessUnit.address ? `<div style="margin-bottom: 8px;">${businessUnit.address}</div>` : ""}
      `
          : ""
      }
      
      ${
        footerConfig.showDisclaimer && footerConfig.disclaimerText
          ? `
        <div class="footer-disclaimer" style="
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid ${branding.secondaryColor}20;
          font-size: 10px;
          font-style: italic;
        ">
          ${footerConfig.disclaimerText}
        </div>
      `
          : ""
      }
      
      <div class="footer-meta" style="
        margin-top: 12px;
        text-align: center;
        opacity: 0.7;
        font-size: 10px;
      ">
        Generado el ${new Date().toLocaleDateString("es")}
      </div>
    </div>
  `;
}

/**
 * Build complete HTML document with header, content, and footer
 */
export function buildDocument(
  branding: BrandingConfig,
  businessUnit: BusinessUnitInfo,
  content: string,
  documentType: DocumentType,
  title?: string,
): string {
  const header = buildHeader(branding, businessUnit);
  const footer = buildFooter(branding, businessUnit);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || documentType.toUpperCase()}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: ${branding.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
          color: #1e293b;
          line-height: 1.6;
          background: white;
        }
        
        .document-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .document-content {
          flex: 1;
          padding: 40px;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: ${branding.primaryColor};
          margin-bottom: 16px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid ${branding.secondaryColor}20;
        }
        
        th {
          background: ${branding.primaryColor}10;
          color: ${branding.primaryColor};
          font-weight: 600;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        
        .info-item {
          padding: 16px;
          background: ${branding.secondaryColor}05;
          border-left: 3px solid ${branding.primaryColor};
          border-radius: 4px;
        }
        
        .info-label {
          font-size: 12px;
          color: ${branding.secondaryColor};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }
        
        @media print {
          .document-container {
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        ${header}
        
        <div class="document-content">
          ${content}
        </div>
        
        ${footer}
      </div>
    </body>
    </html>
  `;
}

/**
 * Build content for different document types
 * These are example templates - customize per document type
 */
export function buildQuotationContent(data: any): string {
  return `
    <h2>Cotización #${data.code || "N/A"}</h2>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Cliente</div>
        <div class="info-value">${data.clientName || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Fecha</div>
        <div class="info-value">${new Date(data.date || Date.now()).toLocaleDateString("es")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Válida hasta</div>
        <div class="info-value">${new Date(data.validUntil || Date.now()).toLocaleDateString("es")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total</div>
        <div class="info-value">${data.currency || "USD"} ${data.total || 0}</div>
      </div>
    </div>
    
    <h3>Detalles</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Cantidad</th>
          <th>Precio Unit.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.items
            ?.map(
              (item: any) => `
          <tr>
            <td>${item.description || ""}</td>
            <td>${item.quantity || 0}</td>
            <td>${data.currency || "USD"} ${item.unitPrice || 0}</td>
            <td>${data.currency || "USD"} ${item.total || 0}</td>
          </tr>
        `,
            )
            .join("") || "<tr><td colspan='4'>No hay items</td></tr>"
        }
      </tbody>
    </table>
  `;
}

export function buildContractContent(data: any): string {
  return `
    <h2>Contrato #${data.code || "N/A"}</h2>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Partes</div>
        <div class="info-value">${data.parties || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Fecha Inicio</div>
        <div class="info-value">${new Date(data.startDate || Date.now()).toLocaleDateString("es")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Fecha Fin</div>
        <div class="info-value">${new Date(data.endDate || Date.now()).toLocaleDateString("es")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Monto</div>
        <div class="info-value">${data.currency || "USD"} ${data.amount || 0}</div>
      </div>
    </div>
    
    <h3>Términos y Condiciones</h3>
    <div style="line-height: 1.8;">
      ${data.terms || "No se especificaron términos."}
    </div>
  `;
}

export function buildReceiptContent(data: any): string {
  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="margin-bottom: 8px;">RECIBO</h2>
      <p style="font-size: 14px; color: #64748b;">No. ${data.receiptNumber || "N/A"}</p>
    </div>
    
    <div style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 12px 0; margin: 20px 0;">
      <p><strong>Fecha:</strong> ${new Date(data.date || Date.now()).toLocaleDateString("es")}</p>
      <p><strong>Cliente:</strong> ${data.clientName || "N/A"}</p>
    </div>
    
    <table style="width: 100%; margin: 20px 0;">
      ${
        data.items
          ?.map(
            (item: any) => `
        <tr>
          <td style="border: none;">${item.description}</td>
          <td style="border: none; text-align: right;">${data.currency || "USD"} ${item.amount}</td>
        </tr>
      `,
          )
          .join("") || ""
      }
    </table>
    
    <div style="border-top: 2px solid #1e293b; padding-top: 12px; margin-top: 12px; text-align: right;">
      <p style="font-size: 18px; font-weight: bold;">TOTAL: ${data.currency || "USD"} ${data.total || 0}</p>
    </div>
  `;
}

/**
 * PDF Generation Service using Puppeteer
 * Supports A4 and ticket (receipt) formats
 */

import puppeteer from "puppeteer";
import type { DocumentFormat } from "../types/branding.types";

export interface PDFOptions {
  format?: DocumentFormat;
  filename?: string;
  landscape?: boolean;
}

export interface TicketDimensions {
  width: string; // e.g., "80mm"
  height?: string; // e.g., "auto" or specific height
}

class PDFGeneratorService {
  private browserInstance: any = null;

  /**
   * Get or create browser instance (reuse for performance)
   */
  private async getBrowser() {
    if (!this.browserInstance) {
      this.browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
    }
    return this.browserInstance;
  }

  /**
   * Generate PDF from HTML string
   */
  async generatePDF(html: string, options: PDFOptions = {}): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set content
      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      // Determine format
      const format = options.format || "A4";

      let pdfBuffer: Buffer;

      if (format === "ticket") {
        // Ticket/Receipt format (80mm width, common for thermal printers)
        pdfBuffer = await page.pdf({
          width: "80mm",
          height: "auto", // Dynamic height based on content
          printBackground: true,
          margin: {
            top: "5mm",
            right: "5mm",
            bottom: "5mm",
            left: "5mm",
          },
        });
      } else {
        // A4 format (standard document)
        pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          landscape: options.landscape || false,
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
        });
      }

      await page.close();
      return pdfBuffer;
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Generate PDF and upload to Azure Blob Storage
   * (Integrates with existing Azure service)
   */
  async generateAndUpload(
    html: string,
    options: PDFOptions & {
      containerName?: string;
      tenantId: string;
      businessUnitId?: string;
      folder?: string;
    },
  ): Promise<string> {
    const pdfBuffer = await this.generatePDF(html, options);

    // Import Azure service
    const { azureBlobStorageService } =
      await import("../../shared/storage/azure-blob-storage.service");

    const filename = options.filename || `document-${Date.now()}.pdf`;

    const result = await azureBlobStorageService.uploadFile({
      file: pdfBuffer,
      fileName: filename,
      contentType: "application/pdf",
      folder: options.folder || "documents",
      tenantId: options.tenantId,
      businessUnitId: options.businessUnitId,
    });

    return result.url;
  }

  /**
   * Generate test PDF for branding preview
   */
  async generateTestPDF(
    html: string,
    format: DocumentFormat = "A4",
  ): Promise<Buffer> {
    return this.generatePDF(html, { format });
  }

  /**
   * Close browser instance (cleanup)
   */
  async closeBrowser() {
    if (this.browserInstance) {
      await this.browserInstance.close();
      this.browserInstance = null;
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();

// Cleanup on process exit
process.on("SIGINT", async () => {
  await pdfGeneratorService.closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pdfGeneratorService.closeBrowser();
  process.exit(0);
});

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
      console.log("[PDFGenerator] Launching Puppeteer browser...");

      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

      if (executablePath) {
        console.log("[PDFGenerator] Using Chromium from:", executablePath);
      } else {
        console.log("[PDFGenerator] Using Puppeteer bundled Chromium");
      }

      this.browserInstance = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-crash-reporter",
          "--disable-breakpad",
          "--disable-crash-reporting", // Additional crash reporting flag
          "--disable-component-update",
          "--disable-client-side-phishing-detection",
          "--disable-sync",
          "--metrics-recording-only",
          "--no-crash-upload",
          "--disable-extensions",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-ipc-flooding-protection",
          "--no-first-run",
          "--no-zygote",
          "--single-process", // Critical for Docker environments
          "--mute-audio",
          "--hide-scrollbars",
          "--disable-features=VizDisplayCompositor",
        ],
        dumpio: false, // Don't dump browser process stderr
        env: {
          ...process.env,
          TMPDIR: "/tmp/.chrome", // Use our writable temp directory
        },
      });
      console.log("[PDFGenerator] Browser launched successfully");
    }
    return this.browserInstance;
  }

  /**
   * Generate PDF from HTML string
   */
  async generatePDF(html: string, options: PDFOptions = {}): Promise<Buffer> {
    console.log(
      "[PDFGenerator] Starting PDF generation, HTML length:",
      html.length,
    );

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      console.log("[PDFGenerator] Setting page content...");

      // Set content
      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      console.log("[PDFGenerator] Content set, generating PDF...");

      // Determine format
      const format = options.format || "A4";

      let pdfBuffer: Buffer;

      if (format === "ticket") {
        console.log("[PDFGenerator] Using ticket format");
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
        console.log("[PDFGenerator] Using A4 format");
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

      console.log(
        "[PDFGenerator] PDF generated successfully, size:",
        pdfBuffer.length,
        "bytes",
      );

      await page.close();
      return pdfBuffer;
    } catch (error) {
      console.error("[PDFGenerator] Error generating PDF:", error);
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

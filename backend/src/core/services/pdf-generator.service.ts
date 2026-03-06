/**
 * PDF Generation Service using Playwright
 * Supports A4, Letter and ticket (receipt) formats
 */

import { chromium, Browser } from "playwright";
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
  private browserInstance: Browser | null = null;

  /**
   * Get or create browser instance (reuse for performance)
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browserInstance) {
      console.log("[PDFGenerator] Launching Playwright Chromium...");

      this.browserInstance = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      });

      // Auto-clear on unexpected disconnect so the next call relaunches
      this.browserInstance.on("disconnected", () => {
        console.warn(
          "[PDFGenerator] Browser disconnected — will relaunch on next request",
        );
        this.browserInstance = null;
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

    let browser: Browser;
    try {
      browser = await this.getBrowser();
    } catch (launchError: any) {
      console.error("[PDFGenerator] Failed to launch browser:", launchError);
      throw new Error(
        `No se pudo iniciar el motor de PDF (Chromium). Detalles: ${launchError.message}`,
      );
    }

    const page = await browser.newPage();

    try {
      console.log("[PDFGenerator] Setting page content...");

      // Use domcontentloaded instead of networkidle to avoid blocking on
      // external resources (Google Fonts, CDN images, etc.)
      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });

      // Wait briefly for external images (e.g. branding logo) to load
      await Promise.race([
        page.evaluate(async () => {
          // Runs in browser context via Puppeteer — document is available there
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const images: any[] = Array.from(
            (globalThis as any).document?.images ?? [],
          );
          await Promise.all(
            images.map(
              (img: any) =>
                new Promise<void>((resolve) => {
                  if (img.complete) {
                    resolve();
                    return;
                  }
                  img.addEventListener("load", () => resolve(), {
                    once: true,
                  });
                  img.addEventListener("error", () => resolve(), {
                    once: true,
                  });
                }),
            ),
          );
        }),
        page.waitForTimeout(4000),
      ]);

      // Give inline scripts / web fonts a brief moment to settle
      await page.waitForTimeout(250);

      console.log("[PDFGenerator] Content set, generating PDF...");

      // Determine format
      const format = options.format || "A4";

      let pdfBuffer: Buffer;

      if (format === "ticket") {
        console.log("[PDFGenerator] Using ticket format");
        // Ticket/Receipt format (80mm width, common for thermal printers)
        pdfBuffer = await page.pdf({
          width: "80mm",
          printBackground: true,
          margin: {
            top: "5mm",
            right: "5mm",
            bottom: "5mm",
            left: "5mm",
          },
        });
      } else if (format === "Letter") {
        console.log("[PDFGenerator] Using Letter format");
        // Letter format (US standard document)
        pdfBuffer = await page.pdf({
          format: "Letter",
          printBackground: true,
          landscape: options.landscape || false,
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
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

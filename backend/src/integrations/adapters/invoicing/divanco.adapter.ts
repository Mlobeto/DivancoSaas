import type {
  InvoiceProvider,
  InvoiceConfig,
  CreateInvoiceInput,
  InvoiceResult,
  StampResult,
  CancelInvoiceInput,
  CancelInvoiceResult,
  Invoice,
} from "@core/contracts/invoice.provider";

/**
 * Adapter para Divanco
 * Proveedor de facturación electrónica personalizado
 */
export class DivancoAdapter implements InvoiceProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private config: InvoiceConfig) {
    this.baseUrl =
      config.environment === "production"
        ? "https://api.divanco.com/v1"
        : "https://sandbox.divanco.com/v1";

    if (!config.apiKey || !config.apiSecret) {
      throw new Error("Divanco requires apiKey and apiSecret in config");
    }

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "X-API-Secret": this.apiSecret,
    };
  }

  async createInvoice(data: CreateInvoiceInput): Promise<InvoiceResult> {
    try {
      // Mapear estructura a formato Divanco
      const divancoPayload = {
        issuer: data.issuer,
        receiver: data.receiver,
        items: data.items,
        totals: {
          subtotal: data.subtotal,
          discount: data.discount,
          taxes: data.taxes,
          total: data.total,
        },
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        payment: {
          form: data.paymentForm,
          method: data.paymentMethod,
        },
        series: data.series,
        folio: data.folio,
        date: data.date,
        notes: data.notes,
        metadata: data.metadata,
      };

      const response = await fetch(`${this.baseUrl}/invoices`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(divancoPayload),
      });

      if (!response.ok) {
        const error: any = await response.json();
        return {
          success: false,
          invoiceId: "",
          status: "error",
          errors: [error.message || "Error creating invoice"],
        };
      }

      const result: any = await response.json();

      return {
        success: true,
        invoiceId: result.id,
        uuid: result.uuid,
        folio: result.folio,
        series: result.series,
        invoiceNumber: result.invoiceNumber,
        status: result.status,
        pdfUrl: result.pdfUrl,
        xmlUrl: result.xmlUrl,
        stampDate: result.stampDate ? new Date(result.stampDate) : undefined,
        satCertNumber: result.satCertNumber,
        metadata: {
          provider: "divanco",
          raw: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        invoiceId: "",
        status: "error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async stampInvoice(invoiceId: string): Promise<StampResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/invoices/${invoiceId}/stamp`,
        {
          method: "POST",
          headers: this.getHeaders(),
        },
      );

      if (!response.ok) {
        const error: any = await response.json();
        return {
          success: false,
          errors: [error.message || "Error stamping invoice"],
        };
      }

      const result: any = await response.json();

      return {
        success: true,
        uuid: result.uuid,
        satCertNumber: result.satCertNumber,
        stampDate: new Date(result.stampDate),
        xmlUrl: result.xmlUrl,
        pdfUrl: result.pdfUrl,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async cancelInvoice(data: CancelInvoiceInput): Promise<CancelInvoiceResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/invoices/${data.invoiceId}/cancel`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            uuid: data.uuid,
            reason: data.reason,
            replacementUuid: data.replacementUuid,
          }),
        },
      );

      if (!response.ok) {
        const error: any = await response.json();
        return {
          success: false,
          status: "error",
          errors: [error.message || "Error cancelling invoice"],
        };
      }

      const result: any = await response.json();

      return {
        success: true,
        status: result.status,
        cancelledAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        status: "error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Invoice not found");
    }

    const data: any = await response.json();

    return {
      id: data.id,
      uuid: data.uuid,
      folio: data.folio,
      series: data.series,
      status: data.status,
      issuer: data.issuer,
      receiver: data.receiver,
      total: data.total,
      currency: data.currency,
      createdAt: new Date(data.createdAt),
      stampedAt: data.stampedAt ? new Date(data.stampedAt) : undefined,
      cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : undefined,
      pdfUrl: data.pdfUrl,
      xmlUrl: data.xmlUrl,
      metadata: {
        provider: "divanco",
        raw: data,
      },
    };
  }

  async downloadXml(invoiceId: string): Promise<Buffer> {
    const response = await fetch(
      `${this.baseUrl}/invoices/${invoiceId}/download/xml`,
      {
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("XML not available");
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async downloadPdf(invoiceId: string): Promise<Buffer> {
    const response = await fetch(
      `${this.baseUrl}/invoices/${invoiceId}/download/pdf`,
      {
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("PDF not available");
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

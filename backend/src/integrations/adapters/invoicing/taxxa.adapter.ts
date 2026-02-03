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
 * Adapter para Taxxa (https://taxxa.io)
 * Proveedor de facturación electrónica para México
 */
export class TaxxaAdapter implements InvoiceProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private config: InvoiceConfig) {
    this.baseUrl =
      config.environment === "production"
        ? "https://api.taxxa.io/v1"
        : "https://sandbox.taxxa.io/v1";

    if (!config.apiKey) {
      throw new Error("Taxxa requires apiKey in config");
    }
    this.apiKey = config.apiKey;
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Verificar credenciales con endpoint de health/auth
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async createInvoice(data: CreateInvoiceInput): Promise<InvoiceResult> {
    try {
      // Mapear estructura de nuestro sistema a Taxxa
      const taxxaPayload = {
        receptor: {
          rfc: data.receiver.rfc,
          nombre: data.receiver.name,
          uso_cfdi: data.receiver.cfdiUse || "G03",
          regimen_fiscal: data.receiver.taxRegime,
          domicilio: data.receiver.address,
        },
        conceptos: data.items.map((item) => ({
          cantidad: item.quantity,
          unidad: item.unit,
          clave_prod_serv: item.productCode,
          descripcion: item.description,
          valor_unitario: item.unitPrice,
          importe: item.total,
          objeto_imp: item.taxObject || "02",
          impuestos: item.taxes?.map((tax) => ({
            tipo: tax.type,
            tasa: tax.rate,
            importe: tax.amount,
          })),
        })),
        subtotal: data.subtotal,
        descuento: data.discount,
        total: data.total,
        moneda: data.currency,
        forma_pago: data.paymentForm || "01",
        metodo_pago: data.paymentMethod || "PUE",
        serie: data.series,
        folio: data.folio,
        fecha: data.date?.toISOString(),
        observaciones: data.notes,
      };

      const response = await fetch(`${this.baseUrl}/cfdi/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(taxxaPayload),
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
        series: result.serie,
        invoiceNumber: `${result.serie || ""}-${result.folio}`,
        status: result.status === "timbrado" ? "stamped" : "draft",
        pdfUrl: result.pdf_url,
        xmlUrl: result.xml_url,
        stampDate: result.fecha_timbrado
          ? new Date(result.fecha_timbrado)
          : undefined,
        satCertNumber: result.no_certificado_sat,
        metadata: {
          provider: "taxxa",
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
      const response = await fetch(`${this.baseUrl}/cfdi/${invoiceId}/stamp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

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
        satCertNumber: result.no_certificado_sat,
        stampDate: new Date(result.fecha_timbrado),
        xmlUrl: result.xml_url,
        pdfUrl: result.pdf_url,
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
        `${this.baseUrl}/cfdi/${data.invoiceId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            uuid: data.uuid,
            motivo: data.reason || "02", // 02 = Comprobante emitido con errores con relación
            uuid_reemplazo: data.replacementUuid,
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
    const response = await fetch(`${this.baseUrl}/cfdi/${invoiceId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error("Invoice not found");
    }

    const data: any = await response.json();

    return {
      id: data.id,
      uuid: data.uuid,
      folio: data.folio,
      series: data.serie,
      status:
        data.status === "timbrado"
          ? "stamped"
          : data.status === "cancelado"
            ? "cancelled"
            : "draft",
      issuer: {
        rfc: data.emisor.rfc,
        name: data.emisor.nombre,
      },
      receiver: {
        rfc: data.receptor.rfc,
        name: data.receptor.nombre,
      },
      total: data.total,
      currency: data.moneda,
      createdAt: new Date(data.fecha_creacion),
      stampedAt: data.fecha_timbrado
        ? new Date(data.fecha_timbrado)
        : undefined,
      cancelledAt: data.fecha_cancelacion
        ? new Date(data.fecha_cancelacion)
        : undefined,
      pdfUrl: data.pdf_url,
      xmlUrl: data.xml_url,
      metadata: {
        provider: "taxxa",
        raw: data,
      },
    };
  }

  async downloadXml(invoiceId: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice.xmlUrl) {
      throw new Error("XML not available");
    }

    const response = await fetch(invoice.xmlUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async downloadPdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice.pdfUrl) {
      throw new Error("PDF not available");
    }

    const response = await fetch(invoice.pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

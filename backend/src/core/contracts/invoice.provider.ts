/**
 * Contrato para proveedores de facturación electrónica
 * Soporta múltiples proveedores (Taxxa, Divanco, etc.)
 */

export interface InvoiceConfig {
  provider: string; // "taxxa", "divanco", etc.
  apiKey?: string;
  apiSecret?: string;
  environment: "sandbox" | "production";
  rfc?: string; // Para México
  certificatePath?: string;
  keyPath?: string;
  metadata?: Record<string, any>;
}

export interface CreateInvoiceInput {
  // Datos del emisor
  issuer: {
    rfc: string;
    name: string;
    taxRegime: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };

  // Datos del receptor
  receiver: {
    rfc: string;
    name: string;
    taxRegime?: string;
    cfdiUse?: string; // Uso del CFDI (México)
    email?: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };

  // Conceptos/Items
  items: Array<{
    quantity: number;
    unit: string;
    productCode: string; // Clave SAT en México
    description: string;
    unitPrice: number;
    total: number;
    taxObject?: string;
    taxes?: Array<{
      type: "IVA" | "ISR" | "IEPS";
      rate: number;
      amount: number;
    }>;
    discount?: number;
  }>;

  // Totales
  subtotal: number;
  discount?: number;
  taxes: Array<{
    type: string;
    rate: number;
    amount: number;
  }>;
  total: number;

  // Información adicional
  currency: string;
  exchangeRate?: number;
  paymentForm?: string;
  paymentMethod?: string;
  series?: string;
  folio?: string;
  date?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId: string;
  uuid?: string; // UUID fiscal (México)
  folio?: string;
  series?: string;
  invoiceNumber?: string;
  status: "draft" | "stamped" | "cancelled" | "error";
  pdfUrl?: string;
  xmlUrl?: string;
  stampDate?: Date;
  satCertNumber?: string; // Número de certificado SAT
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  uuid?: string;
  folio?: string;
  series?: string;
  status: "draft" | "stamped" | "cancelled" | "error";
  issuer: {
    rfc: string;
    name: string;
  };
  receiver: {
    rfc: string;
    name: string;
  };
  total: number;
  currency: string;
  createdAt: Date;
  stampedAt?: Date;
  cancelledAt?: Date;
  pdfUrl?: string;
  xmlUrl?: string;
  metadata?: Record<string, any>;
}

export interface StampResult {
  success: boolean;
  uuid?: string;
  satCertNumber?: string;
  stampDate?: Date;
  xmlUrl?: string;
  pdfUrl?: string;
  errors?: string[];
}

export interface CancelInvoiceInput {
  invoiceId: string;
  uuid?: string;
  reason?: string;
  replacementUuid?: string; // UUID de factura de reemplazo
}

export interface CancelInvoiceResult {
  success: boolean;
  status: string;
  cancelledAt?: Date;
  errors?: string[];
}

/**
 * Interface principal para proveedores de facturación
 */
export interface InvoiceProvider {
  /**
   * Crear una factura (puede quedar en borrador o timbrada según el provider)
   */
  createInvoice(data: CreateInvoiceInput): Promise<InvoiceResult>;

  /**
   * Timbrar una factura (para providers que separan creación y timbrado)
   */
  stampInvoice(invoiceId: string): Promise<StampResult>;

  /**
   * Cancelar una factura
   */
  cancelInvoice(data: CancelInvoiceInput): Promise<CancelInvoiceResult>;

  /**
   * Obtener información de una factura
   */
  getInvoice(invoiceId: string): Promise<Invoice>;

  /**
   * Descargar XML de la factura
   */
  downloadXml(invoiceId: string): Promise<Buffer>;

  /**
   * Descargar PDF de la factura
   */
  downloadPdf(invoiceId: string): Promise<Buffer>;

  /**
   * Validar configuración del provider
   */
  validateConfig(): Promise<boolean>;
}

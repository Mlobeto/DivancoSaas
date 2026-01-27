/**
 * CONTRACTS: Interfaces que define el CORE
 * Las implementaciones concretas viven en /adapters
 */

// ============================================
// PLATFORM PAYMENT PROVIDER (Billing SaaS)
// ============================================

/**
 * IMPORTANTE: Este contrato es SOLO para pagos de la PLATAFORMA (billing SaaS)
 * - Suscripciones de planes (Free, Pro, Enterprise)
 * - Upgrades/downgrades
 * - Trials
 * - Billing de la plataforma
 *
 * NO es para:
 * - Pagos de módulos comerciales
 * - Facturación de negocios
 * - Transacciones entre usuarios
 */
export interface PlatformPaymentProvider {
  readonly name: string;

  /**
   * Crear intención de pago para suscripción de plataforma
   */
  createSubscriptionPayment(
    params: SubscriptionPaymentParams,
  ): Promise<PlatformPaymentIntent>;

  /**
   * Confirmar pago de suscripción
   */
  confirmSubscriptionPayment(
    paymentIntentId: string,
  ): Promise<PlatformPaymentResult>;

  /**
   * Reembolsar pago de suscripción (downgrades, cancelaciones)
   */
  refundSubscriptionPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<PlatformRefundResult>;

  /**
   * Verificar webhook de proveedor (firma de integridad)
   */
  verifyWebhookSignature(payload: any, signature: string): boolean;

  /**
   * Obtener URL de checkout (para redirección)
   */
  getCheckoutUrl?(paymentIntentId: string): Promise<string>;
}

export interface SubscriptionPaymentParams {
  tenantId: string;
  plan: string; // 'free', 'pro', 'enterprise'
  amount: number;
  currency: string;
  billingEmail: string;
  metadata?: {
    tenantName?: string;
    country?: string;
    [key: string]: any;
  };
}

export interface PlatformPaymentIntent {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled";
  clientSecret?: string; // Para frontend
  checkoutUrl?: string; // Para redirección
}

export interface PlatformPaymentResult {
  success: boolean;
  paymentId: string;
  status: "succeeded" | "failed" | "pending";
  transactionId?: string; // ID del proveedor
  error?: string;
}

export interface PlatformRefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  error?: string;
}

// ============================================
// PAYMENT PROVIDER (para módulos comerciales)
// ============================================
// TODO: Implementar cuando existan módulos de negocio

export interface PaymentProvider {
  readonly name: string;

  /**
   * Crear intención de pago
   */
  createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntent>;

  /**
   * Confirmar pago
   */
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>;

  /**
   * Reembolsar pago
   */
  refund(paymentIntentId: string, amount?: number): Promise<RefundResult>;

  /**
   * Verificar webhook (firma)
   */
  verifyWebhook(payload: any, signature: string): boolean;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  clientSecret?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  error?: string;
}

// ============================================
// STORAGE PROVIDER
// ============================================

export interface StorageProvider {
  readonly name: string;

  /**
   * Subir archivo
   */
  upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Obtener URL pública o firmada
   */
  getUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Eliminar archivo
   */
  delete(key: string): Promise<boolean>;

  /**
   * Listar archivos
   */
  list(prefix: string): Promise<string[]>;
}

export interface UploadParams {
  file: Buffer | ReadableStream;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

// ============================================
// EMAIL PROVIDER
// ============================================

export interface EmailProvider {
  readonly name: string;

  /**
   * Enviar email
   */
  send(params: SendEmailParams): Promise<EmailResult>;

  /**
   * Enviar email desde template
   */
  sendTemplate(params: SendTemplateEmailParams): Promise<EmailResult>;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface SendTemplateEmailParams extends Omit<
  SendEmailParams,
  "html" | "text"
> {
  templateId: string;
  variables: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// SMS PROVIDER
// ============================================

export interface SmsProvider {
  readonly name: string;

  /**
   * Enviar SMS
   */
  send(params: SendSmsParams): Promise<SmsResult>;
}

export interface SendSmsParams {
  to: string;
  message: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// INVOICE PROVIDER (Facturación electrónica)
// ============================================

export interface InvoiceProvider {
  readonly name: string;

  /**
   * Crear factura electrónica
   */
  createInvoice(params: CreateInvoiceParams): Promise<InvoiceResult>;

  /**
   * Anular factura
   */
  cancelInvoice(invoiceId: string): Promise<boolean>;

  /**
   * Obtener PDF de factura
   */
  getInvoicePdf(invoiceId: string): Promise<Buffer>;
}

export interface CreateInvoiceParams {
  customer: {
    name: string;
    taxId: string;
    email?: string;
    address?: string;
  };
  items: InvoiceItem[];
  currency: string;
  dueDate?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId: string;
  invoiceNumber?: string;
  pdfUrl?: string;
  error?: string;
}

// ============================================
// SHIPPING PROVIDER
// ============================================

export interface ShippingProvider {
  readonly name: string;

  /**
   * Calcular costo de envío
   */
  calculateShipping(params: CalculateShippingParams): Promise<ShippingQuote[]>;

  /**
   * Crear envío
   */
  createShipment(params: CreateShipmentParams): Promise<ShipmentResult>;

  /**
   * Rastrear envío
   */
  trackShipment(trackingNumber: string): Promise<TrackingInfo>;

  /**
   * Cancelar envío
   */
  cancelShipment(shipmentId: string): Promise<boolean>;
}

export interface CalculateShippingParams {
  origin: Address;
  destination: Address;
  packages: Package[];
}

export interface CreateShipmentParams extends CalculateShippingParams {
  serviceCode: string;
  metadata?: Record<string, any>;
}

export interface Address {
  name?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Package {
  weight: number;
  weightUnit: "kg" | "lb";
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: "cm" | "in";
  };
}

export interface ShippingQuote {
  serviceCode: string;
  serviceName: string;
  cost: number;
  currency: string;
  estimatedDays?: number;
}

export interface ShipmentResult {
  success: boolean;
  shipmentId: string;
  trackingNumber: string;
  labelUrl?: string;
  cost?: number;
  error?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  events: TrackingEvent[];
  estimatedDelivery?: Date;
}

export interface TrackingEvent {
  date: Date;
  status: string;
  location?: string;
  description?: string;
}

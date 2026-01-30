/**
 * PAYMENT PROVIDER CONTRACT (CORE)
 * Contrato para proveedores de pago de la PLATAFORMA SaaS
 *
 * IMPORTANTE: Este contrato es SOLO para billing de la plataforma
 * - Suscripciones de planes (Free, Pro, Enterprise)
 * - Upgrades/downgrades de la plataforma
 * - Trials
 *
 * NO es para:
 * - Pagos de módulos comerciales (eso es otro contrato)
 * - Facturación de negocios
 * - Transacciones entre usuarios
 */

// ============================================
// PLATFORM PAYMENT PROVIDER (Billing SaaS)
// ============================================

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
   * Verificar firma de webhook para validar autenticidad
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
// PAYMENT EVENTS (Core normalizado)
// ============================================

/**
 * Evento de pago normalizado que recibe el CORE
 * El adapter parsea y valida el webhook, luego envía esto al core
 */
export interface PaymentEvent {
  eventId: string;
  eventType: PaymentEventType;
  timestamp: Date;
  provider: string; // 'stripe', 'wompi', 'mercadopago'
  paymentIntentId: string;
  tenantId?: string;
  amount?: number;
  currency?: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
}

export enum PaymentEventType {
  PAYMENT_SUCCEEDED = "payment.succeeded",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_PENDING = "payment.pending",
  PAYMENT_CANCELLED = "payment.cancelled",
  REFUND_COMPLETED = "refund.completed",
  REFUND_FAILED = "refund.failed",
}

export enum PaymentStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  PENDING = "pending",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

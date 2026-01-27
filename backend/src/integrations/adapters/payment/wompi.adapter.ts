/**
 * WOMPI ADAPTER (Colombia)
 * Implementación de PlatformPaymentProvider para Wompi con soporte 3DS
 * Uso: Colombia específicamente (mejor experiencia 3DS)
 * Docs: https://docs.wompi.co/
 */

import {
  PlatformPaymentProvider,
  SubscriptionPaymentParams,
  PlatformPaymentIntent,
  PlatformPaymentResult,
  PlatformRefundResult,
  PaymentEvent,
  PaymentEventType,
  PaymentStatus,
} from "@core/contracts/payment.provider";
import { WebhookAdapter } from "@core/contracts/webhook.adapter";

export class WompiAdapter implements PlatformPaymentProvider, WebhookAdapter {
  readonly name = "wompi";
  private publicKey: string;
  private privateKey: string;
  private eventsSecret: string;
  private environment: "test" | "production";
  private baseUrl: string;

  constructor(config: {
    publicKey: string;
    privateKey: string;
    eventsSecret: string;
    environment?: "test" | "production";
  }) {
    this.publicKey = config.publicKey;
    this.privateKey = config.privateKey;
    this.eventsSecret = config.eventsSecret;
    this.environment = config.environment || "test";
    this.baseUrl =
      this.environment === "production"
        ? "https://production.wompi.co/v1"
        : "https://sandbox.wompi.co/v1";

    if (!this.privateKey) {
      throw new Error("Wompi private key is required");
    }
  }

  async createSubscriptionPayment(
    params: SubscriptionPaymentParams,
  ): Promise<PlatformPaymentIntent> {
    try {
      // Wompi usa "transacciones" en lugar de payment intents
      // TODO: Integrar con API de Wompi
      // const response = await fetch(`${this.baseUrl}/transactions`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.privateKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     amount_in_cents: params.amount * 100, // Wompi usa centavos
      //     currency: params.currency.toUpperCase(), // COP principalmente
      //     signature: this.generateSignature(params), // Integridad
      //     customer_email: params.billingEmail,
      //     reference: `sub_${params.tenantId}_${Date.now()}`,
      //     redirect_url: params.metadata?.redirectUrl,
      //     // 3DS habilitado por defecto en Wompi
      //   }),
      // });

      // Mock para desarrollo
      return {
        id: `txn_wompi_${Date.now()}`,
        tenantId: params.tenantId,
        amount: params.amount,
        currency: params.currency,
        status: "pending",
        checkoutUrl: "https://sandbox.wompi.co/checkout/mock",
      };
    } catch (error) {
      throw new Error(`Wompi createSubscriptionPayment failed: ${error}`);
    }
  }

  async confirmSubscriptionPayment(
    paymentIntentId: string,
  ): Promise<PlatformPaymentResult> {
    try {
      // Wompi maneja la confirmación mediante 3DS automáticamente
      // Solo necesitamos consultar el estado
      // TODO: Integrar con API de Wompi
      // const response = await fetch(`${this.baseUrl}/transactions/${paymentIntentId}`, {
      //   headers: {
      //     'Authorization': `Bearer ${this.privateKey}`,
      //   },
      // });
      // const transaction = await response.json();

      return {
        success: true,
        paymentId: paymentIntentId,
        status: "succeeded",
        transactionId: paymentIntentId,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: paymentIntentId,
        status: "failed",
        error: String(error),
      };
    }
  }

  async refundSubscriptionPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<PlatformRefundResult> {
    try {
      // Wompi maneja devoluciones (voids/refunds)
      // TODO: Integrar con API de Wompi
      // const response = await fetch(`${this.baseUrl}/transactions/${paymentIntentId}/void`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.privateKey}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      return {
        success: true,
        refundId: `void_wompi_${Date.now()}`,
        amount: amount || 0,
      };
    } catch (error) {
      return {
        success: false,
        refundId: "",
        amount: 0,
        error: String(error),
      };
    }
  }

  /**
   * Parsea webhook de Wompi y devuelve evento normalizado
   */
  async parseWebhook(
    rawPayload: any,
    signature: string,
  ): Promise<PaymentEvent | null> {
    try {
      // 1. Verificar firma
      // TODO: Verificar con eventsSecret
      // const crypto = require('crypto');
      // const expectedSignature = crypto
      //   .createHash('sha256')
      //   .update(JSON.stringify(rawPayload) + this.eventsSecret)
      //   .digest('hex');
      // if (signature !== expectedSignature) return null;

      // 2. Parsear y normalizar evento
      const event: PaymentEvent = {
        eventId: rawPayload.id || `evt_wompi_${Date.now()}`,
        eventType: this.mapWompiEventType(
          rawPayload.event,
          rawPayload.data?.transaction?.status,
        ),
        timestamp: new Date(rawPayload.sent_at || Date.now()),
        provider: "wompi",
        paymentIntentId: rawPayload.data?.transaction?.id || "",
        status: this.mapWompiStatus(rawPayload.data?.transaction?.status),
        amount: rawPayload.data?.transaction?.amount_in_cents
          ? rawPayload.data.transaction.amount_in_cents / 100
          : undefined,
        currency: rawPayload.data?.transaction?.currency || "COP",
      };

      return event;
    } catch (error) {
      console.error("Wompi webhook parsing failed:", error);
      return null;
    }
  }

  private mapWompiEventType(event: string, status: string): PaymentEventType {
    if (status === "APPROVED") return PaymentEventType.PAYMENT_SUCCEEDED;
    if (status === "DECLINED") return PaymentEventType.PAYMENT_FAILED;
    if (status === "VOIDED") return PaymentEventType.REFUND_COMPLETED;
    return PaymentEventType.PAYMENT_PENDING;
  }

  private mapWompiStatus(wompiStatus: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      APPROVED: PaymentStatus.SUCCEEDED,
      DECLINED: PaymentStatus.FAILED,
      VOIDED: PaymentStatus.REFUNDED,
      ERROR: PaymentStatus.FAILED,
    };
    return mapping[wompiStatus] || PaymentStatus.PENDING;
  }

  private generateSignature(params: SubscriptionPaymentParams): string {
    // Wompi requiere una firma de integridad
    // signature = SHA256(reference + amount_in_cents + currency + integrity_key)
    // TODO: Implementar
    return "mock_signature";
  }
}

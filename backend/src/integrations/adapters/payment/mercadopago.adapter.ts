/**
 * MERCADOPAGO ADAPTER (Latam)
 * Implementación de PlatformPaymentProvider para MercadoPago
 * Uso: Argentina, México, Brasil (amplia adopción en Latam)
 * Docs: https://www.mercadopago.com/developers
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

export class MercadoPagoAdapter implements PlatformPaymentProvider, WebhookAdapter {
  readonly name = "mercadopago";
  private accessToken: string;
  private publicKey: string;
  private webhookSecret: string;

  constructor(config: {
    accessToken: string;
    publicKey: string;
    webhookSecret: string;
  }) {
    this.accessToken = config.accessToken;
    this.publicKey = config.publicKey;
    this.webhookSecret = config.webhookSecret;

    if (!this.accessToken) {
      throw new Error("MercadoPago access token is required");
    }
  }

  async createSubscriptionPayment(
    params: SubscriptionPaymentParams,
  ): Promise<PlatformPaymentIntent> {
    try {
      // MercadoPago usa "preferences" para crear intenciones de pago
      // TODO: Integrar con SDK de MercadoPago
      // const mercadopago = require('mercadopago');
      // mercadopago.configure({
      //   access_token: this.accessToken,
      // });

      // const preference = await mercadopago.preferences.create({
      //   items: [
      //     {
      //       title: `Suscripción ${params.plan} - ${params.metadata?.tenantName}`,
      //       quantity: 1,
      //       currency_id: params.currency.toUpperCase(), // ARS, MXN, BRL, etc.
      //       unit_price: params.amount,
      //     },
      //   ],
      //   payer: {
      //     email: params.billingEmail,
      //   },
      //   back_urls: {
      //     success: params.metadata?.successUrl,
      //     failure: params.metadata?.failureUrl,
      //     pending: params.metadata?.pendingUrl,
      //   },
      //   auto_return: 'approved',
      //   external_reference: `sub_${params.tenantId}`,
      // });

      // Mock para desarrollo
      return {
        id: `mp_${Date.now()}`,
        tenantId: params.tenantId,
        amount: params.amount,
        currency: params.currency,
        status: "pending",
        checkoutUrl: "https://www.mercadopago.com.ar/checkout/mock",
      };
    } catch (error) {
      throw new Error(`MercadoPago createSubscriptionPayment failed: ${error}`);
    }
  }

  async confirmSubscriptionPayment(
    paymentIntentId: string,
  ): Promise<PlatformPaymentResult> {
    try {
      // MercadoPago procesa pagos automáticamente
      // Solo necesitamos consultar el estado del payment
      // TODO: Integrar con SDK de MercadoPago
      // const mercadopago = require('mercadopago');
      // mercadopago.configure({
      //   access_token: this.accessToken,
      // });

      // const payment = await mercadopago.payment.get(paymentIntentId);

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
      // MercadoPago soporta devoluciones parciales y totales
      // TODO: Integrar con SDK de MercadoPago
      // const mercadopago = require('mercadopago');
      // mercadopago.configure({
      //   access_token: this.accessToken,
      // });

      // const refund = await mercadopago.refund.create({
      //   payment_id: paymentIntentId,
      //   amount: amount, // Si no se especifica, devuelve todo
      // });

      return {
        success: true,
        refundId: `refund_mp_${Date.now()}`,
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
   * Parsea webhook de MercadoPago y devuelve evento normalizado
   */
  async parseWebhook(rawPayload: any, signature: string): Promise<PaymentEvent | null> {
    try {
      // 1. Verificar firma
      // TODO: Verificar firma con webhookSecret
      // const crypto = require('crypto');
      // const parts = signature.split(',');
      // const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
      // const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];
      // const manifest = `id:${rawPayload.id};request-id:${rawPayload.request_id};ts:${ts};`;
      // const hmac = crypto.createHmac('sha256', this.webhookSecret).update(manifest).digest('hex');
      // if (hmac !== hash) return null;
      
      // 2. Parsear y normalizar evento
      const event: PaymentEvent = {
        eventId: rawPayload.id || `evt_mp_${Date.now()}`,
        eventType: this.mapMercadoPagoEventType(rawPayload.action, rawPayload.data?.status),
        timestamp: new Date(rawPayload.date_created || Date.now()),
        provider: 'mercadopago',
        paymentIntentId: rawPayload.data?.id || '',
        status: this.mapMercadoPagoStatus(rawPayload.data?.status),
        amount: rawPayload.data?.transaction_amount,
        currency: rawPayload.data?.currency_id,
      };
      
      return event;
    } catch (error) {
      console.error("MercadoPago webhook parsing failed:", error);
      return null;
    }
  }
  
  private mapMercadoPagoEventType(action: string, status: string): PaymentEventType {
    if (status === 'approved') return PaymentEventType.PAYMENT_SUCCEEDED;
    if (status === 'rejected' || status === 'cancelled') return PaymentEventType.PAYMENT_FAILED;
    if (action === 'payment.updated' && status === 'refunded') return PaymentEventType.REFUND_COMPLETED;
    return PaymentEventType.PAYMENT_PENDING;
  }
  
  private mapMercadoPagoStatus(mpStatus: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'approved': PaymentStatus.SUCCEEDED,
      'rejected': PaymentStatus.FAILED,
      'cancelled': PaymentStatus.CANCELLED,
      'refunded': PaymentStatus.REFUNDED,
      'pending': PaymentStatus.PENDING,
    };
    return mapping[mpStatus] || PaymentStatus.PENDING;
  }
    }
  }
}

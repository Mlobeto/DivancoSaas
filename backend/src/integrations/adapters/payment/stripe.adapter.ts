/**
 * STRIPE ADAPTER
 * Implementación de PlatformPaymentProvider para Stripe
 * Uso: Global, todos los países (fallback internacional)
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

export class StripeAdapter implements PlatformPaymentProvider, WebhookAdapter {
  readonly name = "stripe";
  private secretKey: string;
  private webhookSecret: string;

  constructor(config: { secretKey: string; webhookSecret: string }) {
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret;

    if (!this.secretKey) {
      throw new Error("Stripe secret key is required");
    }
  }

  async createSubscriptionPayment(
    params: SubscriptionPaymentParams,
  ): Promise<PlatformPaymentIntent> {
    try {
      // TODO: Integrar con Stripe SDK
      // const stripe = require('stripe')(this.secretKey);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: params.amount * 100, // Stripe usa centavos
      //   currency: params.currency,
      //   description: `Suscripción ${params.plan} - ${params.metadata?.tenantName}`,
      //   metadata: {
      //     tenantId: params.tenantId,
      //     plan: params.plan,
      //   },
      //   receipt_email: params.billingEmail,
      // });

      // Por ahora, mock para desarrollo
      return {
        id: `pi_stripe_${Date.now()}`,
        tenantId: params.tenantId,
        amount: params.amount,
        currency: params.currency,
        status: "pending",
        clientSecret: "mock_stripe_client_secret",
      };
    } catch (error) {
      throw new Error(`Stripe createSubscriptionPayment failed: ${error}`);
    }
  }

  async confirmSubscriptionPayment(
    paymentIntentId: string,
  ): Promise<PlatformPaymentResult> {
    try {
      // TODO: Integrar con Stripe SDK
      // const stripe = require('stripe')(this.secretKey);
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

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
      // TODO: Integrar con Stripe SDK
      // const stripe = require('stripe')(this.secretKey);
      // const refund = await stripe.refunds.create({
      //   payment_intent: paymentIntentId,
      //   amount: amount ? amount * 100 : undefined,
      // });

      return {
        success: true,
        refundId: `re_stripe_${Date.now()}`,
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
   * Verifica la firma del webhook de Stripe
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // Stripe usa el header 'Stripe-Signature' con formato específico
      // TODO: Implementar verificación real con Stripe SDK
      // const stripe = require('stripe')(this.secretKey);
      // try {
      //   stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      //   return true;
      // } catch (err) {
      //   return false;
      // }

      // Mock para desarrollo - en producción SIEMPRE verificar firma
      console.warn("Stripe webhook signature verification not implemented");
      return true;
    } catch (error) {
      console.error("Stripe signature verification failed:", error);
      return false;
    }
  }

  /**
   * Parsea webhook de Stripe y devuelve evento normalizado
   * El CORE solo recibe eventos normalizados, nunca payloads crudos
   */
  async parseWebhook(
    rawPayload: any,
    signature: string,
  ): Promise<PaymentEvent | null> {
    try {
      // 1. Verificar firma
      if (!this.verifyWebhookSignature(rawPayload, signature)) {
        console.error("Invalid Stripe webhook signature");
        return null;
      }

      // 2. Parsear y normalizar evento
      // const stripeEvent = event as Stripe.Event;

      // Mock para desarrollo
      const event: PaymentEvent = {
        eventId: `evt_stripe_${Date.now()}`,
        eventType: this.mapStripeEventType(rawPayload.type),
        timestamp: new Date(),
        provider: "stripe",
        paymentIntentId: rawPayload.data?.object?.id || "",
        status: this.mapStripeStatus(rawPayload.data?.object?.status),
      };

      return event;
    } catch (error) {
      console.error("Stripe webhook parsing failed:", error);
      return null;
    }
  }

  private mapStripeEventType(stripeType: string): PaymentEventType {
    const mapping: Record<string, PaymentEventType> = {
      "payment_intent.succeeded": PaymentEventType.PAYMENT_SUCCEEDED,
      "payment_intent.payment_failed": PaymentEventType.PAYMENT_FAILED,
      "payment_intent.canceled": PaymentEventType.PAYMENT_CANCELLED,
      "charge.refunded": PaymentEventType.REFUND_COMPLETED,
    };
    return mapping[stripeType] || PaymentEventType.PAYMENT_PENDING;
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.SUCCEEDED,
      failed: PaymentStatus.FAILED,
      canceled: PaymentStatus.CANCELLED,
      requires_payment_method: PaymentStatus.PENDING,
    };
    return mapping[stripeStatus] || PaymentStatus.PENDING;
  }
}

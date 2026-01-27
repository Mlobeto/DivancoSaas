/**
 * WEBHOOK ROUTES (CORE)
 * Rutas para manejar webhooks de proveedores de pago
 *
 * IMPORTANTE:
 * - Estas rutas NO tienen autenticación (webhooks externos)
 * - El ADAPTER valida firma y normaliza el evento
 * - El CORE solo recibe eventos normalizados (PaymentEvent)
 */

import { Router, Request, Response } from "express";
import { PaymentEvent } from "@core/contracts/payment.provider";
import { PrismaClient } from "@prisma/client";
import type { PaymentProviderResolver } from "@integrations/adapters/payment/payment.resolver";

// El resolver se inyecta desde app.ts (bootstrap)
// El core NO importa adapters directamente
let paymentProviderResolver: PaymentProviderResolver;

export function setPaymentProviderResolver(resolver: PaymentProviderResolver) {
  paymentProviderResolver = resolver;
}

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/webhooks/stripe
 * Webhook de Stripe
 */
router.post("/stripe", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    // El ADAPTER valida y normaliza
    const provider = paymentProviderResolver.getProviderByName("stripe");
    const event: PaymentEvent | null = await provider.parseWebhook(
      req.body,
      signature,
    );

    if (!event) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // El CORE recibe evento normalizado
    await processPaymentEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(400).json({ error: "Webhook processing failed" });
  }
});

/**
 * POST /api/webhooks/wompi
 * Webhook de Wompi
 */
router.post("/wompi", async (req: Request, res: Response) => {
  try {
    const signature =
      req.body.signature || (req.headers["x-wompi-signature"] as string);

    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    // El ADAPTER valida y normaliza
    const provider = paymentProviderResolver.getProviderByName("wompi");
    const event: PaymentEvent | null = await provider.parseWebhook(
      req.body,
      signature,
    );

    if (!event) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // El CORE recibe evento normalizado
    await processPaymentEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error("Wompi webhook error:", error);
    res.status(400).json({ error: "Webhook processing failed" });
  }
});

/**
 * POST /api/webhooks/mercadopago
 * Webhook de MercadoPago
 */
router.post("/mercadopago", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "Missing x-signature header" });
    }

    // El ADAPTER valida y normaliza
    const provider = paymentProviderResolver.getProviderByName("mercadopago");
    const event: PaymentEvent | null = await provider.parseWebhook(
      req.body,
      signature,
    );

    if (!event) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // El CORE recibe evento normalizado
    await processPaymentEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    res.status(400).json({ error: "Webhook processing failed" });
  }
});

/**
 * Procesa evento de pago normalizado (CORE)
 * El core NO ve payloads crudos, solo eventos normalizados
 */
async function processPaymentEvent(event: PaymentEvent): Promise<void> {
  // TODO: Implementar lógica de procesamiento
  // - PAYMENT_SUCCEEDED → activar suscripción
  // - PAYMENT_FAILED → cancelar suscripción pendiente
  // - REFUND_COMPLETED → marcar como reembolsado

  console.log("Processing payment event:", {
    type: event.eventType,
    paymentId: event.paymentIntentId,
    status: event.status,
    provider: event.provider,
  });

  // Buscar suscripción por externalSubscriptionId
  const subscription = await prisma.platformSubscription.findFirst({
    where: { externalSubscriptionId: event.paymentIntentId },
  });

  if (subscription) {
    // Actualizar estado según evento
    // await prisma.platformSubscription.update({ ... });
  }
}

export default router;

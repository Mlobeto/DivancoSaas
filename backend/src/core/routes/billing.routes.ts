/**
 * BILLING ROUTES (CORE)
 * Rutas para manejar billing de la plataforma SaaS
 *
 * IMPORTANTE: Este archivo está en el CORE y NO conoce adapters concretos
 * El provider se resuelve FUERA del core mediante el resolver
 */

import { Router, Request, Response } from "express";
import { BillingService } from "@core/services/billing.service";
import {
  authenticate,
  requireBusinessUnit,
} from "@core/middlewares/auth.middleware";
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
 * POST /api/billing/subscribe
 * Crea una suscripción para el tenant
 */
router.post("/subscribe", authenticate, async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    const tenantId = req.context?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant not found" });
    }

    if (!["free", "pro", "enterprise"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Obtener tenant para resolver provider
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(400).json({ error: "Tenant not found" });
    }

    // Resolver provider FUERA del core
    const provider = paymentProviderResolver.resolveProvider({
      country: tenant.country,
      preferredPaymentProvider: tenant.preferredPaymentProvider,
    });

    // Inyectar provider en el servicio
    const billingService = new BillingService(provider);
    const result = await billingService.createSubscription(tenantId, plan);

    res.json(result);
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

/**
 * POST /api/billing/confirm-payment
 * Confirma el pago de una suscripción
 */
router.post(
  "/confirm-payment",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId, paymentIntentId } = req.body;

      // Obtener suscripción y tenant
      const subscription = await prisma.platformSubscription.findUnique({
        where: { id: subscriptionId },
        include: { tenant: true },
      });

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Resolver provider
      const provider = paymentProviderResolver.resolveProvider({
        country: subscription.tenant.country,
        preferredPaymentProvider: subscription.tenant.preferredPaymentProvider,
      });

      // Inyectar y ejecutar
      const billingService = new BillingService(provider);
      const result = await billingService.confirmSubscriptionPayment(
        subscriptionId,
        paymentIntentId,
      );

      res.json(result);
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  },
);

/**
 * POST /api/billing/cancel
 * Cancela la suscripción actual
 */
router.post("/cancel", authenticate, async (req: Request, res: Response) => {
  try {
    const { subscriptionId, refund } = req.body;

    // Obtener suscripción y tenant
    const subscription = await prisma.platformSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Resolver provider
    const provider = paymentProviderResolver.resolveProvider({
      country: subscription.tenant.country,
      preferredPaymentProvider: subscription.tenant.preferredPaymentProvider,
    });

    // Inyectar y ejecutar
    const billingService = new BillingService(provider);
    const result = await billingService.cancelSubscription(
      subscriptionId,
      refund || false,
    );

    res.json(result);
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

/**
 * GET /api/billing/subscription
 * Obtiene la suscripción activa del tenant
 */
router.get(
  "/subscription",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.context?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant not found" });
      }

      const subscription = await prisma.platformSubscription.findFirst({
        where: {
          tenantId,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(subscription);
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  },
);

/**
 * GET /api/billing/plans
 * Lista los planes disponibles
 */
router.get("/plans", async (req: Request, res: Response) => {
  try {
    // TODO: Obtener precios desde configuración o base de datos
    const plans = [
      {
        id: "free",
        name: "Free",
        price: 0,
        features: ["1 Business Unit", "5 Users", "Basic Modules"],
      },
      {
        id: "pro",
        name: "Pro",
        price: 49,
        features: [
          "3 Business Units",
          "25 Users",
          "All Modules",
          "Email Support",
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 199,
        features: [
          "Unlimited Business Units",
          "Unlimited Users",
          "All Modules",
          "Priority Support",
          "Custom Integrations",
        ],
      },
    ];

    res.json(plans);
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ error: "Failed to get plans" });
  }
});

export default router;

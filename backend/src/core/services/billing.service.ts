/**
 * BILLING SERVICE (CORE)
 * Servicio para manejar BILLING DE LA PLATAFORMA SaaS (NO módulos comerciales)
 *
 * REGLAS:
 * - Solo usa la interfaz PlatformPaymentProvider (NO implementaciones)
 * - NO importa adapters ni factories
 * - Recibe el provider por inyección de dependencias
 * - Contiene SOLO lógica de billing de la plataforma
 */

import { PrismaClient } from "@prisma/client";
import { PlatformPaymentProvider } from "@core/contracts/payment.provider";

const prisma = new PrismaClient();

export class BillingService {
  private paymentProvider: PlatformPaymentProvider;

  /**
   * Constructor con inyección de dependencias
   * El provider se resuelve FUERA del core
   */
  constructor(paymentProvider: PlatformPaymentProvider) {
    this.paymentProvider = paymentProvider;
  }

  /**
   * Crea una suscripción para un tenant
   */
  async createSubscription(
    tenantId: string,
    plan: "free" | "pro" | "enterprise",
  ) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Si el plan es free, no necesitamos payment provider
    if (plan === "free") {
      return await prisma.platformSubscription.create({
        data: {
          tenantId,
          plan,
          status: "ACTIVE",
          amount: 0,
          currency: "USD",
          billingCycle: "monthly",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        },
      });
    }

    // Calcular monto según plan
    const amount = this.getPlanAmount(plan, tenant.country || "US");
    const currency = this.getCurrencyForCountry(tenant.country || "US");

    // Crear payment intent usando la INTERFAZ
    const paymentIntent = await this.paymentProvider.createSubscriptionPayment({
      tenantId,
      plan,
      amount,
      currency,
      billingEmail: tenant.billingEmail || "",
      metadata: {
        tenantName: tenant.name,
        country: tenant.country || undefined,
      },
    });

    // Crear suscripción en la BD
    const subscription = await prisma.platformSubscription.create({
      data: {
        tenantId,
        plan,
        status: "PENDING",
        amount,
        currency,
        billingCycle: "monthly",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        paymentProvider: this.paymentProvider.name,
        externalId: paymentIntent.id, // ID en el proveedor de pago
      },
    });

    return {
      subscription,
      paymentIntent,
      provider: this.paymentProvider.name,
    };
  }

  /**
   * Confirma el pago de una suscripción
   */
  async confirmSubscriptionPayment(
    subscriptionId: string,
    paymentIntentId: string,
  ) {
    const subscription = await prisma.platformSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Confirmar pago usando la INTERFAZ
    const result =
      await this.paymentProvider.confirmSubscriptionPayment(paymentIntentId);

    if (result.success) {
      // Actualizar suscripción
      return await prisma.platformSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
        },
      });
    } else {
      // Marcar como fallida
      await prisma.platformSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "CANCELLED",
        },
      });
      throw new Error(`Payment failed: ${result.error}`);
    }
  }

  /**
   * Cancela una suscripción y hace refund si aplica
   */
  async cancelSubscription(subscriptionId: string, refund: boolean = false) {
    const subscription = await prisma.platformSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    let refundResult = null;

    if (refund && subscription.externalId) {
      refundResult = await this.paymentProvider.refundSubscriptionPayment(
        subscription.externalId,
      );
    }

    // Cancelar suscripción
    const cancelled = await prisma.platformSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: "CANCELLED",
      },
    });

    return {
      subscription: cancelled,
      refund: refundResult,
    };
  }

  /**
   * Verifica webhook de proveedor
   * El procesamiento específico se hace FUERA del core
   */
  verifyWebhook(payload: any, signature: string): boolean {
    return this.paymentProvider.verifyWebhookSignature(payload, signature);
  }

  /**
   * Calcula el monto según el plan y país
   */
  private getPlanAmount(plan: string, country: string): number {
    // Precios base en USD
    const basePrices = {
      pro: 49,
      enterprise: 199,
    };

    // TODO: Ajustar precios por país/paridad de poder adquisitivo
    // Por ejemplo, Colombia podría tener precios ajustados

    return basePrices[plan as keyof typeof basePrices] || 0;
  }

  /**
   * Obtiene la moneda según el país
   */
  private getCurrencyForCountry(country: string): string {
    const currencies: Record<string, string> = {
      CO: "COP", // Colombia - Peso
      MX: "MXN", // México - Peso
      AR: "ARS", // Argentina - Peso
      BR: "BRL", // Brasil - Real
      CL: "CLP", // Chile - Peso
      PE: "PEN", // Perú - Sol
      UY: "UYU", // Uruguay - Peso
      US: "USD", // Estados Unidos - Dólar
    };

    return currencies[country] || "USD";
  }
}

// NO exportar instancia singleton
// El servicio debe ser instanciado con el provider correspondiente

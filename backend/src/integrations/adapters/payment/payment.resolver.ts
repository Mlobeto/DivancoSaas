/**
 * PAYMENT PROVIDER RESOLVER (FUERA DEL CORE)
 * Resuelve qué provider de pago usar según configuración del tenant
 *
 * REGLAS DE SELECCIÓN:
 * 1. Si tenant.preferredPaymentProvider existe → usar ese
 * 2. Sino, seleccionar por país:
 *    - Colombia (CO) → Wompi O Stripe
 *    - Argentina, México, Brasil (AR, MX, BR) → MercadoPago
 *    - Otros países → Stripe (default internacional)
 */

import { PlatformPaymentProvider } from "@core/contracts/payment.provider";
import { StripeAdapter } from "./stripe.adapter";
import { WompiAdapter } from "./wompi.adapter";
import { MercadoPagoAdapter } from "./mercadopago.adapter";

type TenantConfig = {
  country?: string | null;
  preferredPaymentProvider?: string | null;
};

export class PaymentProviderResolver {
  private providers: Map<string, PlatformPaymentProvider> = new Map();

  // Configuración de países por proveedor
  private readonly WOMPI_COUNTRIES = ["CO"]; // Colombia
  private readonly MERCADOPAGO_COUNTRIES = ["AR", "MX", "BR"]; // Argentina, México, Brasil
  // Stripe funciona en todos los países como fallback

  constructor() {
    this.initializeProviders();
  }

  /**
   * Inicializa los providers desde environment variables
   */
  private initializeProviders(): void {
    try {
      // Stripe (siempre disponible - fallback global)
      if (process.env.STRIPE_SECRET_KEY) {
        this.providers.set(
          "stripe",
          new StripeAdapter({
            secretKey: process.env.STRIPE_SECRET_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
          }),
        );
      }

      // Wompi (Colombia)
      if (process.env.WOMPI_PRIVATE_KEY) {
        this.providers.set(
          "wompi",
          new WompiAdapter({
            publicKey: process.env.WOMPI_PUBLIC_KEY || "",
            privateKey: process.env.WOMPI_PRIVATE_KEY,
            eventsSecret: process.env.WOMPI_EVENTS_SECRET || "",
            environment:
              (process.env.WOMPI_ENVIRONMENT as "test" | "production") ||
              "test",
          }),
        );
      }

      // MercadoPago (Latam)
      if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
        this.providers.set(
          "mercadopago",
          new MercadoPagoAdapter({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
            publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
            webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || "",
          }),
        );
      }

      console.log(
        `✅ Initialized payment providers: ${Array.from(this.providers.keys()).join(", ")}`,
      );
    } catch (error) {
      console.error("❌ Error initializing payment providers:", error);
    }
  }

  /**
   * Resuelve el provider adecuado para un tenant
   */
  resolveProvider(tenantConfig: TenantConfig): PlatformPaymentProvider {
    // 1. Si tiene proveedor preferido, usar ese
    if (tenantConfig.preferredPaymentProvider) {
      const provider = this.providers.get(
        tenantConfig.preferredPaymentProvider,
      );
      if (provider) {
        return provider;
      }
      console.warn(
        `Preferred provider ${tenantConfig.preferredPaymentProvider} not configured, falling back to country-based selection`,
      );
    }

    // 2. Seleccionar por país
    const country = (tenantConfig.country || "").toUpperCase();

    // Colombia → Wompi (mejor experiencia 3DS local) O Stripe
    if (this.WOMPI_COUNTRIES.includes(country) && this.providers.has("wompi")) {
      return this.providers.get("wompi")!;
    }

    // Argentina, México, Brasil → MercadoPago (amplia adopción)
    if (
      this.MERCADOPAGO_COUNTRIES.includes(country) &&
      this.providers.has("mercadopago")
    ) {
      return this.providers.get("mercadopago")!;
    }

    // 3. Fallback → Stripe (funciona globalmente)
    if (this.providers.has("stripe")) {
      return this.providers.get("stripe")!;
    }

    throw new Error(`No payment provider available for country: ${country}`);
  }

  /**
   * Obtiene un provider específico por nombre
   */
  getProviderByName(
    name: "stripe" | "wompi" | "mercadopago",
  ): PlatformPaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Payment provider not configured: ${name}`);
    }
    return provider;
  }

  /**
   * Lista providers disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Verifica si un provider está disponible
   */
  isProviderAvailable(name: string): boolean {
    return this.providers.has(name);
  }
}

// Export singleton
export const paymentProviderResolver = new PaymentProviderResolver();

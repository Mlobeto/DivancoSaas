/**
 * PAYMENT PROVIDER FACTORY
 * Selecciona el proveedor de pago adecuado según el país del tenant
 *
 * Reglas:
 * - Colombia → Wompi (soporte 3DS nativo)
 * - Argentina, México, Brasil, Chile, Perú, Uruguay → MercadoPago
 * - Resto del mundo → Stripe
 */

import { PlatformPaymentProvider } from "@core/contracts/payment.provider";
import { StripeAdapter } from "./stripe.adapter";
import { WompiAdapter } from "./wompi.adapter";
import { MercadoPagoAdapter } from "./mercadopago.adapter";

type PaymentProviderConfig = {
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  wompi: {
    publicKey: string;
    privateKey: string;
    eventsSecret: string;
    environment: "test" | "production";
  };
  mercadopago: {
    accessToken: string;
    publicKey: string;
    webhookSecret: string;
  };
};

export class PaymentProviderFactory {
  private static instance: PaymentProviderFactory;
  private config: PaymentProviderConfig;
  private providers: Map<string, PlatformPaymentProvider> = new Map();

  // Países soportados por cada proveedor
  private readonly WOMPI_COUNTRIES = ["CO"]; // Colombia
  private readonly MERCADOPAGO_COUNTRIES = [
    "AR",
    "MX",
    "BR",
    "CL",
    "PE",
    "UY",
    "CO",
  ]; // Latam

  private constructor() {
    // Cargar configuración desde variables de entorno
    this.config = {
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || "",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
      },
      wompi: {
        publicKey: process.env.WOMPI_PUBLIC_KEY || "",
        privateKey: process.env.WOMPI_PRIVATE_KEY || "",
        eventsSecret: process.env.WOMPI_EVENTS_SECRET || "",
        environment:
          (process.env.WOMPI_ENVIRONMENT as "test" | "production") || "test",
      },
      mercadopago: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
        publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || "",
      },
    };

    // Inicializar providers
    this.initializeProviders();
  }

  static getInstance(): PaymentProviderFactory {
    if (!PaymentProviderFactory.instance) {
      PaymentProviderFactory.instance = new PaymentProviderFactory();
    }
    return PaymentProviderFactory.instance;
  }

  private initializeProviders(): void {
    try {
      // Stripe (siempre disponible como fallback)
      if (this.config.stripe.secretKey) {
        this.providers.set("stripe", new StripeAdapter(this.config.stripe));
      }

      // Wompi (Colombia)
      if (this.config.wompi.privateKey) {
        this.providers.set("wompi", new WompiAdapter(this.config.wompi));
      }

      // MercadoPago (Latam)
      if (this.config.mercadopago.accessToken) {
        this.providers.set(
          "mercadopago",
          new MercadoPagoAdapter(this.config.mercadopago),
        );
      }
    } catch (error) {
      console.error("Error initializing payment providers:", error);
    }
  }

  /**
   * Obtiene el proveedor adecuado según el país del tenant
   * @param countryCode Código ISO 3166-1 alpha-2 del país (ej: 'CO', 'MX', 'US')
   */
  getProviderForCountry(countryCode: string): PlatformPaymentProvider {
    const country = countryCode.toUpperCase();

    // 1. Colombia → Wompi (mejor para mercado colombiano con 3DS)
    if (this.WOMPI_COUNTRIES.includes(country) && this.providers.has("wompi")) {
      return this.providers.get("wompi")!;
    }

    // 2. Otros países de Latam → MercadoPago
    if (
      this.MERCADOPAGO_COUNTRIES.includes(country) &&
      this.providers.has("mercadopago")
    ) {
      return this.providers.get("mercadopago")!;
    }

    // 3. Fallback → Stripe (global)
    if (this.providers.has("stripe")) {
      return this.providers.get("stripe")!;
    }

    throw new Error(
      `No payment provider available for country: ${countryCode}`,
    );
  }

  /**
   * Obtiene un proveedor específico por nombre
   */
  getProvider(
    providerName: "stripe" | "wompi" | "mercadopago",
  ): PlatformPaymentProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider not configured: ${providerName}`);
    }
    return provider;
  }

  /**
   * Lista todos los proveedores disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Verifica si un proveedor está disponible
   */
  isProviderAvailable(providerName: string): boolean {
    return this.providers.has(providerName);
  }
}

// Export singleton
export const paymentProviderFactory = PaymentProviderFactory.getInstance();

/**
 * DIGITAL SIGNATURE RESOLVER
 * Resuelve qué proveedor de firma digital usar según la configuración de la BusinessUnit
 */

import { DigitalSignatureProvider } from "@core/contracts/digital-signature.provider";
import { SignNowAdapter } from "./signow.adapter";
import prisma from "@config/database";

export class DigitalSignatureResolver {
  private providers: Map<string, DigitalSignatureProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Inicializa los providers desde environment variables
   */
  private initializeProviders(): void {
    try {
      // SignNow
      if (process.env.SIGNOW_API_KEY) {
        this.providers.set(
          "signow",
          new SignNowAdapter({
            apiKey: process.env.SIGNOW_API_KEY,
            environment:
              (process.env.SIGNOW_ENVIRONMENT as "sandbox" | "production") ||
              "sandbox",
            webhookSecret: process.env.SIGNOW_WEBHOOK_SECRET,
          }),
        );
      }

      // Futuros proveedores:
      // if (process.env.DOCUSIGN_API_KEY) {
      //   this.providers.set("docusign", new DocuSignAdapter({ ... }));
      // }
      // if (process.env.HELLOSIGN_API_KEY) {
      //   this.providers.set("hellosign", new HelloSignAdapter({ ... }));
      // }

      console.log(
        `✅ Initialized digital signature providers: ${Array.from(this.providers.keys()).join(", ")}`,
      );
    } catch (error) {
      console.error(
        "❌ Error initializing digital signature providers:",
        error,
      );
    }
  }

  /**
   * Resuelve el provider adecuado para una BusinessUnit
   * Lee la configuración de la BU y retorna el adapter correspondiente
   */
  async resolveProvider(
    businessUnitId: string,
  ): Promise<DigitalSignatureProvider> {
    const integration = await prisma.businessUnitIntegration.findFirst({
      where: {
        businessUnitId,
        type: "DIGITAL_SIGNATURE",
        isActive: true,
      },
    });

    if (!integration) {
      throw new Error(
        `No digital signature provider configured for BusinessUnit ${businessUnitId}. Please configure one in the admin panel.`,
      );
    }

    const provider = this.providers.get(integration.provider);
    if (!provider) {
      throw new Error(
        `Digital signature provider "${integration.provider}" is not available. Available providers: ${this.getAvailableProviders().join(", ")}`,
      );
    }

    console.log(
      `✅ Resolved digital signature provider: ${provider.name} for BU ${businessUnitId}`,
    );
    return provider;
  }

  /**
   * Obtiene un provider específico por nombre (para webhooks)
   */
  getProviderByName(name: string): DigitalSignatureProvider | undefined {
    return this.providers.get(name.toLowerCase());
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
    return this.providers.has(name.toLowerCase());
  }
}

// Export singleton
export const digitalSignatureResolver = new DigitalSignatureResolver();

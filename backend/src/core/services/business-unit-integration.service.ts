/**
 * BUSINESS UNIT INTEGRATION SERVICE
 * Gestión de integraciones configuradas por BusinessUnit
 */

import prisma from "@config/database";
import { IntegrationType } from "@prisma/client";

export class BusinessUnitIntegrationService {
  /**
   * Configurar integración de email para una BusinessUnit
   */
  async configureEmailIntegration(
    businessUnitId: string,
    provider: string,
    credentials: any,
    config: any,
  ) {
    // Mapear provider a IntegrationType
    const integrationTypeMap: Record<string, IntegrationType> = {
      sendgrid: "SENDGRID",
      "azure-communication-services": "AZURE_COMMUNICATION_SERVICES",
    };

    const integrationType = integrationTypeMap[provider];
    if (!integrationType) {
      throw new Error(`Invalid email provider: ${provider}`);
    }

    // Upsert la integración
    const integration = await prisma.businessUnitIntegration.upsert({
      where: {
        businessUnitId_type_provider: {
          businessUnitId,
          type: "email",
          provider: integrationType,
        },
      },
      update: {
        credentials,
        config,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        businessUnitId,
        type: "email",
        provider: integrationType,
        credentials,
        config,
        isActive: true,
      },
    });

    return integration;
  }

  /**
   * Obtener integración de email de una BusinessUnit
   */
  async getEmailIntegration(businessUnitId: string) {
    const integration = await prisma.businessUnitIntegration.findFirst({
      where: {
        businessUnitId,
        type: "email",
        isActive: true,
      },
    });

    return integration;
  }

  /**
   * Eliminar integración de email
   */
  async deleteEmailIntegration(businessUnitId: string) {
    const integration = await prisma.businessUnitIntegration.findFirst({
      where: {
        businessUnitId,
        type: "email",
        isActive: true,
      },
    });

    if (!integration) {
      throw new Error("No email integration found");
    }

    await prisma.businessUnitIntegration.delete({
      where: { id: integration.id },
    });
  }

  /**
   * Listar todas las integraciones de una BusinessUnit
   */
  async listAllIntegrations(businessUnitId: string) {
    const integrations = await prisma.businessUnitIntegration.findMany({
      where: {
        businessUnitId,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        provider: true,
        isActive: true,
        config: true,
        createdAt: true,
        updatedAt: true,
        // NO devolver credentials por seguridad
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return integrations;
  }

  /**
   * Configurar integración de SMS
   */
  async configureSMSIntegration(
    businessUnitId: string,
    provider: string,
    credentials: any,
    config: any,
  ) {
    const integrationTypeMap: Record<string, IntegrationType> = {
      twilio: "TWILIO_SMS",
      // "aws-sns": "AWS_SNS", // Comentado hasta agregar a enum
    };

    const integrationType = integrationTypeMap[provider];
    if (!integrationType) {
      throw new Error(`Invalid SMS provider: ${provider}`);
    }

    const integration = await prisma.businessUnitIntegration.upsert({
      where: {
        businessUnitId_type_provider: {
          businessUnitId,
          type: "sms",
          provider: integrationType,
        },
      },
      update: {
        credentials,
        config,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        businessUnitId,
        type: "sms",
        provider: integrationType,
        credentials,
        config,
        isActive: true,
      },
    });

    return integration;
  }

  /**
   * Configurar integración de WhatsApp
   */
  async configureWhatsAppIntegration(
    businessUnitId: string,
    provider: string,
    credentials: any,
    config: any,
  ) {
    const integrationTypeMap: Record<string, IntegrationType> = {
      "meta-whatsapp": "META_WHATSAPP",
    };

    const integrationType = integrationTypeMap[provider];
    if (!integrationType) {
      throw new Error(`Invalid WhatsApp provider: ${provider}`);
    }

    const integration = await prisma.businessUnitIntegration.upsert({
      where: {
        businessUnitId_type_provider: {
          businessUnitId,
          type: "whatsapp",
          provider: integrationType,
        },
      },
      update: {
        credentials,
        config,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        businessUnitId,
        type: "whatsapp",
        provider: integrationType,
        credentials,
        config,
        isActive: true,
      },
    });

    return integration;
  }
}

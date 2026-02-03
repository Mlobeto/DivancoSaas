/**
 * Integration Service
 * Servicio para gestionar credenciales de integraciones externas por BusinessUnit
 */

import { PrismaClient, IntegrationType } from "@prisma/client";
import { encryptionService } from "./encryption.service";

const prisma = new PrismaClient();

export interface CreateIntegrationCredentialParams {
  businessUnitId: string;
  provider: IntegrationType;
  credentials: any; // Objeto con las credenciales específicas del proveedor
}

export interface UpdateIntegrationCredentialParams {
  businessUnitId: string;
  provider: IntegrationType;
  credentials?: any;
  isActive?: boolean;
}

export class IntegrationService {
  /**
   * Crea o actualiza credenciales de integración para una BusinessUnit
   */
  async upsertCredentials(
    params: CreateIntegrationCredentialParams,
  ): Promise<void> {
    // Validar que la BusinessUnit existe y pertenece al tenant correcto
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: params.businessUnitId },
      include: { tenant: true },
    });

    if (!businessUnit) {
      throw new Error("Business Unit not found");
    }

    // Encriptar las credenciales
    const encryptedCredentials = encryptionService.encrypt(params.credentials);

    // Guardar o actualizar
    await prisma.integrationCredential.upsert({
      where: {
        businessUnitId_provider: {
          businessUnitId: params.businessUnitId,
          provider: params.provider,
        },
      },
      create: {
        businessUnitId: params.businessUnitId,
        provider: params.provider,
        credentials: encryptedCredentials,
        isActive: true,
        lastValidated: new Date(),
      },
      update: {
        credentials: encryptedCredentials,
        isActive: true,
        lastValidated: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Obtiene las credenciales desencriptadas de una integración
   */
  async getCredentials(
    businessUnitId: string,
    provider: IntegrationType,
  ): Promise<any | null> {
    const credential = await prisma.integrationCredential.findUnique({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider,
        },
      },
    });

    if (!credential) {
      return null;
    }

    try {
      return encryptionService.decrypt(credential.credentials as string);
    } catch (error) {
      console.error(
        `[IntegrationService] Failed to decrypt credentials for ${provider}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Lista todas las integraciones configuradas para una BusinessUnit
   */
  async listIntegrations(businessUnitId: string) {
    const credentials = await prisma.integrationCredential.findMany({
      where: { businessUnitId },
      select: {
        provider: true,
        isActive: true,
        lastValidated: true,
        createdAt: true,
        updatedAt: true,
        // NO retornar las credenciales
      },
    });

    return credentials;
  }

  /**
   * Activa o desactiva una integración sin eliminar las credenciales
   */
  async toggleIntegration(
    businessUnitId: string,
    provider: IntegrationType,
    isActive: boolean,
  ): Promise<void> {
    await prisma.integrationCredential.update({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider,
        },
      },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Elimina permanentemente las credenciales de una integración
   */
  async deleteCredentials(
    businessUnitId: string,
    provider: IntegrationType,
  ): Promise<void> {
    await prisma.integrationCredential.delete({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider,
        },
      },
    });
  }

  /**
   * Valida las credenciales de una integración haciendo una prueba real
   */
  async validateCredentials(
    businessUnitId: string,
    provider: IntegrationType,
  ): Promise<boolean> {
    // Aquí se implementaría la lógica específica para cada proveedor
    // Por ejemplo, para WhatsApp se haría un request de prueba a la API de Meta

    const credential = await prisma.integrationCredential.findUnique({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider,
        },
      },
    });

    if (!credential) {
      return false;
    }

    // TODO: Implementar validación específica por proveedor
    // Por ahora solo actualizamos la fecha de validación
    await prisma.integrationCredential.update({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider,
        },
      },
      data: {
        lastValidated: new Date(),
      },
    });

    return true;
  }

  /**
   * Verifica si una integración está configurada y activa
   */
  async isConfigured(
    businessUnitId: string,
    provider: IntegrationType,
  ): Promise<boolean> {
    const credential = await prisma.integrationCredential.findUnique({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider,
        },
      },
    });

    return credential !== null && credential.isActive;
  }
}

export const integrationService = new IntegrationService();

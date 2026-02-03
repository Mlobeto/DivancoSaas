/**
 * WhatsApp Service
 * Servicio del core que abstrae el envío de mensajes WhatsApp
 * Resuelve el adapter correcto según la configuración de cada BusinessUnit
 */

import type { WhatsAppProvider } from "../contracts/whatsapp.provider";
import { PrismaClient } from "@prisma/client";
import { intentEngine } from "./intent-engine.service";
import { userChannelIdentityService } from "./user-channel-identity.service";
import { NormalizedEvent } from "../types/events";
import { encryptionService } from "./encryption.service";

const prisma = new PrismaClient();

// Factory para crear instancias de WhatsAppProvider
type WhatsAppProviderFactory = (config: any) => WhatsAppProvider;
let whatsappProviderFactory: WhatsAppProviderFactory;

/**
 * Inyectar factory de WhatsAppProvider desde el bootstrap
 * El core NO instancia adapters directamente
 */
export function setWhatsAppProviderFactory(factory: WhatsAppProviderFactory) {
  whatsappProviderFactory = factory;
}

export class WhatsAppService {
  /**
   * Obtiene el adapter de WhatsApp configurado para una BusinessUnit específica
   */
  private async getWhatsAppProvider(
    tenantId: string,
    businessUnitId: string,
  ): Promise<WhatsAppProvider | null> {
    if (!whatsappProviderFactory) {
      throw new Error(
        "WhatsAppProviderFactory not initialized. Call setWhatsAppProviderFactory() in bootstrap.",
      );
    }

    // Buscar credenciales de WhatsApp para esta BusinessUnit
    const credential = await prisma.integrationCredential.findUnique({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider: "META_WHATSAPP",
        },
      },
    });

    if (!credential || !credential.isActive) {
      console.warn(
        `[WhatsAppService] No active WhatsApp configuration found for BU: ${businessUnitId}`,
      );
      return null;
    }

    // Descifrar credenciales
    const config = encryptionService.decrypt(credential.credentials as string);

    // Usar factory para crear instancia
    return whatsappProviderFactory(config);
  }

  /**
   * Envía un mensaje de texto por WhatsApp
   */
  async sendText(params: {
    to: string;
    message: string;
    tenantId: string;
    businessUnitId: string;
  }): Promise<void> {
    const provider = await this.getWhatsAppProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("WhatsApp not configured for this Business Unit");
    }

    await provider.sendText(params);
  }

  /**
   * Envía un mensaje usando una plantilla aprobada
   */
  async sendTemplate(params: {
    to: string;
    templateName: string;
    language: string;
    components?: any[];
    tenantId: string;
    businessUnitId: string;
  }): Promise<void> {
    const provider = await this.getWhatsAppProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("WhatsApp not configured for this Business Unit");
    }

    await provider.sendTemplate(params);
  }

  /**
   * Envía un archivo multimedia
   */
  async sendMedia(params: {
    to: string;
    mediaType: "image" | "document" | "audio" | "video";
    mediaUrl: string;
    caption?: string;
    filename?: string;
    tenantId: string;
    businessUnitId: string;
  }): Promise<void> {
    const provider = await this.getWhatsAppProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("WhatsApp not configured for this Business Unit");
    }

    await provider.sendMedia(params);
  }

  /**
   * Verifica webhook de Meta
   */
  async verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
    businessUnitId: string,
  ): Promise<string | null> {
    if (!whatsappProviderFactory) {
      throw new Error("WhatsAppProviderFactory not initialized");
    }

    // En este caso, necesitamos verificar contra la configuración de la BU
    const credential = await prisma.integrationCredential.findFirst({
      where: {
        businessUnitId,
        provider: "META_WHATSAPP",
        isActive: true,
      },
    });

    if (!credential) {
      return null;
    }

    const config = credential.credentials as any;
    const provider = whatsappProviderFactory(config);

    return provider.verifyWebhook(mode, token, challenge);
  }

  /**
   * Procesa webhook entrante de Meta
   */
  async processWebhook(payload: any, businessUnitId: string): Promise<void> {
    if (!whatsappProviderFactory) {
      throw new Error("WhatsAppProviderFactory not initialized");
    }

    const credential = await prisma.integrationCredential.findFirst({
      where: {
        businessUnitId,
        provider: "META_WHATSAPP",
        isActive: true,
      },
      include: {
        businessUnit: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!credential) {
      throw new Error("WhatsApp not configured for this Business Unit");
    }

    const config = credential.credentials as any;
    const provider = whatsappProviderFactory(config);

    const messages = await provider.processWebhook(payload);

    console.log(
      `[WhatsAppService] Processing ${messages.length} messages for BU: ${businessUnitId}`,
    );

    // Procesar cada mensaje entrante
    for (const message of messages) {
      try {
        // 1. Extraer el número de teléfono del remitente
        const phoneNumber = message.from; // Formato: +573001234567

        // 2. Buscar el usuario vinculado a este número de WhatsApp
        const identity = await userChannelIdentityService.getUserByExternalId(
          "WHATSAPP",
          phoneNumber,
          businessUnitId,
        );

        if (!identity) {
          console.log(
            `[WhatsAppService] Usuario no encontrado para número ${phoneNumber}. Mensaje ignorado.`,
          );
          // TODO: Aquí se podría implementar auto-registro o enviar mensaje de bienvenida
          continue;
        }

        // 3. Extraer la intención del mensaje
        // TODO: Implementar NLP/IA para extraer intent del texto
        // Por ahora, usamos keywords simples
        const intent = this.extractIntentFromMessage(message.text || "");

        if (!intent) {
          console.log(
            `[WhatsAppService] No se pudo determinar intención del mensaje: "${message.text}"`,
          );
          // TODO: Enviar mensaje de ayuda al usuario
          continue;
        }

        // 4. Crear evento normalizado
        const normalizedEvent: NormalizedEvent = {
          tenant: credential.businessUnit.tenantId,
          businessUnit: businessUnitId,
          user: identity.userId,
          channel: "WHATSAPP",
          intent: intent,
          payload: {
            messageId: message.messageId,
            text: message.text,
            from: phoneNumber,
            mediaUrl: message.mediaUrl,
            mediaType: message.type,
          },
          metadata: {
            timestamp: new Date(message.timestamp),
            source: "whatsapp_webhook",
            provider: "meta",
            phoneNumber: phoneNumber,
            messageType: message.type,
          },
        };

        // 5. Procesar con el Intent Engine
        console.log(
          `[WhatsAppService] Procesando intent ${intent} del usuario ${identity.userId}`,
        );

        const result = await intentEngine.process(normalizedEvent);

        if (result.success) {
          console.log(
            `[WhatsAppService] Intent procesado exitosamente:`,
            result.data,
          );
          // TODO: Enviar confirmación al usuario por WhatsApp
        } else {
          console.error(
            `[WhatsAppService] Error procesando intent:`,
            result.error,
          );
          // TODO: Enviar mensaje de error al usuario
        }
      } catch (error: any) {
        console.error(
          `[WhatsAppService] Error procesando mensaje individual:`,
          error,
        );
        // Continuar con el siguiente mensaje
      }
    }
  }

  /**
   * Extrae la intención de un mensaje de texto usando keywords simples
   * TODO: Implementar NLP/IA más sofisticado
   */
  private extractIntentFromMessage(text: string): string | null {
    const lowerText = text.toLowerCase().trim();

    // Keywords para cada intención
    const intentKeywords: Record<string, string[]> = {
      UPLOAD_IMAGE: ["foto", "imagen", "picture", "image", "subir foto"],
      PROJECT_UPDATE: [
        "actualizar proyecto",
        "update project",
        "estado proyecto",
        "avance",
        "progress",
      ],
      REGISTER_WORK_EVENT: [
        "registrar horas",
        "horas trabajadas",
        "trabajo",
        "jornada",
        "entrada",
        "salida",
      ],
      SEND_PAYMENT_REMINDER: [
        "recordar pago",
        "pago pendiente",
        "payment reminder",
      ],
      CHECK_IN: ["entrada", "check in", "iniciar jornada", "llegué"],
      CHECK_OUT: ["salida", "check out", "fin jornada", "me voy"],
      REQUEST_MATERIAL: [
        "solicitar material",
        "necesito material",
        "pedir material",
        "material",
      ],
    };

    // Buscar coincidencias
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return intent;
        }
      }
    }

    // Si no hay coincidencia, null
    return null;
  }

  /**
   * Verifica si WhatsApp está configurado para una BusinessUnit
   */
  async isConfigured(
    tenantId: string,
    businessUnitId: string,
  ): Promise<boolean> {
    const provider = await this.getWhatsAppProvider(tenantId, businessUnitId);

    if (!provider) {
      return false;
    }

    return await provider.isConfigured(tenantId, businessUnitId);
  }
}

export const whatsappService = new WhatsAppService();

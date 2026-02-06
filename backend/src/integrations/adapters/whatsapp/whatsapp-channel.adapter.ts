/**
 * Adaptador de canal WhatsApp
 * Implementa la interfaz ChannelAdapter para normalizar eventos de WhatsApp
 */

import {
  ChannelAdapter,
  ChannelContext,
} from "@core/contracts/channel-adapter";
import { NormalizedEvent } from "@core/types/events";
import { WhatsAppWebhookPayload } from "@core/contracts/whatsapp.provider";
import { PrismaClient } from "@prisma/client";
import { logger } from "@core/utils/logger";
import { userChannelIdentityService } from "@core/services/user-channel-identity.service";

const prisma = new PrismaClient();

export class WhatsAppChannelAdapter implements ChannelAdapter<WhatsAppWebhookPayload> {
  /**
   * Normaliza un evento de WhatsApp a un NormalizedEvent estándar
   */
  async normalize(
    externalEvent: WhatsAppWebhookPayload,
    context?: ChannelContext,
  ): Promise<NormalizedEvent> {
    if (!context?.businessUnitId) {
      throw new Error("businessUnitId is required in context");
    }

    // 1. Resolver tenant
    const tenantId = await this.resolveTenant(externalEvent, context);

    // 2. Resolver businessUnit
    const businessUnitId = await this.resolveBusinessUnit(
      externalEvent,
      context,
    );

    // 3. Resolver user
    const userId = await this.resolveUser(externalEvent, context);

    // 4. Extraer intent
    const intent = await this.extractIntent(externalEvent);

    // 5. Construir evento normalizado
    const normalizedEvent: NormalizedEvent = {
      tenant: tenantId,
      businessUnit: businessUnitId,
      user: userId,
      channel: "WHATSAPP",
      intent: intent,
      payload: {
        messageId: externalEvent.messageId,
        text: externalEvent.text,
        from: externalEvent.from,
        to: externalEvent.to,
        mediaUrl: externalEvent.mediaUrl,
        mediaType: externalEvent.type,
        buttonResponse: externalEvent.buttonResponse,
        status: externalEvent.status,
      },
      metadata: {
        timestamp: new Date(externalEvent.timestamp),
        phoneNumber: externalEvent.from,
        source: "whatsapp",
        provider: "meta",
        messageType: externalEvent.type,
      },
    };

    return normalizedEvent;
  }

  /**
   * Valida que el evento de WhatsApp tenga la estructura correcta
   */
  async validate(externalEvent: WhatsAppWebhookPayload): Promise<boolean> {
    if (!externalEvent.from || !externalEvent.to) {
      logger.error({ externalEvent }, "[WhatsAppAdapter] Missing from/to fields");
      return false;
    }

    if (!externalEvent.messageId) {
      logger.error({ externalEvent }, "[WhatsAppAdapter] Missing messageId");
      return false;
    }

    if (!externalEvent.type) {
      logger.error({ externalEvent }, "[WhatsAppAdapter] Missing message type");
      return false;
    }

    // Para mensajes de texto, debe tener contenido
    if (externalEvent.type === "text" && !externalEvent.text) {
      logger.error({ externalEvent }, "[WhatsAppAdapter] Text message without content");
      return false;
    }

    // Para mensajes de media, debe tener URL
    if (
      ["image", "document", "audio", "video"].includes(externalEvent.type) &&
      !externalEvent.mediaUrl
    ) {
      logger.error({ externalEvent }, "[WhatsAppAdapter] Media message without URL");
      return false;
    }

    return true;
  }

  /**
   * Extrae la intención del mensaje de WhatsApp
   * Usa keywords simples. TODO: Implementar NLP/IA
   */
  async extractIntent(externalEvent: WhatsAppWebhookPayload): Promise<string> {
    const text = externalEvent.text || "";
    const lowerText = text.toLowerCase().trim();

    // Mensajes con media tienen intención específica
    if (externalEvent.type === "image") {
      return "UPLOAD_IMAGE";
    }

    if (externalEvent.type === "document") {
      return "UPLOAD_FILE";
    }

    // Keywords para intenciones basadas en texto
    const intentKeywords: Record<string, string[]> = {
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
      ],
      SEND_PAYMENT_REMINDER: [
        "recordar pago",
        "pago pendiente",
        "payment reminder",
      ],
      CHECK_IN: ["entrada", "check in", "iniciar jornada", "llegué", "llegue"],
      CHECK_OUT: ["salida", "check out", "fin jornada", "me voy"],
      REQUEST_MATERIAL: [
        "solicitar material",
        "necesito material",
        "pedir material",
        "material",
      ],
      CREATE_INVOICE: ["crear factura", "nueva factura", "factura", "invoice"],
      ASSIGN_TASK: ["asignar tarea", "nueva tarea", "assign task"],
    };

    // Buscar coincidencias
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return intent;
        }
      }
    }

    // Si no hay coincidencia, intent genérico
    return "SEND_MESSAGE";
  }

  /**
   * Resuelve el tenant desde la BusinessUnit
   */
  async resolveTenant(
    externalEvent: WhatsAppWebhookPayload,
    context?: ChannelContext,
  ): Promise<string> {
    if (!context?.businessUnitId) {
      throw new Error("businessUnitId is required in context");
    }

    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: context.businessUnitId },
      select: { tenantId: true },
    });

    if (!businessUnit) {
      throw new Error(`BusinessUnit ${context.businessUnitId} not found`);
    }

    return businessUnit.tenantId;
  }

  /**
   * Resuelve la BusinessUnit (ya viene en el contexto)
   */
  async resolveBusinessUnit(
    externalEvent: WhatsAppWebhookPayload,
    context?: ChannelContext,
  ): Promise<string> {
    if (!context?.businessUnitId) {
      throw new Error("businessUnitId is required in context");
    }

    return context.businessUnitId;
  }

  /**
   * Resuelve el usuario a partir del número de WhatsApp
   */
  async resolveUser(
    externalEvent: WhatsAppWebhookPayload,
    context?: ChannelContext,
  ): Promise<string> {
    if (!context?.businessUnitId) {
      throw new Error("businessUnitId is required in context");
    }

    const phoneNumber = externalEvent.from;

    // Buscar identidad del usuario
    const identity = await userChannelIdentityService.getUserByExternalId(
      "WHATSAPP",
      phoneNumber,
      context.businessUnitId,
    );

    if (!identity) {
      throw new Error(
        `User not found for WhatsApp number ${phoneNumber} in BusinessUnit ${context.businessUnitId}`,
      );
    }

    return identity.userId;
  }
}

// Singleton
export const whatsappChannelAdapter = new WhatsAppChannelAdapter();

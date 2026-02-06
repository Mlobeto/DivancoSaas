/**
 * Meta WhatsApp Cloud API Adapter
 * Implementación del contrato WhatsAppProvider usando Meta Cloud API directamente
 *
 * Documentación oficial: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Requisitos:
 * - WhatsApp Business Account
 * - Número de teléfono verificado
 * - Access Token (temporal o permanente)
 * - Plantillas aprobadas por Meta para mensajes promocionales
 */

import axios, { AxiosInstance } from "axios";
import { logger } from "../../../core/utils/logger";
import {
  WhatsAppProvider,
  SendWhatsAppTextParams,
  SendWhatsAppTemplateParams,
  SendWhatsAppMediaParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookPayload,
  MetaWhatsAppConfig,
} from "../../../core/contracts/whatsapp.provider";

export class MetaWhatsAppAdapter implements WhatsAppProvider {
  private apiClient: AxiosInstance;
  private readonly API_VERSION = "v18.0"; // Actualizable según Meta

  constructor(private config: MetaWhatsAppConfig) {
    const apiVersion = config.apiVersion || this.API_VERSION;

    this.apiClient = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 segundos
    });
  }

  /**
   * Envía un mensaje de texto simple
   * Nota: Solo se puede enviar texto libre si el usuario ha iniciado la conversación
   * en las últimas 24 horas. Fuera de esa ventana, usar plantillas aprobadas.
   */
  async sendText(
    params: SendWhatsAppTextParams,
  ): Promise<WhatsAppMessageResponse> {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to.replace(/\D/g, ""), // Limpia caracteres no numéricos
        type: "text",
        text: {
          preview_url: true, // Auto-detecta URLs y muestra preview
          body: params.message,
        },
      };

      const response = await this.apiClient.post(
        `/${this.config.phoneNumberId}/messages`,
        payload,
      );

      return {
        messageId: response.data.messages[0].id,
        status: "sent",
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message },
        "[MetaWhatsAppAdapter] Error sending text"
      );
      throw new Error(
        `Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Envía un mensaje usando plantilla aprobada
   * Las plantillas deben estar creadas y aprobadas en Meta Business Manager
   */
  async sendTemplate(
    params: SendWhatsAppTemplateParams,
  ): Promise<WhatsAppMessageResponse> {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: params.templateName,
          language: {
            code: params.language,
          },
          components: params.components || [],
        },
      };

      const response = await this.apiClient.post(
        `/${this.config.phoneNumberId}/messages`,
        payload,
      );

      return {
        messageId: response.data.messages[0].id,
        status: "sent",
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message, template: params.templateName },
        "[MetaWhatsAppAdapter] Error sending template"
      );
      throw new Error(
        `Failed to send WhatsApp template: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Envía archivos multimedia
   * Soporta: imagen, documento, audio, video
   */
  async sendMedia(
    params: SendWhatsAppMediaParams,
  ): Promise<WhatsAppMessageResponse> {
    try {
      const mediaPayload: any = {
        link: params.mediaUrl,
      };

      // Documentos requieren filename
      if (params.mediaType === "document" && params.filename) {
        mediaPayload.filename = params.filename;
      }

      // Imágenes y videos pueden tener caption
      if (
        (params.mediaType === "image" || params.mediaType === "video") &&
        params.caption
      ) {
        mediaPayload.caption = params.caption;
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to.replace(/\D/g, ""),
        type: params.mediaType,
        [params.mediaType]: mediaPayload,
      };

      const response = await this.apiClient.post(
        `/${this.config.phoneNumberId}/messages`,
        payload,
      );

      return {
        messageId: response.data.messages[0].id,
        status: "sent",
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message, mediaType: params.type },
        "[MetaWhatsAppAdapter] Error sending media"
      );
      throw new Error(
        `Failed to send WhatsApp media: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Verifica el webhook de Meta (requerido en el setup inicial)
   * Meta hace un GET request con mode=subscribe&verify_token=tu_token&challenge=random_string
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === "subscribe" && token === this.config.webhookVerifyToken) {
      logger.info({ mode, challenge }, "[MetaWhatsAppAdapter] Webhook verified successfully");
      return challenge;
    }

    logger.warn({ mode, token: token ? "provided" : "missing" }, "[MetaWhatsAppAdapter] Webhook verification failed");
    return null;
  }

  /**
   * Procesa webhooks entrantes de Meta
   * Meta envía notificaciones de mensajes recibidos y cambios de estado
   */
  async processWebhook(payload: any): Promise<WhatsAppWebhookPayload[]> {
    const messages: WhatsAppWebhookPayload[] = [];

    try {
      // Meta puede enviar múltiples entries en un solo webhook
      if (!payload.entry) {
        return messages;
      }

      for (const entry of payload.entry) {
        const changes = entry.changes || [];

        for (const change of changes) {
          if (change.field !== "messages") {
            continue;
          }

          const value = change.value;

          // Procesar mensajes recibidos
          if (value.messages) {
            for (const msg of value.messages) {
              messages.push({
                from: msg.from,
                to: value.metadata.display_phone_number,
                messageId: msg.id,
                type: msg.type,
                text: msg.text?.body,
                mediaUrl:
                  msg.image?.id ||
                  msg.document?.id ||
                  msg.audio?.id ||
                  msg.video?.id,
                buttonResponse: msg.button?.text,
                timestamp: msg.timestamp,
              });
            }
          }

          // Procesar cambios de estado (delivered, read, etc)
          if (value.statuses) {
            for (const status of value.statuses) {
              messages.push({
                from: status.recipient_id,
                to: value.metadata.display_phone_number,
                messageId: status.id,
                type: "status",
                status: status.status as any,
                timestamp: status.timestamp,
              });
            }
          }
        }
      }
    } catch (error: any) {
      logger.error({ error }, "[MetaWhatsAppAdapter] Error processing webhook");
    }

    return messages;
  }

  /**
   * Verifica si la configuración es válida haciendo un test call a la API
   */
  async isConfigured(
    tenantId: string,
    businessUnitId: string,
  ): Promise<boolean> {
    try {
      // Verifica que el phoneNumberId sea válido consultando su información
      const response = await this.apiClient.get(
        `/${this.config.phoneNumberId}`,
      );
      return (
        response.status === 200 &&
        response.data.id === this.config.phoneNumberId
      );
    } catch (error) {
      logger.error({ error, tenantId, businessUnitId }, "[MetaWhatsAppAdapter] Configuration check failed");
      return false;
    }
  }

  /**
   * Método auxiliar para descargar media ID a URL pública
   * Meta primero devuelve un media ID, luego hay que hacer otro request para obtener la URL
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await this.apiClient.get(`/${mediaId}`);
      return response.data.url;
    } catch (error: any) {
      logger.error({ error, mediaId }, "[MetaWhatsAppAdapter] Error getting media URL");
      throw new Error("Failed to retrieve media URL from Meta");
    }
  }

  /**
   * Método auxiliar para obtener información del número de WhatsApp
   */
  async getPhoneNumberInfo(): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `/${this.config.phoneNumberId}`,
      );
      return response.data;
    } catch (error: any) {
      logger.error({ error, phoneNumberId }, "[MetaWhatsAppAdapter] Error getting phone info");
      throw new Error("Failed to retrieve phone number info");
    }
  }
}

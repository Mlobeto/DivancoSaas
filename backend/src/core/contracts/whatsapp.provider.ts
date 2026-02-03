/**
 * WhatsApp Provider Contract
 * Define la interfaz para integrar servicios de WhatsApp Business API
 * Implementaciones: Meta Cloud API, Twilio, 360dialog, etc.
 */

export interface SendWhatsAppTextParams {
  to: string; // Número de teléfono en formato internacional (ej: +521234567890)
  message: string;
  tenantId: string;
  businessUnitId: string;
}

export interface SendWhatsAppTemplateParams {
  to: string;
  templateName: string;
  language: string; // ej: "es_MX", "en_US"
  components?: TemplateComponent[];
  tenantId: string;
  businessUnitId: string;
}

export interface TemplateComponent {
  type: "header" | "body" | "button";
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "document";
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename: string;
  };
}

export interface SendWhatsAppMediaParams {
  to: string;
  mediaType: "image" | "document" | "audio" | "video";
  mediaUrl: string;
  caption?: string;
  filename?: string; // Para documentos
  tenantId: string;
  businessUnitId: string;
}

export interface WhatsAppMessageResponse {
  messageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
}

export interface WhatsAppWebhookPayload {
  from: string;
  to: string;
  messageId: string;
  type: "text" | "image" | "document" | "audio" | "video" | "button" | "status";
  text?: string;
  mediaUrl?: string;
  buttonResponse?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  timestamp: number;
}

/**
 * Interfaz principal del proveedor de WhatsApp
 */
export interface WhatsAppProvider {
  /**
   * Envía un mensaje de texto simple
   */
  sendText(params: SendWhatsAppTextParams): Promise<WhatsAppMessageResponse>;

  /**
   * Envía un mensaje usando una plantilla aprobada por Meta
   * Las plantillas deben estar previamente aprobadas en Meta Business Manager
   */
  sendTemplate(
    params: SendWhatsAppTemplateParams,
  ): Promise<WhatsAppMessageResponse>;

  /**
   * Envía un archivo multimedia (imagen, documento, audio, video)
   */
  sendMedia(params: SendWhatsAppMediaParams): Promise<WhatsAppMessageResponse>;

  /**
   * Verifica el webhook de Meta
   * @returns El challenge token para verificación
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null;

  /**
   * Procesa los webhooks entrantes de Meta
   */
  processWebhook(payload: any): Promise<WhatsAppWebhookPayload[]>;

  /**
   * Verifica si el proveedor está configurado correctamente
   */
  isConfigured(tenantId: string, businessUnitId: string): Promise<boolean>;
}

/**
 * Configuración específica para Meta Cloud API
 */
export interface MetaWhatsAppConfig {
  phoneNumberId: string; // ID del número de teléfono en Meta
  businessAccountId: string; // WhatsApp Business Account ID
  accessToken: string; // Token de acceso permanente o temporal
  webhookVerifyToken: string; // Token para verificar webhooks
  apiVersion?: string; // ej: "v18.0" (opcional, usa la última por defecto)
}

/**
 * Configuración almacenada por BusinessUnit
 */
export interface WhatsAppConfiguration {
  provider: "meta" | "twilio" | "360dialog"; // Extensible a otros proveedores
  config: MetaWhatsAppConfig | Record<string, any>; // Tipado según proveedor
  enabled: boolean;
  tenantId: string;
  businessUnitId: string;
}

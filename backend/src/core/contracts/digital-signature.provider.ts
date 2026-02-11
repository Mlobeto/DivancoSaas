/**
 * DIGITAL SIGNATURE PROVIDER CONTRACT (CORE)
 * Contrato para proveedores de firma digital (SignNow, DocuSign, HelloSign, etc.)
 *
 * Este contrato es transversal y puede usarse en múltiples módulos:
 * - Cotizaciones de alquiler
 * - Contratos laborales
 * - Convenios comerciales
 * - Documentos legales
 * - Facturas que requieren firma
 */

// ============================================
// DIGITAL SIGNATURE PROVIDER
// ============================================

export interface DigitalSignatureProvider {
  readonly name: string;

  /**
   * Crear solicitud de firma digital
   * @param params Parámetros de la solicitud de firma
   * @returns Información de la solicitud creada
   */
  createSignatureRequest(
    params: SignatureRequestParams,
  ): Promise<SignatureRequest>;

  /**
   * Obtener el estado actual de una solicitud de firma
   * @param requestId ID de la solicitud en el proveedor
   * @returns Estado actual de la firma
   */
  getSignatureStatus(requestId: string): Promise<SignatureStatusInfo>;

  /**
   * Descargar documento firmado
   * @param requestId ID de la solicitud en el proveedor
   * @returns Buffer del PDF firmado
   */
  downloadSignedDocument(requestId: string): Promise<Buffer>;

  /**
   * Cancelar una solicitud de firma pendiente
   * @param requestId ID de la solicitud a cancelar
   */
  cancelSignatureRequest(requestId: string): Promise<void>;

  /**
   * Parsear y validar webhook del proveedor
   * @param rawPayload Payload crudo del webhook
   * @param signature Firma del webhook (si aplica)
   * @returns Evento normalizado o null si no es válido
   */
  parseWebhook(
    rawPayload: any,
    signature?: string,
  ): Promise<SignatureWebhookEvent | null>;
}

// ============================================
// REQUEST PARAMETERS
// ============================================

export interface SignatureRequestParams {
  /** ID del tenant (para auditoría) */
  tenantId: string;

  /** ID de la business unit (para auditoría) */
  businessUnitId: string;

  /** Nombre del documento */
  documentName: string;

  /** URL pública del PDF a firmar (ej: Azure Blob Storage con SAS token) */
  documentUrl: string;

  /** Lista de firmantes */
  signers: SignerInfo[];

  /** Mensaje personalizado para los firmantes */
  message?: string;

  /** Días hasta que expire la solicitud (default: 30) */
  expiresInDays?: number;

  /** Metadata adicional para tracking */
  metadata?: Record<string, any>;

  /** Configuración de recordatorios */
  reminders?: ReminderConfig;
}

export interface SignerInfo {
  /** Nombre completo del firmante */
  name: string;

  /** Email del firmante */
  email: string;

  /** Rol del firmante (ej: "Cliente", "Proveedor", "Testigo") */
  role?: string;

  /** Orden de firma (para firma secuencial) */
  order?: number;

  /** Campos de firma requeridos */
  requiredFields?: SignatureField[];

  /** Si debe recibir copia del documento firmado */
  sendCopy?: boolean;
}

export interface SignatureField {
  /** Tipo de campo */
  type: "signature" | "initials" | "date" | "text" | "checkbox" | "dropdown";

  /** Etiqueta del campo */
  label: string;

  /** Si es obligatorio */
  required: boolean;

  /** Número de página (1-indexed) */
  page?: number;

  /** Posición X en la página */
  x?: number;

  /** Posición Y en la página */
  y?: number;

  /** Ancho del campo */
  width?: number;

  /** Alto del campo */
  height?: number;

  /** Valor por defecto (para campos de texto) */
  defaultValue?: string;

  /** Opciones para dropdown */
  options?: string[];
}

export interface ReminderConfig {
  /** Enviar recordatorio automático */
  enabled: boolean;

  /** Días entre recordatorios */
  intervalDays?: number;

  /** Máximo de recordatorios */
  maxReminders?: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface SignatureRequest {
  /** ID de la solicitud en el proveedor */
  id: string;

  /** ID interno del sistema (opcional) */
  internalId?: string;

  /** Estado actual */
  status: SignatureStatus;

  /** URL donde el firmante puede firmar */
  signUrl: string;

  /** URLs individuales por firmante (firma múltiple) */
  signerUrls?: Array<{
    signerEmail: string;
    url: string;
  }>;

  /** Fecha de expiración */
  expiresAt: Date;

  /** Fecha de creación */
  createdAt: Date;

  /** Metadata adicional del proveedor */
  providerMetadata?: Record<string, any>;
}

export interface SignatureStatusInfo {
  /** ID de la solicitud */
  requestId: string;

  /** Estado actual */
  status: SignatureStatus;

  /** Progreso de firma (0-100) */
  progress?: number;

  /** Información de firmantes */
  signers?: SignerStatusInfo[];

  /** Fecha de última actualización */
  updatedAt: Date;

  /** Fecha de firma completa (si aplica) */
  signedAt?: Date;

  /** URL del documento firmado (si está disponible) */
  signedDocumentUrl?: string;
}

export interface SignerStatusInfo {
  email: string;
  name: string;
  status: "pending" | "viewed" | "signed" | "declined";
  signedAt?: Date;
  viewedAt?: Date;
  declinedReason?: string;
}

export type SignatureStatus =
  | "pending" // Enviado, esperando firma
  | "viewed" // Documento visto por al menos un firmante
  | "signed" // Firmado completamente por todos
  | "partially_signed" // Firmado por algunos (firma múltiple)
  | "declined" // Rechazado por un firmante
  | "expired" // Tiempo límite excedido
  | "cancelled"; // Cancelado por el solicitante

// ============================================
// WEBHOOK EVENTS
// ============================================

export interface SignatureWebhookEvent {
  /** ID de la solicitud en el proveedor */
  requestId: string;

  /** Tipo de evento */
  eventType: SignatureEventType;

  /** Estado actual después del evento */
  status: SignatureStatus;

  /** Fecha del evento */
  timestamp: Date;

  /** Email del firmante relacionado al evento */
  signerEmail?: string;

  /** Nombre del firmante */
  signerName?: string;

  /** Fecha de firma (si aplica) */
  signedAt?: Date;

  /** Fecha de visualización (si aplica) */
  viewedAt?: Date;

  /** Razón de rechazo (si aplica) */
  declinedReason?: string;

  /** URL del documento firmado (si está disponible) */
  documentUrl?: string;

  /** Metadata adicional del evento */
  metadata?: Record<string, any>;
}

export type SignatureEventType =
  | "document.created"
  | "document.viewed"
  | "document.signed"
  | "document.partially_signed"
  | "document.declined"
  | "document.expired"
  | "document.cancelled"
  | "document.completed"
  | "reminder.sent";

// ============================================
// ERROR TYPES
// ============================================

export class DigitalSignatureError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public details?: any,
  ) {
    super(message);
    this.name = "DigitalSignatureError";
  }
}

export class SignatureRequestNotFoundError extends DigitalSignatureError {
  constructor(requestId: string, provider: string) {
    super(
      `Signature request ${requestId} not found`,
      "REQUEST_NOT_FOUND",
      provider,
    );
  }
}

export class SignatureExpiredError extends DigitalSignatureError {
  constructor(requestId: string, provider: string) {
    super(
      `Signature request ${requestId} has expired`,
      "REQUEST_EXPIRED",
      provider,
    );
  }
}

export class InvalidWebhookSignatureError extends DigitalSignatureError {
  constructor(provider: string) {
    super("Invalid webhook signature", "INVALID_WEBHOOK_SIGNATURE", provider);
  }
}

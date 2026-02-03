/**
 * Tipos para el sistema de intenciones y eventos normalizados
 */

import { ChannelType } from "@prisma/client";

export type IntentName =
  | "UPLOAD_IMAGE"
  | "PROJECT_UPDATE"
  | "SEND_PAYMENT_REMINDER"
  | "REGISTER_WORK_EVENT"
  | "CREATE_INVOICE"
  | "ASSIGN_TASK"
  | "SEND_MESSAGE"
  | "UPDATE_STATUS"
  | "CREATE_ENTITY"
  | "DELETE_ENTITY";

/**
 * Evento normalizado que proviene de cualquier canal
 */
export interface NormalizedEvent {
  tenant: string;
  businessUnit: string;
  user: string;
  channel: ChannelType;
  intent: IntentName | string;
  payload: Record<string, any>;
  metadata: {
    timestamp: Date;
    ipAddress?: string;
    deviceId?: string;
    phoneNumber?: string;
    userAgent?: string;
    [key: string]: any;
  };
}

/**
 * Resultado del procesamiento de una intención
 */
export interface IntentResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  audit?: {
    entity?: string;
    entityId?: string;
    action?: string;
    oldData?: any;
    newData?: any;
  };
}

/**
 * Configuración de una acción asociada a una intención
 */
export interface IntentAction {
  module: string;
  action: string;
  config?: Record<string, any>;
  requiredPermission?: string;
}

/**
 * Contexto de ejecución de una intención
 */
export interface IntentContext {
  tenant: string;
  businessUnit: string;
  user: string;
  channel: ChannelType;
  permissions: string[];
}

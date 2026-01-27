/**
 * WEBHOOK ADAPTER CONTRACT (CORE)
 * Contrato para que los adapters normalicen webhooks externos
 *
 * PRINCIPIO:
 * - El CORE nunca ve headers, firmas crudas ni payloads externos
 * - El ADAPTER valida firma + parsea payload → devuelve evento normalizado
 * - El CORE solo trabaja con eventos normalizados
 */

import { PaymentEvent } from "./payment.provider";

export interface WebhookAdapter {
  readonly name: string;

  /**
   * Valida webhook y devuelve evento normalizado
   *
   * @param rawPayload - Payload crudo del proveedor
   * @param signature - Firma/header de verificación
   * @returns Evento normalizado o null si la firma es inválida
   */
  parseWebhook(
    rawPayload: any,
    signature: string,
  ): Promise<PaymentEvent | null>;
}

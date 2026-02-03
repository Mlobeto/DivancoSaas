/**
 * Contrato para adapters de canal
 * Los adapters traducen eventos externos a eventos normalizados
 */

import { NormalizedEvent } from "../types/events";

/**
 * Contexto adicional para normalización de eventos
 */
export interface ChannelContext {
  businessUnitId?: string;
  tenantId?: string;
  [key: string]: any;
}

/**
 * Interface que deben implementar todos los adapters de canal
 */
export interface ChannelAdapter<TExternalEvent = any> {
  /**
   * Normaliza un evento externo a un evento normalizado del sistema
   */
  normalize(
    externalEvent: TExternalEvent,
    context?: ChannelContext,
  ): Promise<NormalizedEvent>;

  /**
   * Valida que el evento externo sea válido
   */
  validate(externalEvent: TExternalEvent): Promise<boolean>;

  /**
   * Extrae la intención del evento externo
   */
  extractIntent(externalEvent: TExternalEvent): Promise<string>;

  /**
   * Resuelve el tenant asociado al evento
   */
  resolveTenant(
    externalEvent: TExternalEvent,
    context?: ChannelContext,
  ): Promise<string>;

  /**
   * Resuelve la business unit asociada al evento
   */
  resolveBusinessUnit(
    externalEvent: TExternalEvent,
    context?: ChannelContext,
  ): Promise<string>;

  /**
   * Resuelve el usuario asociado al evento
   */
  resolveUser(
    externalEvent: TExternalEvent,
    context?: ChannelContext,
  ): Promise<string>;
}

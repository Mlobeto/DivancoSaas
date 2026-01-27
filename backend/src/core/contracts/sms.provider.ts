/**
 * SMS PROVIDER CONTRACT (CORE)
 * Contrato para proveedores de SMS (Twilio, etc.)
 */

export interface SmsProvider {
  readonly name: string;

  /**
   * Enviar SMS
   */
  sendSms(params: SendSmsParams): Promise<SmsResult>;
}

export interface SendSmsParams {
  to: string;
  message: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

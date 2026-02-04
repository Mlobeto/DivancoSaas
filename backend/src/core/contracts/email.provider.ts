/**
 * EMAIL PROVIDER CONTRACT (CORE)
 * Contrato para proveedores de email (SendGrid, SMTP, etc.)
 */

export interface EmailProvider {
  readonly name: string;

  /**
   * Enviar email
   */
  sendEmail(params: SendEmailParams): Promise<EmailResult>;

  /**
   * Enviar email con plantilla
   */
  sendTemplateEmail(params: SendTemplateEmailParams): Promise<EmailResult>;
}

export interface SendEmailParams {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface SendTemplateEmailParams {
  to: string | string[];
  from: string;
  templateId: string;
  dynamicData: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

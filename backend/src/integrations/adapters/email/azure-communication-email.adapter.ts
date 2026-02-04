/**
 * AZURE COMMUNICATION SERVICES EMAIL ADAPTER
 *
 * Adaptador para Azure Communication Services (Email)
 * Documentación: https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email
 */

import { EmailClient, KnownEmailSendStatus } from "@azure/communication-email";
import {
  EmailProvider,
  SendEmailParams,
  SendTemplateEmailParams,
  EmailResult,
} from "@core/contracts/email.provider";

export interface AzureCommunicationEmailConfig {
  connectionString: string;
  defaultFrom?: string;
}

export class AzureCommunicationEmailAdapter implements EmailProvider {
  readonly name = "azure-communication-services";
  private client: EmailClient;
  private defaultFrom?: string;

  constructor(config: AzureCommunicationEmailConfig) {
    this.client = new EmailClient(config.connectionString);
    this.defaultFrom = config.defaultFrom;
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const from = params.from || this.defaultFrom;

      if (!from) {
        throw new Error("From address is required");
      }

      // Convertir destinatarios a formato de Azure
      const recipients = Array.isArray(params.to)
        ? params.to.map((email) => ({ address: email }))
        : [{ address: params.to }];

      // Preparar mensaje
      const emailMessage: any = {
        senderAddress: from,
        content: {
          subject: params.subject,
          plainText: params.text || "",
          html: params.html || "",
        },
        recipients: {
          to: recipients,
        },
      };

      // Agregar attachments solo si existen y tienen contentType
      if (params.attachments && params.attachments.length > 0) {
        emailMessage.attachments = params.attachments
          .filter((att) => att.contentType) // Solo attachments con contentType
          .map((att) => ({
            name: att.filename,
            contentType: att.contentType!,
            contentInBase64: att.content.toString("base64"),
          }));
      }

      // Enviar email (operación asíncrona)
      const poller = await this.client.beginSend(emailMessage);

      // Esperar a que se complete
      const result = await poller.pollUntilDone();

      // Verificar estado
      if (result.status === KnownEmailSendStatus.Succeeded) {
        return {
          success: true,
          messageId: result.id,
        };
      } else {
        return {
          success: false,
          error: `Email send failed with status: ${result.status}`,
        };
      }
    } catch (error: any) {
      console.error("Azure Communication Services email error:", error);
      return {
        success: false,
        error:
          error.message ||
          "Failed to send email via Azure Communication Services",
      };
    }
  }

  async sendTemplateEmail(
    params: SendTemplateEmailParams,
  ): Promise<EmailResult> {
    // Renderizar template según el tipo
    let html = "";
    let subject = "";

    switch (params.templateId) {
      case "welcome":
        subject = "¡Bienvenido a DivancoSaas! 🎉";
        html = `
          <h1>Bienvenido ${params.dynamicData.firstName}!</h1>
          <p>Gracias por registrarte en ${params.dynamicData.tenantName}.</p>
          <p><a href="${params.dynamicData.loginUrl}">Iniciar Sesión</a></p>
        `;
        break;

      case "password-reset":
        subject = "Recuperar contraseña - DivancoSaas";
        html = `
          <h1>Restablecer contraseña</h1>
          <p>Hola ${params.dynamicData.firstName},</p>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${params.dynamicData.resetUrl}">Restablecer contraseña</a>
        `;
        break;

      default:
        return {
          success: false,
          error: `Template ${params.templateId} not found`,
        };
    }

    return this.sendEmail({
      to: params.to,
      from: params.from,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ""), // Simple HTML to text
    });
  }
}

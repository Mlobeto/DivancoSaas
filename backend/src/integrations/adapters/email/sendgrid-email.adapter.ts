/**
 * SENDGRID EMAIL ADAPTER
 * Implementación del contrato EmailProvider usando SendGrid
 */

import sgMail from "@sendgrid/mail";
import {
  EmailProvider,
  EmailResult,
  SendEmailParams,
  SendTemplateEmailParams,
} from "@core/contracts/email.provider";

interface SendGridConfig {
  apiKey: string;
  defaultFrom: string;
  defaultFromName?: string;
}

export class SendGridEmailAdapter implements EmailProvider {
  readonly name = "sendgrid";
  private isConfigured: boolean = false;
  public defaultFrom: string;
  private defaultFromName: string;

  constructor(config: SendGridConfig) {
    this.defaultFrom = config.defaultFrom;
    this.defaultFromName = config.defaultFromName || "DivancoSaas";

    if (config.apiKey) {
      sgMail.setApiKey(config.apiKey);
      this.isConfigured = true;
    }
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: "SendGrid not configured. API key is missing.",
      };
    }

    try {
      const msg: any = {
        to: params.to,
        from: {
          email: params.from,
          name: this.defaultFromName,
        },
        subject: params.subject,
        text: params.text,
        html: params.html,
      };

      // Agregar CC si existe
      if (params.cc && params.cc.length > 0) {
        msg.cc = params.cc;
      }

      // Agregar BCC si existe
      if (params.bcc && params.bcc.length > 0) {
        msg.bcc = params.bcc;
      }

      // Agregar adjuntos si existen
      if (params.attachments && params.attachments.length > 0) {
        msg.attachments = params.attachments.map((att) => ({
          content: att.content,
          filename: att.filename,
          type: att.contentType,
          disposition: "attachment",
        }));
      }

      await sgMail.send(msg);

      return {
        success: true,
        messageId: `sendgrid-${Date.now()}`, // SendGrid no retorna messageId directamente
      };
    } catch (error: any) {
      console.error("SendGrid error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email via SendGrid",
      };
    }
  }

  async sendTemplateEmail(
    params: SendTemplateEmailParams,
  ): Promise<EmailResult> {
    // Renderizar plantilla según el tipo
    let html = "";
    let subject = "";

    switch (params.templateId) {
      case "welcome":
        subject = "¡Bienvenido a DivancoSaas! 🎉";
        html = this.renderWelcomeTemplate(
          params.dynamicData.firstName,
          params.dynamicData.tenantName,
          params.dynamicData.loginUrl,
        );
        break;

      case "password-reset":
        subject = "Recuperar contraseña - DivancoSaas";
        html = this.renderPasswordResetTemplate(
          params.dynamicData.firstName,
          params.dynamicData.resetUrl,
        );
        break;

      default:
        return {
          success: false,
          error: `Template ${params.templateId} not found`,
        };
    }

    // Enviar usando sendEmail
    return this.sendEmail({
      to: params.to,
      from: params.from,
      subject,
      html,
      text: this.htmlToPlainText(html),
    });
  }

  /**
   * Renderiza la plantilla de bienvenida
   */
  private renderWelcomeTemplate(
    firstName: string,
    tenantName: string,
    loginUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #00b894; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
            .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>¡Bienvenido a DivancoSaas! 🎉</h2>
            <p>Hola ${firstName},</p>
            <p>Tu cuenta ha sido creada exitosamente. Tu tenant <strong>${tenantName}</strong> ya está listo para usar.</p>
            
            <div class="feature">
              <h3>✅ Lo que incluye tu cuenta:</h3>
              <ul>
                <li>Primera Business Unit configurada</li>
                <li>Rol de administrador asignado</li>
                <li>Acceso completo a todos los módulos</li>
                <li>Plan gratuito para comenzar</li>
              </ul>
            </div>

            <p>Ingresa a tu cuenta para comenzar a configurar tu plataforma:</p>
            <a href="${loginUrl}" class="button">Iniciar Sesión</a>

            <p><strong>Próximos pasos:</strong></p>
            <ol>
              <li>Configura tu perfil y Business Units</li>
              <li>Invita a tu equipo</li>
              <li>Activa los módulos que necesites</li>
              <li>Configura tus workflows personalizados</li>
            </ol>

            <div class="footer">
              <p>¿Necesitas ayuda? Contáctanos en soporte@divancosaas.com</p>
              <p>&copy; ${new Date().getFullYear()} DivancoSaas. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Renderiza la plantilla de recuperación de contraseña
   */
  private renderPasswordResetTemplate(
    firstName: string,
    resetUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #0066cc; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Recuperar contraseña</h2>
            <p>Hola ${firstName},</p>
            <p>Has solicitado recuperar tu contraseña. Haz click en el siguiente botón para continuar:</p>
            <a href="${resetUrl}" class="button">Recuperar Contraseña</a>
            <p>O copia este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>Este enlace expira en 1 hora.</strong></p>
            <p>Si no solicitaste este cambio, puedes ignorar este mensaje y tu contraseña permanecerá sin cambios.</p>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas.</p>
              <p>&copy; ${new Date().getFullYear()} DivancoSaas. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Convierte HTML a texto plano (simplificado)
   */
  private htmlToPlainText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}

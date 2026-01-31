/**
 * EMAIL SERVICE
 * Servicio para envío de emails transaccionales con SendGrid
 */

import sgMail from "@sendgrid/mail";
import { config } from "@config/index";

export class EmailService {
  private isConfigured: boolean;

  constructor() {
    // Configurar SendGrid si la API key está disponible
    if (config.sendgrid.apiKey) {
      sgMail.setApiKey(config.sendgrid.apiKey);
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
      if (config.nodeEnv === "production") {
        console.warn(
          "⚠️  SendGrid API key not configured. Email functionality disabled.",
        );
      }
    }
  }

  /**
   * Envía email de recuperación de contraseña
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    firstName: string,
  ): Promise<void> {
    const resetUrl = `${config.cors.origin[0]}/reset-password?token=${resetToken}`;

    // En desarrollo, solo log en consola
    if (config.nodeEnv === "development" && !this.isConfigured) {
      console.log("\n📧 ===== PASSWORD RESET EMAIL (DEV MODE) =====");
      console.log(`To: ${to}`);
      console.log(`Subject: Recuperar contraseña - DivancoSaas`);
      console.log(`\nHola ${firstName},\n`);
      console.log(
        `Has solicitado recuperar tu contraseña. Haz click en el siguiente enlace:\n`,
      );
      console.log(`${resetUrl}\n`);
      console.log(`Este enlace expira en 1 hora.\n`);
      console.log(
        `Si no solicitaste este cambio, puedes ignorar este mensaje.\n`,
      );
      console.log("===================================\n");
      return;
    }

    // En producción o si está configurado, enviar email real
    if (!this.isConfigured) {
      throw new Error(
        "SendGrid not configured. Set SENDGRID_API_KEY environment variable.",
      );
    }

    const msg = {
      to,
      from: {
        email: config.sendgrid.fromEmail,
        name: config.sendgrid.fromName,
      },
      subject: "Recuperar contraseña - DivancoSaas",
      html: `
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
      `,
      text: `Hola ${firstName},\n\nHas solicitado recuperar tu contraseña.\n\nVisita este enlace: ${resetUrl}\n\nEste enlace expira en 1 hora.\n\nSi no solicitaste este cambio, ignora este mensaje.`,
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Password reset email sent to ${to}`);
    } catch (error) {
      console.error("SendGrid error:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Envía email de bienvenida
   */
  async sendWelcomeEmail(
    to: string,
    firstName: string,
    tenantName: string,
  ): Promise<void> {
    // En desarrollo, solo log en consola
    if (config.nodeEnv === "development" && !this.isConfigured) {
      console.log("\n📧 ===== WELCOME EMAIL (DEV MODE) =====");
      console.log(`To: ${to}`);
      console.log(`Subject: Bienvenido a DivancoSaas`);
      console.log(`\n¡Hola ${firstName}!\n`);
      console.log(
        `Bienvenido a DivancoSaas. Tu tenant "${tenantName}" ha sido creado exitosamente.\n`,
      );
      console.log(`Ya puedes comenzar a configurar tu plataforma.\n`);
      console.log("===================================\n");
      return;
    }

    // En producción o si está configurado, enviar email real
    if (!this.isConfigured) {
      console.warn("SendGrid not configured, skipping welcome email");
      return; // No fallar en welcome email
    }

    const loginUrl = `${config.cors.origin[0]}/login`;

    const msg = {
      to,
      from: {
        email: config.sendgrid.fromEmail,
        name: config.sendgrid.fromName,
      },
      subject: `¡Bienvenido a DivancoSaas! 🎉`,
      html: `
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
      `,
      text: `¡Hola ${firstName}!\n\nBienvenido a DivancoSaas. Tu tenant "${tenantName}" ha sido creado exitosamente.\n\nIngresa aquí: ${loginUrl}\n\n¿Necesitas ayuda? Contáctanos en soporte@divancosaas.com`,
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Welcome email sent to ${to}`);
    } catch (error) {
      console.error("SendGrid error:", error);
      // No lanzar error en welcome email, es no-crítico
    }
  }
}

export const emailService = new EmailService();

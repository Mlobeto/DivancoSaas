/**
 * EMAIL SERVICE
 * Servicio para envío de emails transaccionales con soporte multi-provider por BusinessUnit
 */

import prisma from "@config/database";
import { config } from "@config/index";
import { EmailProvider } from "@core/contracts/email.provider";
import { emailProviderResolver } from "@/bootstrap/email-resolver.bootstrap";

export class EmailService {
  /**
   * Obtiene el proveedor de email configurado para una BusinessUnit
   */
  private async getEmailProvider(
    businessUnitId: string,
  ): Promise<EmailProvider> {
    // Buscar integración activa para la BusinessUnit
    const integration = await prisma.businessUnitIntegration.findFirst({
      where: {
        businessUnitId,
        type: "email",
        isActive: true,
      },
    });

    // Si no hay integración en DB, usar fallbacks globales: Azure → SendGrid → consola dev
    if (!integration) {
      // Fallback 1: Azure Communication Services (var de entorno global)
      const azureConnStr = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
      const azureFrom = process.env.AZURE_EMAIL_FROM;
      if (azureConnStr && azureFrom) {
        return emailProviderResolver(
          "azure-communication-services",
          { connectionString: azureConnStr },
          { defaultFrom: azureFrom },
        );
      }

      // Fallback 2: SendGrid global
      if (config.sendgrid?.apiKey) {
        return emailProviderResolver(
          "sendgrid",
          { apiKey: config.sendgrid.apiKey },
          {
            defaultFrom: config.sendgrid.fromEmail,
            defaultFromName: config.sendgrid.fromName,
          },
        );
      }

      // Fallback 3: solo en desarrollo → imprime en consola
      if (config.nodeEnv === "development") {
        const consoleProvider: EmailProvider = {
          name: "console-dev",
          sendEmail: async (params) => {
            console.log("\n📧 ===== EMAIL (DEV CONSOLE PROVIDER) =====");
            console.log(
              `To:      ${Array.isArray(params.to) ? params.to.join(", ") : params.to}`,
            );
            console.log(`Subject: ${params.subject}`);
            if (params.attachments?.length) {
              console.log(
                `Attachments: ${params.attachments.map((a) => a.filename).join(", ")}`,
              );
            }
            console.log("==========================================\n");
            return { success: true };
          },
          sendTemplateEmail: async (params) => {
            console.log(
              "\n📧 ===== TEMPLATE EMAIL (DEV CONSOLE PROVIDER) =====",
            );
            console.log(`To:       ${params.to}`);
            console.log(`Template: ${params.templateId}`);
            console.log(
              "===================================================\n",
            );
            return { success: true };
          },
        };
        return consoleProvider;
      }

      throw new Error(
        "No email integration configured. Set AZURE_COMMUNICATION_CONNECTION_STRING + AZURE_EMAIL_FROM or SENDGRID_API_KEY.",
      );
    }

    // Usar el proveedor configurado en la BusinessUnit
    return emailProviderResolver(
      integration.provider,
      integration.credentials as any,
      integration.config as any,
    );
  }

  /**
   * Envía email de recuperación de contraseña
   */
  async sendPasswordResetEmail(
    businessUnitId: string,
    to: string,
    resetToken: string,
    firstName: string,
  ): Promise<void> {
    const resetUrl = `${config.cors.origin[0]}/reset-password?token=${resetToken}`;

    // En desarrollo sin integración, solo log en consola
    if (config.nodeEnv === "development") {
      try {
        const provider = await this.getEmailProvider(businessUnitId);
        const result = await provider.sendTemplateEmail({
          to,
          from: (provider as any).defaultFrom,
          templateId: "password-reset",
          dynamicData: {
            firstName,
            resetUrl,
          },
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        console.log(`📧 Password reset email sent to ${to}`);
      } catch (error: any) {
        console.log(
          "\n📧 ===== PASSWORD RESET EMAIL (DEV MODE - FALLBACK) =====",
        );
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
      }
      return;
    }

    // En producción, enviar email real
    const provider = await this.getEmailProvider(businessUnitId);
    const result = await provider.sendTemplateEmail({
      to,
      from: (provider as any).defaultFrom,
      templateId: "password-reset",
      dynamicData: {
        firstName,
        resetUrl,
      },
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send password reset email");
    }

    console.log(`📧 Password reset email sent to ${to}`);
  }

  /**
   * Envía email de bienvenida
   */
  async sendWelcomeEmail(
    businessUnitId: string,
    to: string,
    firstName: string,
    tenantName: string,
  ): Promise<void> {
    const loginUrl = `${config.cors.origin[0]}/login`;

    // En desarrollo sin integración, solo log en consola
    if (config.nodeEnv === "development") {
      try {
        const provider = await this.getEmailProvider(businessUnitId);
        const result = await provider.sendTemplateEmail({
          to,
          from: (provider as any).defaultFrom,
          templateId: "welcome",
          dynamicData: {
            firstName,
            tenantName,
            loginUrl,
          },
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        console.log(`📧 Welcome email sent to ${to}`);
      } catch (error: any) {
        console.log("\n📧 ===== WELCOME EMAIL (DEV MODE - FALLBACK) =====");
        console.log(`To: ${to}`);
        console.log(`Subject: Bienvenido a DivancoSaas`);
        console.log(`\n¡Hola ${firstName}!\n`);
        console.log(
          `Bienvenido a DivancoSaas. Tu tenant "${tenantName}" ha sido creado exitosamente.\n`,
        );
        console.log(`Ya puedes comenzar a configurar tu plataforma.\n`);
        console.log("===================================\n");
      }
      return;
    }

    // En producción, enviar email real (no-crítico)
    try {
      const provider = await this.getEmailProvider(businessUnitId);
      const result = await provider.sendTemplateEmail({
        to,
        from: (provider as any).defaultFrom,
        templateId: "welcome",
        dynamicData: {
          firstName,
          tenantName,
          loginUrl,
        },
      });

      if (result.success) {
        console.log(`📧 Welcome email sent to ${to}`);
      } else {
        console.warn("Failed to send welcome email:", result.error);
      }
    } catch (error: any) {
      console.warn("Welcome email error:", error.message);
      // No lanzar error, el welcome email es no-crítico
    }
  }

  /**
   * Envía un email genérico con HTML libre.
   * Soporta attachments opcionales (ej. PDFs adjuntos).
   * Útil para notificaciones internas y emails de cotizaciones.
   */
  async sendGenericEmail(
    businessUnitId: string,
    params: {
      to: string;
      cc?: string[];
      subject: string;
      html: string;
      text?: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>;
    },
  ): Promise<void> {
    const sendViaProvider = async () => {
      const provider = await this.getEmailProvider(businessUnitId);
      const result = await provider.sendEmail({
        to: params.to,
        cc: params.cc,
        from: (provider as any).defaultFrom,
        subject: params.subject,
        html: params.html,
        text: params.text,
        attachments: params.attachments,
      });
      if (!result.success) throw new Error(result.error);
      console.log(`📧 Generic email sent to ${params.to}`);
    };

    const logToConsole = () => {
      console.log("\n📧 ===== GENERIC EMAIL (DEV MODE - FALLBACK) =====");
      console.log(`To:      ${params.to}`);
      console.log(`Subject: ${params.subject}`);
      if (params.attachments?.length) {
        console.log(
          `Attachments: ${params.attachments.map((a) => a.filename).join(", ")}`,
        );
      }
      console.log("Body (HTML):", params.html.substring(0, 300), "...");
      console.log("===================================\n");
    };

    if (config.nodeEnv === "development") {
      try {
        await sendViaProvider();
      } catch (error: any) {
        console.warn(
          `[EmailService] Dev provider failed (${error.message}), logging to console.`,
        );
        logToConsole();
      }
      return;
    }

    // Producción: intentar enviar; si falla, loguear pero no lanzar error (no crítico)
    try {
      await sendViaProvider();
    } catch (error: any) {
      console.error("[EmailService] sendGenericEmail error:", error.message);
      // Re-lanzar para que el caller pueda decidir cómo manejarlo
      throw error;
    }
  }
}

export const emailService = new EmailService();

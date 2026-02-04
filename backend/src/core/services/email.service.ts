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

    // Si no hay integración, usar SendGrid global como fallback
    if (!integration) {
      if (!config.sendgrid.apiKey) {
        throw new Error(
          "No email integration configured for BusinessUnit and SendGrid fallback not available",
        );
      }

      return emailProviderResolver(
        "sendgrid",
        { apiKey: config.sendgrid.apiKey },
        {
          defaultFrom: config.sendgrid.fromEmail,
          defaultFromName: config.sendgrid.fromName,
        },
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
}

export const emailService = new EmailService();

/**
 * EMAIL SERVICE
 * Servicio para envío de emails transaccionales con soporte multi-provider por BusinessUnit
 */

import prisma from "@config/database";
import { config } from "@config/index";
import { EmailProvider } from "@core/contracts/email.provider";
import { emailProviderResolver } from "@/bootstrap/email-resolver.bootstrap";
import Handlebars from "handlebars";

export class EmailService {
  private compileTemplate(template: string, data: Record<string, any>): string {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }

  private async getEmailBrandingContext(businessUnitId: string) {
    const branding = await prisma.businessUnitBranding.findUnique({
      where: { businessUnitId },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!branding) return null;

    return {
      businessUnitName: branding.businessUnit.name,
      logoUrl: branding.logoUrl || "",
      primaryColor: branding.primaryColor || "#1E40AF",
      secondaryColor: branding.secondaryColor || "#334155",
      fontFamily: branding.fontFamily || "Inter",
    };
  }

  private applyBrandingWrapper(
    htmlContent: string,
    options: {
      businessUnitName: string;
      logoUrl?: string;
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
    },
  ): string {
    const headerBlock = `
      <div style="background:${options.primaryColor};color:#fff;padding:18px 20px;text-align:center;border-radius:8px 8px 0 0;">
        ${
          options.logoUrl
            ? `<img src="${options.logoUrl}" alt="${options.businessUnitName}" style="max-height:56px;max-width:220px;object-fit:contain;margin-bottom:10px;" />`
            : ""
        }
        <div style="font-size:18px;font-weight:700;">${options.businessUnitName}</div>
      </div>
    `;

    const footerBlock = `
      <div style="background:${options.secondaryColor};color:#fff;padding:14px 20px;text-align:center;font-size:12px;border-radius:0 0 8px 8px;">
        © ${new Date().getFullYear()} ${options.businessUnitName}
      </div>
    `;

    const hasHtmlTag = /<html[\s>]/i.test(htmlContent);
    const hasBodyTag = /<body[\s>]/i.test(htmlContent);

    if (hasHtmlTag && hasBodyTag) {
      return htmlContent
        .replace(/<body([^>]*)>/i, (_m, bodyAttrs) => {
          return `<body${bodyAttrs} style="font-family:${options.fontFamily},Arial,sans-serif;">${headerBlock}`;
        })
        .replace(/<\/body>/i, `${footerBlock}</body>`);
    }

    return `
      <div style="max-width:680px;margin:0 auto;font-family:${options.fontFamily},Arial,sans-serif;line-height:1.6;color:#333;">
        ${headerBlock}
        <div style="padding:24px 20px;background:#f9f9f9;">${htmlContent}</div>
        ${footerBlock}
      </div>
    `;
  }

  private async resolveCustomEmailTemplate(
    businessUnitId: string,
    emailType: string,
    data: Record<string, any>,
    fallback: { subject: string; html: string; text?: string },
  ) {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        businessUnitId,
        emailType,
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

    if (!template) return fallback;

    const customColors =
      template.customColors && typeof template.customColors === "object"
        ? (template.customColors as Record<string, any>)
        : {};

    const themedData = {
      ...data,
      ...(customColors.primary ? { primaryColor: customColors.primary } : {}),
      ...(customColors.secondary
        ? { secondaryColor: customColors.secondary }
        : {}),
    };

    return {
      subject: this.compileTemplate(template.subject, themedData),
      html: this.compileTemplate(template.htmlContent, themedData),
      text: template.textContent
        ? this.compileTemplate(template.textContent, themedData)
        : fallback.text,
    };
  }
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
    const fallback = {
      subject: "Recuperar contraseña - DivancoSaas",
      html: `
        <p>Hola <strong>${firstName}</strong>,</p>
        <p>Has solicitado recuperar tu contraseña.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#1E40AF;color:#fff;text-decoration:none;">
            Restablecer contraseña
          </a>
        </p>
        <p>Este enlace expira en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      `,
      text: `Hola ${firstName}. Recupera tu contraseña aquí: ${resetUrl}. Este enlace expira en 1 hora.`,
    };

    const resolved = await this.resolveCustomEmailTemplate(
      businessUnitId,
      "password_reset",
      { firstName, resetUrl },
      fallback,
    );

    await this.sendGenericEmail(businessUnitId, {
      to,
      subject: resolved.subject,
      html: resolved.html,
      text: resolved.text,
    });

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

    try {
      const fallback = {
        subject: "Bienvenido a DivancoSaas",
        html: `
          <p>¡Hola <strong>${firstName}</strong>!</p>
          <p>Bienvenido a DivancoSaas. Tu tenant <strong>${tenantName}</strong> ha sido creado exitosamente.</p>
          <p>
            <a href="${loginUrl}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#1E40AF;color:#fff;text-decoration:none;">
              Ingresar a la plataforma
            </a>
          </p>
          <p>Ya puedes comenzar a configurar tu plataforma.</p>
        `,
        text: `Hola ${firstName}, bienvenido a DivancoSaas. Tu tenant ${tenantName} fue creado exitosamente. Ingresa en: ${loginUrl}`,
      };

      const resolved = await this.resolveCustomEmailTemplate(
        businessUnitId,
        "welcome",
        {
          to,
          firstName,
          tenantName,
          loginUrl,
        },
        fallback,
      );

      await this.sendGenericEmail(businessUnitId, {
        to,
        subject: resolved.subject,
        html: resolved.html,
        text: resolved.text,
      });

      console.log(`📧 Welcome email sent to ${to}`);
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
      skipBranding?: boolean;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>;
    },
  ): Promise<void> {
    const sendViaProvider = async () => {
      let htmlWithBranding = params.html;

      if (!params.skipBranding) {
        try {
          const brandingContext =
            await this.getEmailBrandingContext(businessUnitId);
          if (brandingContext) {
            htmlWithBranding = this.applyBrandingWrapper(
              params.html,
              brandingContext,
            );
          }
        } catch (brandingError: any) {
          console.warn(
            "[EmailService] Failed to apply branding wrapper:",
            brandingError?.message,
          );
        }
      }

      const provider = await this.getEmailProvider(businessUnitId);
      const result = await provider.sendEmail({
        to: params.to,
        cc: params.cc,
        from: (provider as any).defaultFrom,
        subject: params.subject,
        html: htmlWithBranding,
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

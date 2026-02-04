/**
 * EMAIL PROVIDER RESOLVER
 * Factory para instanciar el proveedor de email correcto según la configuración
 */

import { EmailProvider } from "@core/contracts/email.provider";
import { SendGridEmailAdapter } from "@integrations/adapters/email/sendgrid-email.adapter";
import { AzureCommunicationEmailAdapter } from "@integrations/adapters/email/azure-communication-email.adapter";

interface EmailProviderConfig {
  apiKey?: string;
  connectionString?: string;
  defaultFrom: string;
  defaultFromName?: string;
}

/**
 * Resuelve qué adapter de email usar según el provider
 */
export function emailProviderResolver(
  provider: string,
  credentials: any,
  config: EmailProviderConfig,
): EmailProvider {
  switch (provider.toLowerCase()) {
    case "sendgrid":
      return new SendGridEmailAdapter({
        apiKey: credentials.apiKey,
        defaultFrom: config.defaultFrom,
        defaultFromName: config.defaultFromName,
      });

    case "azure-communication-services":
      return new AzureCommunicationEmailAdapter({
        connectionString: credentials.connectionString,
        defaultFrom: config.defaultFrom,
      });

    // Futuros proveedores:
    // case "smtp":
    //   return new SMTPEmailAdapter({ ... });
    // case "aws-ses":
    //   return new AWSEmailAdapter({ ... });

    default:
      throw new Error(
        `Email provider "${provider}" not supported. Available: sendgrid, azure-communication-services`,
      );
  }
}

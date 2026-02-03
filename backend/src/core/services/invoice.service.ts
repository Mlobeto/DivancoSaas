import type { InvoiceProvider } from "@core/contracts/invoice.provider";
import prisma from "@config/database";

type InvoiceProviderFactory = (
  provider: string,
  config: any,
) => InvoiceProvider;
let invoiceProviderFactory: InvoiceProviderFactory;

/**
 * Establece la factory para crear instancias de InvoiceProvider
 * Debe ser llamado desde app.ts al iniciar la aplicación
 */
export function setInvoiceProviderFactory(factory: InvoiceProviderFactory) {
  invoiceProviderFactory = factory;
}

/**
 * Obtiene la configuración de facturación de un BusinessUnit
 */
async function getInvoiceConfig(businessUnitId: string) {
  const integration = await prisma.businessUnitIntegration.findFirst({
    where: {
      businessUnitId,
      type: "invoice",
      isActive: true,
    },
  });

  if (!integration) {
    throw new Error(
      `No invoice integration configured for BusinessUnit ${businessUnitId}`,
    );
  }

  return {
    provider: integration.provider,
    credentials: integration.credentials as Record<string, any>,
    config: integration.config as Record<string, any>,
  };
}

/**
 * Obtiene una instancia de InvoiceProvider para un BusinessUnit
 */
async function getInvoiceProvider(
  businessUnitId: string,
): Promise<InvoiceProvider> {
  if (!invoiceProviderFactory) {
    throw new Error(
      "InvoiceProviderFactory not initialized. Call setInvoiceProviderFactory in app.ts",
    );
  }

  const { provider, credentials, config } =
    await getInvoiceConfig(businessUnitId);

  const invoiceConfig = {
    provider,
    environment: config.environment || "sandbox",
    ...credentials,
    ...config,
  };

  return invoiceProviderFactory(provider, invoiceConfig);
}

/**
 * Crear una factura
 */
export async function createInvoice(businessUnitId: string, data: any) {
  const provider = await getInvoiceProvider(businessUnitId);

  // Validar configuración antes de crear
  const isValid = await provider.validateConfig();
  if (!isValid) {
    throw new Error("Invalid invoice provider configuration");
  }

  return await provider.createInvoice(data);
}

/**
 * Timbrar una factura
 */
export async function stampInvoice(businessUnitId: string, invoiceId: string) {
  const provider = await getInvoiceProvider(businessUnitId);
  return await provider.stampInvoice(invoiceId);
}

/**
 * Cancelar una factura
 */
export async function cancelInvoice(
  businessUnitId: string,
  data: {
    invoiceId: string;
    uuid?: string;
    reason?: string;
    replacementUuid?: string;
  },
) {
  const provider = await getInvoiceProvider(businessUnitId);
  return await provider.cancelInvoice(data);
}

/**
 * Obtener información de una factura
 */
export async function getInvoice(businessUnitId: string, invoiceId: string) {
  const provider = await getInvoiceProvider(businessUnitId);
  return await provider.getInvoice(invoiceId);
}

/**
 * Descargar XML de una factura
 */
export async function downloadInvoiceXml(
  businessUnitId: string,
  invoiceId: string,
) {
  const provider = await getInvoiceProvider(businessUnitId);
  return await provider.downloadXml(invoiceId);
}

/**
 * Descargar PDF de una factura
 */
export async function downloadInvoicePdf(
  businessUnitId: string,
  invoiceId: string,
) {
  const provider = await getInvoiceProvider(businessUnitId);
  return await provider.downloadPdf(invoiceId);
}

/**
 * Validar configuración de facturación
 */
export async function validateInvoiceConfig(businessUnitId: string) {
  const provider = await getInvoiceProvider(businessUnitId);
  return await provider.validateConfig();
}

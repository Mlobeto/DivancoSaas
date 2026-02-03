import type { ShippingProvider } from "@core/contracts/shipping.provider";
import prisma from "@config/database";

type ShippingProviderFactory = (
  provider: string,
  config: any,
) => ShippingProvider;
let shippingProviderFactory: ShippingProviderFactory;

/**
 * Establece la factory para crear instancias de ShippingProvider
 * Debe ser llamado desde app.ts al iniciar la aplicación
 */
export function setShippingProviderFactory(factory: ShippingProviderFactory) {
  shippingProviderFactory = factory;
}

/**
 * Obtiene la configuración de envíos de un BusinessUnit
 */
async function getShippingConfig(businessUnitId: string) {
  const integration = await prisma.businessUnitIntegration.findFirst({
    where: {
      businessUnitId,
      type: "shipping",
      isActive: true,
    },
  });

  if (!integration) {
    throw new Error(
      `No shipping integration configured for BusinessUnit ${businessUnitId}`,
    );
  }

  return {
    provider: integration.provider,
    credentials: integration.credentials as Record<string, any>,
    config: integration.config as Record<string, any>,
  };
}

/**
 * Obtiene una instancia de ShippingProvider para un BusinessUnit
 */
async function getShippingProvider(
  businessUnitId: string,
): Promise<ShippingProvider> {
  if (!shippingProviderFactory) {
    throw new Error(
      "ShippingProviderFactory not initialized. Call setShippingProviderFactory in app.ts",
    );
  }

  const { provider, credentials, config } =
    await getShippingConfig(businessUnitId);

  const shippingConfig = {
    provider,
    environment: config.environment || "sandbox",
    ...credentials,
    ...config,
  };

  return shippingProviderFactory(provider, shippingConfig);
}

/**
 * Crear un envío
 */
export async function createShipment(businessUnitId: string, data: any) {
  const provider = await getShippingProvider(businessUnitId);

  // Validar configuración antes de crear
  const isValid = await provider.validateConfig();
  if (!isValid) {
    throw new Error("Invalid shipping provider configuration");
  }

  return await provider.createShipment(data);
}

/**
 * Obtener cotizaciones de envío
 */
export async function getShippingRates(
  businessUnitId: string,
  origin: any,
  destination: any,
  packages: any[],
) {
  const provider = await getShippingProvider(businessUnitId);
  return await provider.getRates(origin, destination, packages);
}

/**
 * Rastrear un envío
 */
export async function trackShipment(
  businessUnitId: string,
  trackingNumber: string,
) {
  const provider = await getShippingProvider(businessUnitId);
  return await provider.trackShipment(trackingNumber);
}

/**
 * Obtener información de un envío
 */
export async function getShipment(businessUnitId: string, shipmentId: string) {
  const provider = await getShippingProvider(businessUnitId);
  return await provider.getShipment(shipmentId);
}

/**
 * Cancelar un envío
 */
export async function cancelShipment(
  businessUnitId: string,
  data: { shipmentId: string; trackingNumber?: string; reason?: string },
) {
  const provider = await getShippingProvider(businessUnitId);
  return await provider.cancelShipment(data);
}

/**
 * Descargar etiqueta de envío
 */
export async function downloadShipmentLabel(
  businessUnitId: string,
  shipmentId: string,
  format: "pdf" | "png" | "zpl" = "pdf",
) {
  const provider = await getShippingProvider(businessUnitId);
  return await provider.downloadLabel(shipmentId, format);
}

/**
 * Programar recolección
 */
export async function schedulePickup(businessUnitId: string, data: any) {
  const provider = await getShippingProvider(businessUnitId);

  if (!provider.schedulePickup) {
    throw new Error("Pickup scheduling not supported by this provider");
  }

  return await provider.schedulePickup(data);
}

/**
 * Validar dirección
 */
export async function validateAddress(businessUnitId: string, address: any) {
  const provider = await getShippingProvider(businessUnitId);

  if (!provider.validateAddress) {
    // Si el provider no soporta validación, retornar válido por defecto
    return { valid: true };
  }

  return await provider.validateAddress(address);
}

/**
 * Validar configuración de envíos
 */
export async function validateShippingConfig(businessUnitId: string) {
  const provider = await getShippingProvider(businessUnitId);
  return await provider.validateConfig();
}

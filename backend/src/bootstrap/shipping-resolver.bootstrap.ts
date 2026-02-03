import type {
  ShippingProvider,
  ShippingConfig,
} from "@core/contracts/shipping.provider";
import { ManualShippingAdapter } from "../integrations/adapters/shipping/manual-shipping.adapter";
import { FedexAdapter } from "../integrations/adapters/shipping/fedex.adapter";

/**
 * Resolver para proveedores de envío
 * Instancia el adapter correcto según el proveedor configurado
 */
export function shippingProviderResolver(
  provider: string,
  config: ShippingConfig,
): ShippingProvider {
  switch (provider.toLowerCase()) {
    case "manual":
      return new ManualShippingAdapter(config);

    case "fedex":
      return new FedexAdapter(config);

    // Agregar aquí nuevos proveedores de envío
    // case "dhl":
    //   return new DHLAdapter(config);
    // case "ups":
    //   return new UPSAdapter(config);
    // case "estafeta":
    //   return new EstafetaAdapter(config);

    default:
      throw new Error(
        `Shipping provider "${provider}" is not supported. ` +
          `Available providers: manual, fedex`,
      );
  }
}

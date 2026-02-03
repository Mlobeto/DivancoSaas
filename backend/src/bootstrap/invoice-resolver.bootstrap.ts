import type {
  InvoiceProvider,
  InvoiceConfig,
} from "@core/contracts/invoice.provider";
import { TaxxaAdapter } from "../integrations/adapters/invoicing/taxxa.adapter";
import { DivancoAdapter } from "../integrations/adapters/invoicing/divanco.adapter";

/**
 * Resolver para proveedores de facturación
 * Instancia el adapter correcto según el proveedor configurado
 */
export function invoiceProviderResolver(
  provider: string,
  config: InvoiceConfig,
): InvoiceProvider {
  switch (provider.toLowerCase()) {
    case "taxxa":
      return new TaxxaAdapter(config);

    case "divanco":
      return new DivancoAdapter(config);

    // Agregar aquí nuevos proveedores de facturación
    // case "otro_proveedor":
    //   return new OtroProveedorAdapter(config);

    default:
      throw new Error(
        `Invoice provider "${provider}" is not supported. ` +
          `Available providers: taxxa, divanco`,
      );
  }
}

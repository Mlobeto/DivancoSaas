import type {
  ShippingProvider,
  ShippingConfig,
  CreateShipmentInput,
  ShipmentResult,
  Shipment,
  TrackingInfo,
  ShippingRate,
  CancelShipmentInput,
  CancelShipmentResult,
  Address,
  Package,
} from "@core/contracts/shipping.provider";

/**
 * Adapter Manual para envíos
 * Útil para negocios que manejan sus propios envíos sin integración a carriers
 */
export class ManualShippingAdapter implements ShippingProvider {
  constructor(private config: ShippingConfig) {}

  async validateConfig(): Promise<boolean> {
    return true; // Manual shipping no requiere validación de API
  }

  async createShipment(data: CreateShipmentInput): Promise<ShipmentResult> {
    // Genera un ID y tracking number locales
    const shipmentId = `MANUAL-${Date.now()}`;
    const trackingNumber = `TRACK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return {
      success: true,
      shipmentId,
      trackingNumber,
      carrier: "manual",
      serviceType: data.serviceType || "standard",
      estimatedDelivery: data.deliveryDate,
      status: "pending",
      cost: {
        amount: 0, // El negocio define el costo manualmente
        currency: "MXN",
      },
      metadata: {
        provider: "manual",
        origin: data.origin,
        destination: data.destination,
        packages: data.packages,
        references: data.references,
        notes: data.notes,
      },
    };
  }

  async getRates(
    origin: Address,
    destination: Address,
    packages: Package[],
  ): Promise<ShippingRate[]> {
    // Retorna tarifas por defecto (el negocio las configura)
    return [
      {
        carrier: "manual",
        serviceType: "standard",
        serviceName: "Envío Estándar",
        amount: 0,
        currency: "MXN",
        deliveryDays: 3,
      },
      {
        carrier: "manual",
        serviceType: "express",
        serviceName: "Envío Express",
        amount: 0,
        currency: "MXN",
        deliveryDays: 1,
      },
    ];
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    // Retorna información básica
    return {
      trackingNumber,
      carrier: "manual",
      status: "pending",
      events: [
        {
          timestamp: new Date(),
          status: "pending",
          description: "Envío registrado - Gestión manual",
          location: {
            city: "N/A",
            state: "N/A",
            country: "MX",
          },
        },
      ],
    };
  }

  async getShipment(shipmentId: string): Promise<Shipment> {
    // En un caso real, esto vendría de la base de datos
    throw new Error("Manual shipping requires database lookup");
  }

  async cancelShipment(
    data: CancelShipmentInput,
  ): Promise<CancelShipmentResult> {
    return {
      success: true,
      status: "cancelled",
    };
  }

  async downloadLabel(
    shipmentId: string,
    format: "pdf" | "png" | "zpl" = "pdf",
  ): Promise<Buffer> {
    throw new Error("Manual shipping does not generate labels automatically");
  }
}

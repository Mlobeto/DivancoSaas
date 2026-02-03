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
 * Adapter para FedEx
 * Integración con FedEx Ship Manager API
 */
export class FedexAdapter implements ShippingProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly accountNumber: string;

  constructor(private config: ShippingConfig) {
    this.baseUrl =
      config.environment === "production"
        ? "https://apis.fedex.com"
        : "https://apis-sandbox.fedex.com";

    if (!config.apiKey || !config.apiSecret || !config.accountNumber) {
      throw new Error("FedEx requires apiKey, apiSecret, and accountNumber");
    }

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accountNumber = config.accountNumber;
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.apiKey,
        client_secret: this.apiSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with FedEx");
    }

    const data: any = await response.json();
    return data.access_token;
  }

  private mapServiceType(serviceType?: string): string {
    const mapping: Record<string, string> = {
      express: "FEDEX_2_DAY",
      standard: "FEDEX_GROUND",
      economy: "GROUND_HOME_DELIVERY",
      overnight: "STANDARD_OVERNIGHT",
    };
    return mapping[serviceType || "standard"] || "FEDEX_GROUND";
  }

  async createShipment(data: CreateShipmentInput): Promise<ShipmentResult> {
    try {
      const token = await this.getAccessToken();

      const fedexPayload = {
        accountNumber: {
          value: this.accountNumber,
        },
        requestedShipment: {
          shipper: {
            contact: {
              personName: data.origin.name,
              phoneNumber: data.origin.phone,
              companyName: data.origin.company,
            },
            address: {
              streetLines: [data.origin.street, data.origin.number],
              city: data.origin.city,
              stateOrProvinceCode: data.origin.state,
              postalCode: data.origin.zipCode,
              countryCode: data.origin.country,
            },
          },
          recipient: {
            contact: {
              personName: data.destination.name,
              phoneNumber: data.destination.phone,
              companyName: data.destination.company,
            },
            address: {
              streetLines: [data.destination.street, data.destination.number],
              city: data.destination.city,
              stateOrProvinceCode: data.destination.state,
              postalCode: data.destination.zipCode,
              countryCode: data.destination.country,
              residential: true,
            },
          },
          serviceType: this.mapServiceType(data.serviceType),
          packagingType: "YOUR_PACKAGING",
          pickupType: "USE_SCHEDULED_PICKUP",
          requestedPackageLineItems: data.packages.map((pkg) => ({
            weight: {
              units: "KG",
              value: pkg.weight,
            },
            dimensions: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
              units: "CM",
            },
          })),
          shippingChargesPayment: {
            paymentType: "SENDER",
          },
          labelSpecification: {
            imageType: "PDF",
            labelStockType: "PAPER_7X4.75",
          },
        },
      };

      const response = await fetch(`${this.baseUrl}/ship/v1/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fedexPayload),
      });

      if (!response.ok) {
        const error: any = await response.json();
        return {
          success: false,
          shipmentId: "",
          status: "error",
          errors: [error.message || "Error creating shipment"],
        };
      }

      const result: any = await response.json();
      const shipmentData = result.output.transactionShipments[0];

      return {
        success: true,
        shipmentId: shipmentData.masterTrackingNumber,
        trackingNumber: shipmentData.masterTrackingNumber,
        carrier: "fedex",
        serviceType: data.serviceType,
        estimatedDelivery: shipmentData.serviceCommitment?.dateDetail?.dayFormat
          ? new Date(shipmentData.serviceCommitment.dateDetail.dayFormat)
          : undefined,
        cost: {
          amount: shipmentData.shipmentRating?.totalNetCharge || 0,
          currency: shipmentData.shipmentRating?.currency || "USD",
        },
        labelUrl: shipmentData.pieceResponses[0]?.packageDocuments[0]?.url,
        status: "created",
        metadata: {
          provider: "fedex",
          raw: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        shipmentId: "",
        status: "error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async getRates(
    origin: Address,
    destination: Address,
    packages: Package[],
  ): Promise<ShippingRate[]> {
    try {
      const token = await this.getAccessToken();

      const ratePayload = {
        accountNumber: {
          value: this.accountNumber,
        },
        requestedShipment: {
          shipper: {
            address: {
              city: origin.city,
              stateOrProvinceCode: origin.state,
              postalCode: origin.zipCode,
              countryCode: origin.country,
            },
          },
          recipient: {
            address: {
              city: destination.city,
              stateOrProvinceCode: destination.state,
              postalCode: destination.zipCode,
              countryCode: destination.country,
            },
          },
          requestedPackageLineItems: packages.map((pkg) => ({
            weight: {
              units: "KG",
              value: pkg.weight,
            },
          })),
        },
      };

      const response = await fetch(`${this.baseUrl}/rate/v1/rates/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ratePayload),
      });

      if (!response.ok) {
        return [];
      }

      const result: any = await response.json();

      return result.output.rateReplyDetails.map((rate: any) => ({
        carrier: "fedex",
        serviceType: rate.serviceType,
        serviceName: rate.serviceName,
        amount: rate.ratedShipmentDetails[0].totalNetCharge,
        currency: rate.ratedShipmentDetails[0].currency,
        deliveryDays: rate.commit?.dateDetail?.dayOfWeek,
        estimatedDelivery: rate.commit?.dateDetail?.dayFormat
          ? new Date(rate.commit.dateDetail.dayFormat)
          : undefined,
      }));
    } catch (error) {
      return [];
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/track/v1/trackingnumbers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber,
            },
          },
        ],
        includeDetailedScans: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Tracking not found");
    }

    const result: any = await response.json();
    const tracking = result.output.completeTrackResults[0].trackResults[0];

    return {
      trackingNumber,
      carrier: "fedex",
      status: this.mapFedexStatus(tracking.latestStatusDetail.code),
      currentLocation: tracking.latestStatusDetail.scanLocation
        ? {
            city: tracking.latestStatusDetail.scanLocation.city,
            state: tracking.latestStatusDetail.scanLocation.stateOrProvinceCode,
            country: tracking.latestStatusDetail.scanLocation.countryCode,
            timestamp: new Date(tracking.latestStatusDetail.statusDateTime),
          }
        : undefined,
      estimatedDelivery: tracking.estimatedDeliveryTimeWindow?.window?.ends
        ? new Date(tracking.estimatedDeliveryTimeWindow.window.ends)
        : undefined,
      events: tracking.scanEvents.map((event: any) => ({
        timestamp: new Date(event.date),
        status: event.eventType,
        description: event.eventDescription,
        location: event.scanLocation
          ? {
              city: event.scanLocation.city,
              state: event.scanLocation.stateOrProvinceCode,
              country: event.scanLocation.countryCode,
            }
          : undefined,
      })),
    };
  }

  private mapFedexStatus(code: string): TrackingInfo["status"] {
    const mapping: Record<string, TrackingInfo["status"]> = {
      PU: "in_transit",
      IT: "in_transit",
      OD: "out_for_delivery",
      DL: "delivered",
      DE: "exception",
      CA: "cancelled",
    };
    return mapping[code] || "in_transit";
  }

  async getShipment(shipmentId: string): Promise<Shipment> {
    const tracking = await this.trackShipment(shipmentId);

    // FedEx no provee API para obtener detalles completos del shipment
    // En producción, esto debería venir de tu base de datos
    throw new Error("Use trackShipment for FedEx shipment details");
  }

  async cancelShipment(
    data: CancelShipmentInput,
  ): Promise<CancelShipmentResult> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/ship/v1/shipments/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber: {
            value: this.accountNumber,
          },
          trackingNumber: data.trackingNumber,
        }),
      });

      if (!response.ok) {
        const error: any = await response.json();
        return {
          success: false,
          status: "error",
          errors: [error.message || "Error cancelling shipment"],
        };
      }

      return {
        success: true,
        status: "cancelled",
      };
    } catch (error) {
      return {
        success: false,
        status: "error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async downloadLabel(
    shipmentId: string,
    format: "pdf" | "png" | "zpl" = "pdf",
  ): Promise<Buffer> {
    // Las etiquetas de FedEx se obtienen en createShipment
    // Este método requeriría almacenar la URL de la etiqueta
    throw new Error("Label URL is provided in createShipment response");
  }
}

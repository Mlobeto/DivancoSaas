/**
 * Contrato para proveedores de envío/logística
 * Soporta múltiples proveedores (Manual, FedEx, DHL, UPS, Estafeta, etc.)
 */

export interface ShippingConfig {
  provider: string; // "manual", "fedex", "dhl", "ups", "estafeta", etc.
  apiKey?: string;
  apiSecret?: string;
  accountNumber?: string;
  environment: "sandbox" | "production";
  defaultOrigin?: Address;
  metadata?: Record<string, any>;
}

export interface Address {
  name: string;
  company?: string;
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone?: string;
  email?: string;
  references?: string;
}

export interface Package {
  weight: number; // en kg
  length: number; // en cm
  width: number;
  height: number;
  description?: string;
  value?: number; // Valor declarado
  contents?: string;
}

export interface CreateShipmentInput {
  origin: Address;
  destination: Address;
  packages: Package[];
  serviceType?: string; // "express", "standard", "economy", etc.
  insurance?: {
    enabled: boolean;
    value: number;
  };
  requiresSignature?: boolean;
  deliveryDate?: Date; // Fecha deseada de entrega
  scheduledPickup?: {
    date: Date;
    timeWindow: {
      start: string; // "09:00"
      end: string; // "18:00"
    };
  };
  references?: {
    customerReference?: string;
    orderNumber?: string;
    invoiceNumber?: string;
  };
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ShipmentResult {
  success: boolean;
  shipmentId: string;
  trackingNumber?: string;
  carrier?: string;
  serviceType?: string;
  estimatedDelivery?: Date;
  cost?: {
    amount: number;
    currency: string;
    breakdown?: Array<{
      concept: string;
      amount: number;
    }>;
  };
  labelUrl?: string;
  status:
    | "pending"
    | "created"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "error";
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface Shipment {
  id: string;
  trackingNumber?: string;
  carrier?: string;
  serviceType?: string;
  status:
    | "pending"
    | "created"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "error";
  origin: Address;
  destination: Address;
  packages: Package[];
  cost?: {
    amount: number;
    currency: string;
  };
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  labelUrl?: string;
  metadata?: Record<string, any>;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status:
    | "pending"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "exception"
    | "cancelled";
  currentLocation?: {
    city: string;
    state: string;
    country: string;
    timestamp: Date;
  };
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  signedBy?: string;
  events: Array<{
    timestamp: Date;
    status: string;
    description: string;
    location?: {
      city: string;
      state: string;
      country: string;
    };
  }>;
}

export interface ShippingRate {
  carrier: string;
  serviceType: string;
  serviceName: string;
  amount: number;
  currency: string;
  estimatedDelivery?: Date;
  deliveryDays?: number;
  metadata?: Record<string, any>;
}

export interface CancelShipmentInput {
  shipmentId: string;
  trackingNumber?: string;
  reason?: string;
}

export interface CancelShipmentResult {
  success: boolean;
  status: string;
  refundAmount?: number;
  errors?: string[];
}

/**
 * Interface principal para proveedores de envío
 */
export interface ShippingProvider {
  /**
   * Crear un envío y obtener guía
   */
  createShipment(data: CreateShipmentInput): Promise<ShipmentResult>;

  /**
   * Obtener cotizaciones de envío
   */
  getRates(
    origin: Address,
    destination: Address,
    packages: Package[],
  ): Promise<ShippingRate[]>;

  /**
   * Rastrear un envío
   */
  trackShipment(trackingNumber: string): Promise<TrackingInfo>;

  /**
   * Obtener información de un envío
   */
  getShipment(shipmentId: string): Promise<Shipment>;

  /**
   * Cancelar un envío
   */
  cancelShipment(data: CancelShipmentInput): Promise<CancelShipmentResult>;

  /**
   * Descargar etiqueta/guía de envío
   */
  downloadLabel(
    shipmentId: string,
    format?: "pdf" | "png" | "zpl",
  ): Promise<Buffer>;

  /**
   * Programar recolección (pickup)
   */
  schedulePickup?(data: {
    address: Address;
    date: Date;
    timeWindow: { start: string; end: string };
    packages: Package[];
    notes?: string;
  }): Promise<{
    success: boolean;
    pickupId?: string;
    confirmationNumber?: string;
  }>;

  /**
   * Validar dirección
   */
  validateAddress?(address: Address): Promise<{
    valid: boolean;
    suggestions?: Address[];
    errors?: string[];
  }>;

  /**
   * Validar configuración del provider
   */
  validateConfig(): Promise<boolean>;
}

/**
 * QUOTATION TYPES
 * Tipos TypeScript para el sistema de cotizaciones con auto-cálculo
 * v4.0 - Tipos de cotización, STANDBY, operador PER_DAY/PER_HOUR
 */

/**
 * Tipo de cotización
 */
export type QuotationType = "time_based" | "service_based";

/**
 * Tipo de período de renta
 */
export type RentalPeriodType = "hourly" | "daily" | "weekly" | "monthly";

/**
 * Tipo de costo del operador
 */
export type OperatorCostType = "PER_DAY" | "PER_HOUR";

/**
 * Parámetros para crear una cotización
 */
export interface CreateQuotationDTO {
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  assignedUserId?: string;
  validUntil: Date;

  // Tipo de cotización (v4.0)
  quotationType?: QuotationType; // Default: "time_based"

  // Para cotizaciones por tiempo estimado (time_based)
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  estimatedDays?: number;

  // Para cotizaciones por servicio (service_based)
  serviceDescription?: string;

  items: QuotationItemDTO[];
  taxRate?: number;
  currency?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
}

/**
 * Item de cotización (entrada)
 * Soporta auto-cálculo desde assets y override manual
 * v4.0 - STANDBY, operador PER_DAY/PER_HOUR
 */
export interface QuotationItemDTO {
  // Identificadores
  assetId?: string; // Para maquinaria/herramientas → auto-cálculo
  productId?: string; // Para otros productos → precio manual

  // Descripción y cantidad
  description: string;
  quantity: number;

  // Auto-cálculo desde asset
  rentalDays?: number; // Número de días de alquiler
  rentalStartDate?: Date;
  rentalEndDate?: Date;

  // Tipo de período (v4.0)
  rentalPeriodType?: RentalPeriodType;

  // STANDBY: Horas mínimas garantizadas para MACHINERY (v4.0)
  standbyHours?: number; // Ej: 3.0 horas/día mínimas facturadas

  // Operador
  operatorIncluded?: boolean; // Si incluir operador en el cálculo
  operatorCostType?: OperatorCostType; // PER_DAY (obra lejos) o PER_HOUR (obra cerca)

  // Pricing (opcional si se usa auto-cálculo)
  unitPrice?: number; // Precio manual (si no se auto-calcula)
  customUnitPrice?: number; // Override del precio calculado
  customOperatorCost?: number; // Override del costo del operador

  // Desglose detallado (opcional, v4.0)
  basePrice?: number; // Precio base del asset
  operatorCostAmount?: number; // Costo del operador separado
  maintenanceCost?: number; // Costo de mantenimiento
  discount?: number; // Descuento aplicado
  discountReason?: string; // Razón del descuento
}

/**
 * Actualización de precios de items (override manual)
 */
export interface UpdateQuotationItemPriceDTO {
  itemId: string;
  customUnitPrice?: number;
  customOperatorCost?: number;
}

/**
 * Resultado del cálculo de precio de un item
 */
export interface CalculatedItemPrice {
  unitPrice: number; // Precio final (calculado o custom)
  calculatedUnitPrice: number; // Precio calculado original
  operatorCost: number; // Costo del operador final
  calculatedOperatorCost: number; // Costo del operador calculado
  priceOverridden: boolean; // Si el precio fue modificado manualmente
  operatorIncluded: boolean; // Si incluye operador
}

/**
 * Reglas de auto-cálculo de precios
 * v4.0 - Con STANDBY y operador PER_DAY/PER_HOUR
 */
export interface PricingRules {
  // MACHINERY: precio por hora con STANDBY
  // Fórmula: rentalDays * Math.max(horasReportadas, standbyHours) * pricePerHour
  // Ejemplo: standbyHours=3 garantiza mínimo 3 horas/día facturadas
  // Operador:
  //   - PER_DAY: viáticos fijos ($3,000/día para obra lejos)
  //   - PER_HOUR: viáticos por hora ($375/hora para obra cerca)
  // TOOL: precio por día/semana/mes
  // ≥30 días → pricePerMonth
  // ≥7 días → pricePerWeek
  // <7 días → pricePerDay
}

/**
 * Estado de una cotización
 */
export type QuotationStatus =
  | "draft" // Borrador (editable)
  | "sent" // Enviada al cliente
  | "viewed" // Vista por el cliente
  | "signature_pending" // Esperando firma digital
  | "signed" // Firmada
  | "paid" // Pagada
  | "cancelled"; // Cancelada

/**
 * Ejemplo de uso:
 *
 * // 1. Cotización por TIEMPO ESTIMADO (time_based) - Obra con duración
 * const quotation = await quotationService.createQuotation({
 *   tenantId: "tenant-123",
 *   businessUnitId: "bu-456",
 *   clientId: "client-789",
 *   quotationType: "time_based",
 *   estimatedStartDate: new Date("2026-02-15"),
 *   estimatedEndDate: new Date("2026-04-15"),
 *   estimatedDays: 60,
 *   validUntil: new Date("2026-03-15"),
 *   items: [
 *     {
 *       assetId: "excavadora-001",
 *       description: "Excavadora CAT 320",
 *       quantity: 1,
 *       rentalDays: 60,
 *       rentalPeriodType: "hourly",
 *       standbyHours: 3.0, // STANDBY: Mínimo 3 hrs/día facturadas
 *       operatorIncluded: true,
 *       operatorCostType: "PER_DAY", // Obra lejos: viáticos fijos
 *       // NO especificar unitPrice → se calcula automáticamente
 *     },
 *   ],
 *   createdBy: "user-123",
 * });
 *
 * // 2. Cotización por SERVICIO (service_based) - Sin tiempo definido
 * const serviceQuotation = await quotationService.createQuotation({
 *   tenantId: "tenant-123",
 *   businessUnitId: "bu-456",
 *   clientId: "client-789",
 *   quotationType: "service_based",
 *   serviceDescription: "Construcción de 2km de camino rural con compactación completa",
 *   validUntil: new Date("2026-03-15"),
 *   items: [
 *     {
 *       assetId: "motoniveladora-001",
 *       description: "Motoniveladora",
 *       quantity: 1,
 *       rentalDays: 30, // Estimado inicial
 *       operatorIncluded: true,
 *       operatorCostType: "PER_HOUR", // Obra cerca: viáticos por hora
 *     },
 *   ],
 *   createdBy: "user-123",
 * });
 *
 * // 3. Override de precio después de crear
 * await quotationService.updateQuotationItemPrices(quotation.id, [
 *   {
 *     itemId: "item-123",
 *     customUnitPrice: 45000, // Override: cliente prefiere otro precio
 *     customOperatorCost: 12000, // Override: negociación especial
 *   },
 * ]);
 *
 * // 4. Cotización mixta (asset + producto manual)
 * const mixedQuotation = await quotationService.createQuotation({
 *   quotationType: "time_based",
 *   items: [
 *     {
 *       assetId: "grua-001",
 *       description: "Grúa Torre",
 *       quantity: 1,
 *       rentalDays: 60,
 *       standbyHours: 4.0,
 *       operatorCostType: "PER_DAY",
 *       // Auto-cálculo
 *     },
 *     {
 *       productId: "producto-abc",
 *       description: "Transporte especializado",
 *       quantity: 1,
 *       unitPrice: 5000, // Precio manual
 *     },
 *   ],
 * });
 */

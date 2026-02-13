/**
 * QUOTATION TYPES
 * Tipos TypeScript para el sistema de cotizaciones con auto-cálculo
 */

/**
 * Parámetros para crear una cotización
 */
export interface CreateQuotationDTO {
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  assignedUserId?: string;
  validUntil: Date;
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
  operatorIncluded?: boolean; // Si incluir operador en el cálculo

  // Pricing (opcional si se usa auto-cálculo)
  unitPrice?: number; // Precio manual (si no se auto-calcula)
  customUnitPrice?: number; // Override del precio calculado
  customOperatorCost?: number; // Override del costo del operador
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
 */
export interface PricingRules {
  // MACHINERY: precio por hora
  // Fórmula: rentalDays * minDailyHours * pricePerHour
  // Operador: según operatorCostType (PER_HOUR o PER_DAY)
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
 * // 1. Cotización con auto-cálculo (MACHINERY)
 * const quotation = await quotationService.createQuotation({
 *   tenantId: "tenant-123",
 *   businessUnitId: "bu-456",
 *   clientId: "client-789",
 *   validUntil: new Date("2026-03-15"),
 *   items: [
 *     {
 *       assetId: "excavadora-001",
 *       description: "Excavadora CAT 320",
 *       quantity: 1,
 *       rentalDays: 30,
 *       operatorIncluded: true, // Auto-calcula operador
 *       // NO especificar unitPrice → se calcula automáticamente
 *     },
 *   ],
 *   createdBy: "user-123",
 * });
 *
 * // 2. Override de precio después de crear
 * await quotationService.updateQuotationItemPrices(quotation.id, [
 *   {
 *     itemId: "item-123",
 *     customUnitPrice: 45000, // Override: cliente prefiere otro precio
 *     customOperatorCost: 12000, // Override: negociación especial
 *   },
 * ]);
 *
 * // 3. Cotización mixta (asset + producto manual)
 * const mixedQuotation = await quotationService.createQuotation({
 *   items: [
 *     {
 *       assetId: "grua-001",
 *       description: "Grúa Torre",
 *       quantity: 1,
 *       rentalDays: 60,
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

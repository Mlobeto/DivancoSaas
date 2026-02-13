/**
 * QUOTATION TYPES
 * Tipos TypeScript para el sistema de cotizaciones
 */

export interface Quotation {
  id: string;
  code: string;
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  assignedUserId?: string;
  status: QuotationStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  quotationDate: Date;
  validUntil: Date;
  templateId?: string;
  pdfUrl?: string;
  signedPdfUrl?: string;
  signatureRequestId?: string;
  signatureStatus?: string;
  signatureProvider?: string;
  signedAt?: Date;
  signedBy?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Relaciones
  client?: Client;
  assignedUser?: User;
  items: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  assetId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  calculatedUnitPrice?: number;
  priceOverridden: boolean;
  operatorIncluded: boolean;
  operatorCost?: number;
  calculatedOperatorCost?: number;
  rentalDays?: number;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  sortOrder: number;

  // Relaciones
  asset?: Asset;
}

export type QuotationStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signature_pending"
  | "signed"
  | "paid"
  | "cancelled";

export interface CreateQuotationDTO {
  businessUnitId: string;
  clientId: string;
  assignedUserId?: string;
  validUntil: string;
  items: QuotationItemDTO[];
  taxRate?: number;
  currency?: string;
  notes?: string;
  termsAndConditions?: string;
}

export interface QuotationItemDTO {
  assetId?: string;
  productId?: string;
  description: string;
  quantity: number;
  rentalDays?: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
  operatorIncluded?: boolean;
  unitPrice?: number;
  customUnitPrice?: number;
  customOperatorCost?: number;
}

export interface UpdateQuotationItemPriceDTO {
  itemId: string;
  customUnitPrice?: number;
  customOperatorCost?: number;
}

export interface Template {
  id: string;
  tenantId: string;
  businessUnitId: string;
  name: string;
  type: TemplateType;
  content: string;
  styles?: string;
  variables: TemplateVariable[];
  logoUrl?: string;
  headerHtml?: string;
  footerHtml?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateType =
  | "quotation"
  | "contract"
  | "invoice"
  | "receipt"
  | "report"
  | "certificate";

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "array";
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface CreateTemplateDTO {
  businessUnitId: string;
  name: string;
  type: TemplateType;
  content: string;
  styles?: string;
  variables: TemplateVariable[];
  logoUrl?: string;
  headerHtml?: string;
  footerHtml?: string;
}

// Helper types
interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Asset {
  id: string;
  code: string;
  description: string;
  trackingType: "MACHINERY" | "TOOL";
}

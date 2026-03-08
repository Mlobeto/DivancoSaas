/**
 * MASTER CONTRACT TYPES & VALIDATION
 * Types para Master Contract System v7.0
 */

import type { Decimal } from "@prisma/client/runtime/library";

// ============================================
// CONTRACT ADDENDUM TYPES
// ============================================

export interface CreateAddendumDTO {
  contractId: string;

  // Items a entregar
  items: AddendumItemDTO[];

  // Documentación
  notes?: string;
  metadata?: any;
}

export interface AddendumItemDTO {
  assetId: string;
  quantity: number;
  expectedReturnDate?: string; // ISO date

  // Costos estimados (opcional, si no se toman del asset)
  estimatedDailyRate?: number;
  estimatedHourlyRate?: number;

  // Operador y tracking
  operatorId?: string;
  initialHourometer?: number;
  initialOdometer?: number;

  notes?: string;
}

export interface UpdateAddendumDTO {
  notes?: string;
  metadata?: any;
}

export interface CompleteAddendumDTO {
  actualAmount?: number; // Monto real cobrado (opcional, se calcula automáticamente)
  notes?: string;
}

// ============================================
// LIMIT CHANGE REQUEST TYPES
// ============================================

export interface CreateLimitChangeRequestDTO {
  clientAccountId: string;

  // Límites solicitados
  requestedCreditLimit?: number;
  requestedTimeLimit?: number;

  // Justificación
  reason: string;
  urgency?: "low" | "normal" | "high" | "urgent";

  metadata?: any;
}

export interface ReviewLimitChangeRequestDTO {
  status: "approved" | "rejected";

  // Límites aprobados (pueden diferir de los solicitados)
  approvedCreditLimit?: number;
  approvedTimeLimit?: number;

  reviewNotes?: string;
}

// ============================================
// CONTRACT CLAUSE TEMPLATE TYPES
// ============================================

export interface CreateClauseTemplateDTO {
  businessUnitId?: string;

  // Contenido
  name: string;
  content: string;
  category: string;

  // Opciones
  isDefault?: boolean;
  displayOrder?: number;
  applicableAssetTypes?: string[];

  metadata?: any;
}

export interface UpdateClauseTemplateDTO {
  name?: string;
  content?: string;
  category?: string;
  isDefault?: boolean;
  displayOrder?: number;
  applicableAssetTypes?: string[];
  isActive?: boolean;
  metadata?: any;
}

export interface InterpolateClauseDTO {
  templateId: string;
  variables: Record<string, string>;
}

// ============================================
// MASTER CONTRACT TYPES
// ============================================

export interface CreateMasterContractDTO {
  clientId: string;
  businessUnitId: string;

  startDate: string; // ISO date
  estimatedEndDate?: string; // ISO date

  // Límites acordados
  agreedCreditLimit?: number;
  agreedTimeLimit?: number;

  // Documentación
  templateId?: string;
  pdfUrl?: string;
  notes?: string;
  metadata?: any;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export function validateCreateAddendum(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.contractId || typeof data.contractId !== "string") {
    errors.push("contractId is required and must be a string");
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push("items is required and must be a non-empty array");
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!item.assetId || typeof item.assetId !== "string") {
        errors.push(`items[${index}].assetId is required and must be a string`);
      }
      if (
        item.quantity === undefined ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        errors.push(
          `items[${index}].quantity is required and must be a positive number`,
        );
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCreateLimitChangeRequest(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.clientAccountId || typeof data.clientAccountId !== "string") {
    errors.push("clientAccountId is required and must be a string");
  }

  if (!data.requestedCreditLimit && !data.requestedTimeLimit) {
    errors.push(
      "At least one of requestedCreditLimit or requestedTimeLimit must be provided",
    );
  }

  if (
    data.requestedCreditLimit !== undefined &&
    (typeof data.requestedCreditLimit !== "number" ||
      data.requestedCreditLimit <= 0)
  ) {
    errors.push("requestedCreditLimit must be a positive number");
  }

  if (
    data.requestedTimeLimit !== undefined &&
    (typeof data.requestedTimeLimit !== "number" ||
      data.requestedTimeLimit <= 0)
  ) {
    errors.push("requestedTimeLimit must be a positive number");
  }

  if (
    !data.reason ||
    typeof data.reason !== "string" ||
    data.reason.trim() === ""
  ) {
    errors.push("reason is required and must be a non-empty string");
  }

  if (
    data.urgency &&
    !["low", "normal", "high", "urgent"].includes(data.urgency)
  ) {
    errors.push('urgency must be one of: "low", "normal", "high", "urgent"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateReviewLimitChangeRequest(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.status || !["approved", "rejected"].includes(data.status)) {
    errors.push('status is required and must be "approved" or "rejected"');
  }

  if (
    data.approvedCreditLimit !== undefined &&
    (typeof data.approvedCreditLimit !== "number" ||
      data.approvedCreditLimit <= 0)
  ) {
    errors.push("approvedCreditLimit must be a positive number");
  }

  if (
    data.approvedTimeLimit !== undefined &&
    (typeof data.approvedTimeLimit !== "number" || data.approvedTimeLimit <= 0)
  ) {
    errors.push("approvedTimeLimit must be a positive number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCreateClauseTemplate(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push("name is required and must be a non-empty string");
  }

  if (
    !data.content ||
    typeof data.content !== "string" ||
    data.content.trim() === ""
  ) {
    errors.push("content is required and must be a non-empty string");
  }

  if (
    !data.category ||
    typeof data.category !== "string" ||
    data.category.trim() === ""
  ) {
    errors.push("category is required and must be a non-empty string");
  }

  if (
    data.applicableAssetTypes !== undefined &&
    !Array.isArray(data.applicableAssetTypes)
  ) {
    errors.push("applicableAssetTypes must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCreateMasterContract(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.clientId || typeof data.clientId !== "string") {
    errors.push("clientId is required and must be a string");
  }

  if (!data.businessUnitId || typeof data.businessUnitId !== "string") {
    errors.push("businessUnitId is required and must be a string");
  }

  if (!data.startDate || typeof data.startDate !== "string") {
    errors.push("startDate is required and must be an ISO date string");
  }

  if (
    data.agreedCreditLimit !== undefined &&
    (typeof data.agreedCreditLimit !== "number" || data.agreedCreditLimit <= 0)
  ) {
    errors.push("agreedCreditLimit must be a positive number");
  }

  if (
    data.agreedTimeLimit !== undefined &&
    (typeof data.agreedTimeLimit !== "number" || data.agreedTimeLimit <= 0)
  ) {
    errors.push("agreedTimeLimit must be a positive number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

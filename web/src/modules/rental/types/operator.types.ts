/**
 * OPERATOR TYPES
 * Tipos TypeScript para el sistema de operadores (frontend)
 * Sincronizado con backend/src/modules/rental/types/operator.types.ts
 */

// Enums (matching Prisma schema)
export type OperatorType = "INTERNAL" | "EXTERNAL" | "SUBCONTRACTOR";
export type OperatorStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
export type DocumentType =
  | "DRIVERS_LICENSE"
  | "MACHINERY_LICENSE"
  | "CERTIFICATION"
  | "CONTRACT"
  | "INSURANCE"
  | "MEDICAL_CERTIFICATE"
  | "OTHER";
export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type RateType = "DAILY" | "HOURLY" | "FIXED";
export type ExpenseType =
  | "FUEL"
  | "MAINTENANCE"
  | "TOLL"
  | "FOOD"
  | "ACCOMMODATION"
  | "TRANSPORT"
  | "OTHER";
export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED";
export type PhotoType =
  | "ASSET_START"
  | "ASSET_END"
  | "HOUROMETER"
  | "DAMAGE"
  | "INCIDENT"
  | "OTHER";

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface OperatorProfile {
  id: string;
  tenantId: string;
  businessUnitId: string;
  userId: string;
  document: string;
  phone: string;
  address?: string;
  operatorType: OperatorType;
  hourlyRate?: number;
  dailyRate?: number;
  hireDate?: Date | string;
  endDate?: Date | string;
  notes?: string;
  status: OperatorStatus;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations (populated)
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  documents?: OperatorDocument[];
  assignments?: OperatorAssignment[];
}

export interface OperatorDocument {
  id: string;
  operatorProfileId: string;
  type: DocumentType;
  documentNumber?: string;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  fileUrl?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: Date | string;
  verificationStatus: DocumentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OperatorAssignment {
  id: string;
  operatorProfileId: string;
  rentalContractId: string;
  assetId?: string;
  startDate: Date | string;
  endDate?: Date | string;
  rateType: RateType;
  rateAmount: number;
  allowExpenses: boolean;
  dailyExpenseLimit?: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations (populated)
  operatorProfile?: OperatorProfile;
  rentalContract?: {
    id: string;
    code: string;
    clientId: string;
  };
  asset?: {
    id: string;
    code: string;
    name: string;
  };
  dailyReports?: OperatorDailyReport[];
  expenses?: OperatorExpense[];
}

export interface OperatorDailyReport {
  id: string;
  assignmentId: string;
  date: Date | string;
  startTime?: string;
  endTime?: string;
  hoursWorked?: number;
  startingMeterReading?: number;
  endingMeterReading?: number;
  startLocation?: string;
  endLocation?: string;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  workDescription?: string;
  notes?: string;
  assetConditionRating?: number;
  syncStatus: SyncStatus;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  assignment?: OperatorAssignment;
  photos?: OperatorPhoto[];
}

export interface OperatorPhoto {
  id: string;
  reportId: string;
  photoType: PhotoType;
  fileUrl: string;
  latitude?: number;
  longitude?: number;
  capturedAt: Date | string;
  notes?: string;
  createdAt: Date | string;

  // Relations
  report?: OperatorDailyReport;
}

export interface OperatorExpense {
  id: string;
  assignmentId: string;
  date: Date | string;
  expenseType: ExpenseType;
  amount: number;
  description: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: Date | string;
  rejectionReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  assignment?: OperatorAssignment;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateOperatorProfileDTO {
  userId: string;
  document: string;
  phone: string;
  address?: string;
  operatorType: OperatorType;
  hourlyRate?: number;
  dailyRate?: number;
  hireDate?: string;
  notes?: string;
}

export interface UpdateOperatorProfileDTO {
  document?: string;
  phone?: string;
  address?: string;
  operatorType?: OperatorType;
  hourlyRate?: number;
  dailyRate?: number;
  endDate?: string;
  notes?: string;
  status?: OperatorStatus;
}

export interface CreateOperatorDocumentDTO {
  type: DocumentType;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  notes?: string;
}

export interface UpdateOperatorDocumentDTO {
  verificationStatus: DocumentStatus;
  notes?: string;
}

export interface CreateOperatorAssignmentDTO {
  rentalContractId: string;
  assetId?: string;
  startDate: string;
  endDate?: string;
  rateType: RateType;
  rateAmount: number;
  allowExpenses: boolean;
  dailyExpenseLimit?: number;
  notes?: string;
}

export interface UpdateOperatorAssignmentDTO {
  endDate?: string;
  rateAmount?: number;
  allowExpenses?: boolean;
  dailyExpenseLimit?: number;
  notes?: string;
}

export interface CreateDailyReportDTO {
  assignmentId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hoursWorked?: number;
  startingMeterReading?: number;
  endingMeterReading?: number;
  startLocation?: string;
  endLocation?: string;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  workDescription?: string;
  notes?: string;
  assetConditionRating?: number;
}

export interface CreateOperatorExpenseDTO {
  assignmentId: string;
  date: string;
  expenseType: ExpenseType;
  amount: number;
  description: string;
  receiptUrl?: string;
}

export interface ApproveExpenseDTO {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

// ============================================================================
// FILTERS & PAGINATION
// ============================================================================

export interface OperatorProfileFilters {
  status?: OperatorStatus;
  operatorType?: OperatorType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OperatorAssignmentFilters {
  operatorProfileId?: string;
  rentalContractId?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface OperatorExpenseFilters {
  assignmentId?: string;
  status?: ExpenseStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface OperatorProfileWithRelations extends OperatorProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  documents: OperatorDocument[];
  assignments: OperatorAssignment[];
}

// ============================================================================
// UI HELPERS
// ============================================================================

export const OPERATOR_TYPE_LABELS: Record<OperatorType, string> = {
  INTERNAL: "Interno",
  EXTERNAL: "Externo",
  SUBCONTRACTOR: "Subcontratista",
};

export const OPERATOR_STATUS_LABELS: Record<OperatorStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "Con Licencia",
  TERMINATED: "Desvinculado",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DRIVERS_LICENSE: "Licencia de Conducir",
  MACHINERY_LICENSE: "Licencia de Maquinaria",
  CERTIFICATION: "Certificación",
  CONTRACT: "Contrato",
  INSURANCE: "Seguro",
  MEDICAL_CERTIFICATE: "Certificado Médico",
  OTHER: "Otro",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  EXPIRED: "Vencido",
};

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  DAILY: "Por Día",
  HOURLY: "Por Hora",
  FIXED: "Tarifa Fija",
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  FUEL: "Combustible",
  MAINTENANCE: "Mantenimiento",
  TOLL: "Peaje",
  FOOD: "Alimentación",
  ACCOMMODATION: "Alojamiento",
  TRANSPORT: "Transporte",
  OTHER: "Otro",
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

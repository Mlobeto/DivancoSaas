/**
 * Operator Profile Types and DTOs
 */

import { OperatorStatus, OperatorType } from "@prisma/client";

export interface CreateOperatorProfileDTO {
  userId: string;
  document: string;
  phone: string;
  employeeCode?: string;
  hireDate: Date;
  endDate?: Date;
  operatorType?: OperatorType;
  defaultRateType?: string;
  defaultRate?: number;
}

export interface UpdateOperatorProfileDTO {
  document?: string;
  phone?: string;
  employeeCode?: string;
  status?: OperatorStatus;
  hireDate?: Date;
  endDate?: Date;
  operatorType?: OperatorType;
  defaultRateType?: string;
  defaultRate?: number;
}

export interface OperatorProfileFilters {
  status?: OperatorStatus;
  operatorType?: OperatorType;
  search?: string; // Búsqueda por documento, nombre, email
}

export interface CreateOperatorDocumentDTO {
  type: string;
  name: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  fileUrl?: string;
  notes?: string;
}

export interface UpdateOperatorDocumentDTO {
  name?: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  status?: string;
  notes?: string;
}

export interface CreateOperatorAssignmentDTO {
  profileId: string;
  rentalContractId: string;
  assetId: string;
  startDate: Date;
  endDate?: Date;
  rateType?: string;
  rate?: number;
  allowExpenses?: boolean;
  dailyExpenseLimit?: number;
  createdBy: string;
}

export interface UpdateOperatorAssignmentDTO {
  endDate?: Date;
  status?: string;
  rateType?: string;
  rate?: number;
  allowExpenses?: boolean;
  dailyExpenseLimit?: number;
}

export interface CreateDailyReportDTO {
  profileId: string;
  assignmentId: string;
  assetId: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  workHours?: number;
  hourMeter?: number;
  odometer?: number;
  fuelLevel?: string;
  locationLat?: number;
  locationLon?: number;
  locationName?: string;
  assetCondition?: string;
  notes?: string;
  incidentReported?: boolean;
  maintenanceRequired?: boolean;
}

export interface CreateOperatorExpenseDTO {
  profileId: string;
  assignmentId: string;
  date: Date;
  type: string;
  description: string;
  amount: number;
  receiptUrl?: string;
}

export interface ApproveExpenseDTO {
  approvedBy: string;
  rejectionReason?: string;
}

export interface OperatorProfileWithUser {
  id: string;
  userId: string;
  document: string;
  phone: string;
  employeeCode?: string;
  status: OperatorStatus;
  hireDate: Date;
  endDate?: Date;
  operatorType: OperatorType;
  defaultRateType?: string;
  defaultRate?: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

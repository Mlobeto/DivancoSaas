/**
 * OPERATOR SERVICE
 * Servicio para gestión de operadores (frontend)
 */

import apiClient from "@/lib/api";
import type {
  OperatorProfile,
  OperatorProfileWithRelations,
  OperatorDocument,
  OperatorAssignment,
  OperatorDailyReport,
  OperatorExpense,
  CreateOperatorProfileDTO,
  UpdateOperatorProfileDTO,
  CreateOperatorDocumentDTO,
  UpdateOperatorDocumentDTO,
  CreateOperatorAssignmentDTO,
  UpdateOperatorAssignmentDTO,
  CreateDailyReportDTO,
  CreateOperatorExpenseDTO,
  ApproveExpenseDTO,
  OperatorProfileFilters,
  OperatorAssignmentFilters,
  OperatorExpenseFilters,
  PaginatedResponse,
} from "../types/operator.types";

const BASE_URL = "/rental/operators";

export const operatorService = {
  // =========================================================================
  // OPERATOR PROFILES (Admin)
  // =========================================================================

  /**
   * Listar operadores con paginación y filtros
   */
  async listProfiles(
    filters: OperatorProfileFilters = {},
  ): Promise<PaginatedResponse<OperatorProfile>> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.operatorType)
      params.append("operatorType", filters.operatorType);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener perfil de operador por ID con todas las relaciones
   */
  async getProfile(id: string): Promise<OperatorProfileWithRelations> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Crear perfil de operador
   */
  async createProfile(
    data: CreateOperatorProfileDTO,
  ): Promise<OperatorProfile> {
    const response = await apiClient.post(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Actualizar perfil de operador
   */
  async updateProfile(
    id: string,
    data: UpdateOperatorProfileDTO,
  ): Promise<OperatorProfile> {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Eliminar perfil de operador
   */
  async deleteProfile(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  // =========================================================================
  // OPERATOR DOCUMENTS (Admin)
  // =========================================================================

  /**
   * Agregar documento a operador
   */
  async addDocument(
    operatorId: string,
    data: CreateOperatorDocumentDTO,
  ): Promise<OperatorDocument> {
    const response = await apiClient.post(
      `${BASE_URL}/${operatorId}/documents`,
      data,
    );
    return response.data.data;
  },

  /**
   * Actualizar documento (para verificación)
   */
  async updateDocument(
    operatorId: string,
    documentId: string,
    data: UpdateOperatorDocumentDTO,
  ): Promise<OperatorDocument> {
    const response = await apiClient.patch(
      `${BASE_URL}/${operatorId}/documents/${documentId}`,
      data,
    );
    return response.data.data;
  },

  /**
   * Eliminar documento
   */
  async deleteDocument(operatorId: string, documentId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${operatorId}/documents/${documentId}`);
  },

  // =========================================================================
  // OPERATOR ASSIGNMENTS (Admin)
  // =========================================================================

  /**
   * Crear asignación de operador a contrato
   */
  async createAssignment(
    operatorId: string,
    data: CreateOperatorAssignmentDTO,
  ): Promise<OperatorAssignment> {
    const response = await apiClient.post(
      `${BASE_URL}/${operatorId}/assignments`,
      data,
    );
    return response.data.data;
  },

  /**
   * Actualizar asignación
   */
  async updateAssignment(
    operatorId: string,
    assignmentId: string,
    data: UpdateOperatorAssignmentDTO,
  ): Promise<OperatorAssignment> {
    const response = await apiClient.patch(
      `${BASE_URL}/${operatorId}/assignments/${assignmentId}`,
      data,
    );
    return response.data.data;
  },

  /**
   * Listar asignaciones
   */
  async listAssignments(
    filters: OperatorAssignmentFilters = {},
  ): Promise<OperatorAssignment[]> {
    const params = new URLSearchParams();
    if (filters.operatorProfileId)
      params.append("operatorProfileId", filters.operatorProfileId);
    if (filters.rentalContractId)
      params.append("rentalContractId", filters.rentalContractId);
    if (filters.activeOnly !== undefined)
      params.append("activeOnly", String(filters.activeOnly));

    const response = await apiClient.get(
      `${BASE_URL}/assignments?${params.toString()}`,
    );
    return response.data.data;
  },

  // =========================================================================
  // OPERATOR EXPENSES (Admin - Approval)
  // =========================================================================

  /**
   * Aprobar o rechazar gasto
   */
  async approveExpense(
    expenseId: string,
    data: ApproveExpenseDTO,
  ): Promise<OperatorExpense> {
    const response = await apiClient.post(
      `${BASE_URL}/expenses/${expenseId}/approve`,
      data,
    );
    return response.data.data;
  },

  /**
   * Listar gastos con filtros
   */
  async listExpenses(
    filters: OperatorExpenseFilters = {},
  ): Promise<PaginatedResponse<OperatorExpense>> {
    const params = new URLSearchParams();
    if (filters.assignmentId)
      params.append("assignmentId", filters.assignmentId);
    if (filters.status) params.append("status", filters.status);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(
      `${BASE_URL}/expenses?${params.toString()}`,
    );
    return response.data;
  },

  // =========================================================================
  // MY PROFILE (Mobile/Operator)
  // =========================================================================

  /**
   * Obtener perfil del operador actual (usuario logueado)
   */
  async getMyProfile(): Promise<OperatorProfileWithRelations> {
    const response = await apiClient.get(`${BASE_URL}/my/profile`);
    return response.data.data;
  },

  // =========================================================================
  // DAILY REPORTS (Mobile/Operator)
  // =========================================================================

  /**
   * Crear reporte diario (desde mobile)
   */
  async createDailyReport(
    data: CreateDailyReportDTO,
  ): Promise<OperatorDailyReport> {
    const response = await apiClient.post(`${BASE_URL}/my/daily-reports`, data);
    return response.data.data;
  },

  /**
   * Listar reportes diarios del operador
   */
  async listMyDailyReports(filters: {
    startDate?: string;
    endDate?: string;
  }): Promise<OperatorDailyReport[]> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await apiClient.get(
      `${BASE_URL}/my/daily-reports?${params.toString()}`,
    );
    return response.data.data;
  },

  // =========================================================================
  // EXPENSES (Mobile/Operator)
  // =========================================================================

  /**
   * Crear gasto (desde mobile)
   */
  async createExpense(
    data: CreateOperatorExpenseDTO,
  ): Promise<OperatorExpense> {
    const response = await apiClient.post(`${BASE_URL}/my/expenses`, data);
    return response.data.data;
  },

  /**
   * Listar gastos del operador
   */
  async listMyExpenses(): Promise<OperatorExpense[]> {
    const response = await apiClient.get(`${BASE_URL}/my/expenses`);
    return response.data.data;
  },
};

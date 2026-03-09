/**
 * LIMIT REQUEST SERVICE
 * Servicio para gestionar solicitudes de aumento de límite de crédito
 * Integrado con el sistema de chat interno
 */

import api from "@/lib/api";

// ─── TYPES ────────────────────────────────────────────────────

export interface LimitRequestMetadata {
  clientId: string;
  clientName?: string;
  currentBalanceLimit: number;
  currentTimeLimit: number;
  requestedBalanceLimit: number;
  requestedTimeLimit: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  approvedBalanceLimit?: number;
  approvedTimeLimit?: number;
  approvalNotes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledAt?: string;
}

export interface ChatRoomMember {
  id: string;
  userId: string;
  joinedAt: string;
  lastReadAt?: string;
  user: {
    id: string;
    email: string;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  fileUrl?: string;
  fileMime?: string;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
  };
}

export interface LimitRequest {
  id: string;
  tenantId: string;
  businessUnitId?: string;
  name: string;
  isGroup: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  requestType: "limit_increase";
  requestStatus: "pending" | "approved" | "rejected" | "cancelled";
  requestMetadata: LimitRequestMetadata;
  members: ChatRoomMember[];
  messages?: ChatMessage[];
}

export interface CreateLimitRequestDTO {
  clientId: string;
  currentBalanceLimit: number;
  currentTimeLimit: number;
  requestedBalanceLimit: number;
  requestedTimeLimit: number;
  reason: string;
}

export interface ApproveRequestDTO {
  approvedBalanceLimit: number;
  approvedTimeLimit: number;
  notes?: string;
}

export interface RejectRequestDTO {
  reason: string;
}

export interface MessagesResponse {
  items: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

// ─── SERVICE ──────────────────────────────────────────────────

class LimitRequestService {
  private baseUrl = "/api/v1/chat";

  /**
   * Crear solicitud de aumento de límite
   */
  async create(data: CreateLimitRequestDTO): Promise<LimitRequest> {
    const response = await api.post(
      `${this.baseUrl}/requests/limit-increase`,
      data,
    );
    return response.data.data;
  }

  /**
   * Listar solicitudes pendientes (para aprobadores)
   */
  async listPending(): Promise<LimitRequest[]> {
    const response = await api.get(`${this.baseUrl}/requests/pending`);
    return response.data.data;
  }

  /**
   * Obtener detalles de una solicitud
   */
  async getById(roomId: string): Promise<LimitRequest> {
    const response = await api.get(`${this.baseUrl}/rooms/${roomId}`);
    return response.data.data;
  }

  /**
   * Obtener mensajes de una solicitud
   */
  async getMessages(
    roomId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());

    const response = await api.get(
      `${this.baseUrl}/rooms/${roomId}/messages?${params.toString()}`,
    );
    return response.data.data;
  }

  /**
   * Enviar mensaje en una solicitud
   */
  async sendMessage(roomId: string, content: string): Promise<ChatMessage> {
    const response = await api.post(
      `${this.baseUrl}/rooms/${roomId}/messages`,
      {
        content,
        type: "text",
      },
    );
    return response.data.data;
  }

  /**
   * Aprobar solicitud
   */
  async approve(roomId: string, data: ApproveRequestDTO): Promise<void> {
    await api.post(`${this.baseUrl}/requests/${roomId}/approve`, data);
  }

  /**
   * Rechazar solicitud
   */
  async reject(roomId: string, data: RejectRequestDTO): Promise<void> {
    await api.post(`${this.baseUrl}/requests/${roomId}/reject`, data);
  }

  /**
   * Cancelar solicitud (solo el solicitante)
   */
  async cancel(roomId: string): Promise<void> {
    await api.post(`${this.baseUrl}/requests/${roomId}/cancel`, {});
  }
}

export const limitRequestService = new LimitRequestService();

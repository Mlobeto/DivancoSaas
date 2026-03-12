/**
 * CHAT SERVICE (General)
 * Servicio para el sistema de chat interno — DMs, grupos y solicitudes.
 */

import apiClient from "@/lib/api";

// ─── TYPES ────────────────────────────────────────────────────

export interface ChatRoomMember {
  id: string;
  userId: string;
  joinedAt: string;
  lastReadAt?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  fileUrl?: string;
  fileMime?: string;
  deletedAt?: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface ChatRoom {
  id: string;
  tenantId: string;
  name?: string;
  isGroup: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  requestType?: string;
  requestStatus?: string;
  members: ChatRoomMember[];
  messages?: ChatMessage[]; // last message for preview
}

export interface MessagesResponse {
  items: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
}

// ─── HELPERS ──────────────────────────────────────────────────

/** Get display name from a user object */
export function getUserDisplayName(user: {
  email: string;
  firstName?: string;
  lastName?: string;
}): string {
  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return user.email.split("@")[0];
}

/** Get initials from a user object */
export function getUserInitials(user: {
  email: string;
  firstName?: string;
  lastName?: string;
}): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  return user.email[0].toUpperCase();
}

/** Get name/initials for a room (DM uses other-person's name, group uses room name) */
export function getRoomDisplayName(
  room: ChatRoom,
  currentUserId: string,
): string {
  if (room.isGroup) {
    return room.name || "Grupo";
  }
  const other = room.members.find((m) => m.userId !== currentUserId);
  if (other?.user) return getUserDisplayName(other.user);
  return "Chat";
}

export function getRoomInitials(room: ChatRoom, currentUserId: string): string {
  if (room.isGroup) {
    return (room.name || "G")[0].toUpperCase();
  }
  const other = room.members.find((m) => m.userId !== currentUserId);
  if (other?.user) return getUserInitials(other.user);
  return "C";
}

// ─── SERVICE ──────────────────────────────────────────────────

const BASE = "/api/v1/chat";

class ChatService {
  /** Listar todas las salas del usuario actual */
  async listRooms(): Promise<ChatRoom[]> {
    const res = await apiClient.get(`${BASE}/rooms`);
    return res.data.data;
  }

  /** Obtener o crear una DM con otro usuario */
  async getOrCreateDM(targetUserId: string): Promise<ChatRoom> {
    const res = await apiClient.post(`${BASE}/rooms/dm`, { targetUserId });
    return res.data.data;
  }

  /** Crear grupo */
  async createGroup(name: string, memberIds: string[]): Promise<ChatRoom> {
    const res = await apiClient.post(`${BASE}/rooms`, { name, memberIds });
    return res.data.data;
  }

  /** Mensajes paginados de una sala */
  async getMessages(
    roomId: string,
    page = 1,
    limit = 50,
  ): Promise<MessagesResponse> {
    const res = await apiClient.get(`${BASE}/rooms/${roomId}/messages`, {
      params: { page, limit },
    });
    return res.data.data;
  }

  /** Enviar mensaje de texto */
  async sendMessage(roomId: string, content: string): Promise<ChatMessage> {
    const res = await apiClient.post(`${BASE}/rooms/${roomId}/messages`, {
      content,
    });
    return res.data.data;
  }

  /** Subir archivo / imagen */
  async uploadFile(roomId: string, file: File): Promise<ChatMessage> {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post(`${BASE}/rooms/${roomId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  }

  /** Eliminar mensaje propio (soft delete) */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`${BASE}/messages/${messageId}`);
  }

  /** Listar usuarios del tenant para iniciar DMs */
  async listUsers(): Promise<ChatUser[]> {
    const res = await apiClient.get("/api/v1/users");
    // response may be paginated or flat array
    const raw = res.data.data ?? res.data;
    return Array.isArray(raw) ? raw : (raw.data ?? []);
  }
}

export const chatService = new ChatService();

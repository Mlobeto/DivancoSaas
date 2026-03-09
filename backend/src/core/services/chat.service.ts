/**
 * CHAT SERVICE
 * Gestión de salas y mensajes de chat interno entre el staff.
 */

import prisma from "@config/database";
import type { Server as SocketServer, Socket } from "socket.io";

class ChatService {
  private io: SocketServer | null = null;

  setSocketServer(io: SocketServer) {
    this.io = io;
  }

  // ─── ROOMS ────────────────────────────────────────────────────

  /** Crear sala grupal */
  async createRoom(params: {
    tenantId: string;
    businessUnitId?: string;
    name: string;
    createdBy: string;
    memberIds: string[];
  }) {
    const room = await prisma.chatRoom.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        name: params.name,
        isGroup: true,
        createdBy: params.createdBy,
        members: {
          create: params.memberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, email: true } } } },
      },
    });
    return room;
  }

  /** Obtener o crear DM entre dos usuarios */
  async getOrCreateDM(tenantId: string, userAId: string, userBId: string) {
    // Buscar sala DM existente entre ambos usuarios
    const existing = await prisma.chatRoom.findFirst({
      where: {
        tenantId,
        isGroup: false,
        members: { every: { userId: { in: [userAId, userBId] } } },
      },
      include: { members: true },
    });

    if (existing && existing.members.length === 2) return existing;

    return prisma.chatRoom.create({
      data: {
        tenantId,
        isGroup: false,
        createdBy: userAId,
        members: {
          create: [{ userId: userAId }, { userId: userBId }],
        },
      },
      include: { members: true },
    });
  }

  /** Listar salas de un usuario */
  async listRooms(userId: string, tenantId: string) {
    return prisma.chatRoom.findMany({
      where: {
        tenantId,
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          where: { deletedAt: null },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  // ─── MESSAGES ─────────────────────────────────────────────────

  /** Enviar mensaje (persiste + emite por socket) */
  async sendMessage(params: {
    roomId: string;
    senderId: string;
    body: string;
    fileUrl?: string;
    fileMime?: string;
  }) {
    // Verificar que el sender es miembro de la sala
    const member = await prisma.chatRoomMember.findUnique({
      where: {
        roomId_userId: { roomId: params.roomId, userId: params.senderId },
      },
    });
    if (!member) throw new Error("No eres miembro de esta sala");

    const message = await prisma.chatMessage.create({
      data: {
        roomId: params.roomId,
        senderId: params.senderId,
        body: params.body,
        fileUrl: params.fileUrl,
        fileMime: params.fileMime,
      },
      include: {
        sender: { select: { id: true, email: true } },
      },
    });

    // Actualizar timestamp de la sala
    await prisma.chatRoom.update({
      where: { id: params.roomId },
      data: { updatedAt: new Date() },
    });

    // Emitir a todos los miembros de la sala
    if (this.io) {
      this.io.to(`room:${params.roomId}`).emit("chat:message", message);
    }

    return message;
  }

  /** Historial paginado */
  async getMessages(
    roomId: string,
    userId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 50 } = options;

    // Verificar membresía
    const member = await prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new Error("No eres miembro de esta sala");

    const [items, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { sender: { select: { id: true, email: true } } },
      }),
      prisma.chatMessage.count({ where: { roomId, deletedAt: null } }),
    ]);

    // Actualizar lastReadAt
    await prisma.chatRoomMember.update({
      where: { roomId_userId: { roomId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { items: items.reverse(), total, page, limit };
  }

  /** Borrado suave de mensaje */
  async deleteMessage(messageId: string, userId: string) {
    const msg = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) throw new Error("Mensaje no encontrado");
    if (msg.senderId !== userId)
      throw new Error("Solo podés borrar tus propios mensajes");

    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── SOCKET SETUP ─────────────────────────────────────────────

  /**
   * Registra los handlers de Socket.io para el chat.
   * Llamar desde el bootstrap de Socket.io.
   */
  registerSocketHandlers(socket: Socket, userId: string) {
    // Unirse a sala
    socket.on("chat:join", async (roomId: string) => {
      const member = await prisma.chatRoomMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      if (member) socket.join(`room:${roomId}`);
    });

    // Enviar mensaje
    socket.on(
      "chat:send",
      async (payload: { roomId: string; body: string; fileUrl?: string }) => {
        try {
          await this.sendMessage({
            roomId: payload.roomId,
            senderId: userId,
            body: payload.body,
            fileUrl: payload.fileUrl,
          });
        } catch (err: any) {
          socket.emit("chat:error", { message: err.message });
        }
      },
    );

    // Typing indicator
    socket.on("chat:typing", (roomId: string) => {
      socket.to(`room:${roomId}`).emit("chat:typing", { userId, roomId });
    });
  }

  // ─── LIMIT INCREASE REQUESTS ──────────────────────────────────

  /**
   * Crear solicitud de aumento de límite (crea sala de chat especial)
   */
  async createLimitIncreaseRequest(params: {
    tenantId: string;
    clientId: string;
    requestedBy: string; // userId del delivery user
    currentBalanceLimit: number;
    currentTimeLimit: number;
    requestedBalanceLimit: number;
    requestedTimeLimit: number;
    reason: string;
  }) {
    // Obtener cliente para nombre
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: { businessName: true },
    });

    // Obtener usuarios con rol admin u owner del tenant
    const approvers = await prisma.user.findMany({
      where: {
        tenantId: params.tenantId,
        role: { in: ["admin", "owner"] },
      },
      select: { id: true, email: true },
    });

    if (approvers.length === 0) {
      throw new Error("No hay usuarios aprobadores disponibles");
    }

    const approverIds = approvers.map((u) => u.id);
    const allMemberIds = Array.from(
      new Set([params.requestedBy, ...approverIds]),
    );

    // Crear sala de chat especial
    const room = await prisma.chatRoom.create({
      data: {
        tenantId: params.tenantId,
        name: `Solicitud: Aumento de límite - ${client?.businessName || params.clientId}`,
        isGroup: true,
        createdBy: params.requestedBy,
        requestType: "limit_increase",
        requestStatus: "pending",
        requestMetadata: {
          clientId: params.clientId,
          clientName: client?.businessName,
          currentBalanceLimit: params.currentBalanceLimit,
          currentTimeLimit: params.currentTimeLimit,
          requestedBalanceLimit: params.requestedBalanceLimit,
          requestedTimeLimit: params.requestedTimeLimit,
          reason: params.reason,
          requestedBy: params.requestedBy,
          requestedAt: new Date().toISOString(),
        },
        members: {
          create: allMemberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, email: true } } } },
      },
    });

    // Crear mensaje inicial automático
    await this.sendMessage({
      roomId: room.id,
      senderId: params.requestedBy,
      body: `📋 **Solicitud de Aumento de Límite**\n\n**Cliente:** ${client?.businessName || params.clientId}\n\n**Límites Actuales:**\n• Saldo: ${params.currentBalanceLimit}\n• Días Activos: ${params.currentTimeLimit}\n\n**Límites Solicitados:**\n• Saldo: ${params.requestedBalanceLimit}\n• Días Activos: ${params.requestedTimeLimit}\n\n**Justificación:**\n${params.reason}`,
    });

    // Emitir notificación a aprobadores
    if (this.io) {
      approverIds.forEach((approverId) => {
        this.io!.to(`user:${approverId}`).emit("request:new", {
          type: "limit_increase",
          roomId: room.id,
          clientName: client?.businessName,
        });
      });
    }

    return room;
  }

  /**
   * Listar solicitudes pendientes (para aprobadores)
   */
  async listPendingRequests(tenantId: string, userId: string) {
    return prisma.chatRoom.findMany({
      where: {
        tenantId,
        requestType: "limit_increase",
        requestStatus: "pending",
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Aprobar solicitud de aumento de límite
   */
  async approveRequest(params: {
    roomId: string;
    approvedBy: string;
    approvedBalanceLimit: number;
    approvedTimeLimit: number;
    notes?: string;
  }) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: params.roomId },
    });

    if (!room || room.requestType !== "limit_increase") {
      throw new Error("Solicitud no encontrada");
    }

    if (room.requestStatus !== "pending") {
      throw new Error("Esta solicitud ya fue procesada");
    }

    const metadata = room.requestMetadata as any;
    const clientId = metadata.clientId;

    // Actualizar límites en RentalAccount
    await prisma.rentalAccount.update({
      where: { clientId },
      data: {
        balanceLimit: params.approvedBalanceLimit,
        timeLimit: params.approvedTimeLimit,
      },
    });

    // Actualizar estado de la solicitud
    await prisma.chatRoom.update({
      where: { id: params.roomId },
      data: {
        requestStatus: "approved",
        requestMetadata: {
          ...metadata,
          approvedBy: params.approvedBy,
          approvedAt: new Date().toISOString(),
          approvedBalanceLimit: params.approvedBalanceLimit,
          approvedTimeLimit: params.approvedTimeLimit,
          approvalNotes: params.notes,
        },
      },
    });

    // Enviar mensaje de aprobación
    await this.sendMessage({
      roomId: params.roomId,
      senderId: params.approvedBy,
      body: `✅ **Solicitud Aprobada**\n\n**Nuevos Límites:**\n• Saldo: ${params.approvedBalanceLimit}\n• Días Activos: ${params.approvedTimeLimit}\n\n${params.notes ? `**Notas:** ${params.notes}` : ""}`,
    });

    // Notificar al solicitante
    if (this.io) {
      this.io.to(`user:${metadata.requestedBy}`).emit("request:approved", {
        roomId: params.roomId,
        clientId,
      });
    }

    return { success: true };
  }

  /**
   * Rechazar solicitud de aumento de límite
   */
  async rejectRequest(params: {
    roomId: string;
    rejectedBy: string;
    reason: string;
  }) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: params.roomId },
    });

    if (!room || room.requestType !== "limit_increase") {
      throw new Error("Solicitud no encontrada");
    }

    if (room.requestStatus !== "pending") {
      throw new Error("Esta solicitud ya fue procesada");
    }

    const metadata = room.requestMetadata as any;

    // Actualizar estado de la solicitud
    await prisma.chatRoom.update({
      where: { id: params.roomId },
      data: {
        requestStatus: "rejected",
        requestMetadata: {
          ...metadata,
          rejectedBy: params.rejectedBy,
          rejectedAt: new Date().toISOString(),
          rejectionReason: params.reason,
        },
      },
    });

    // Enviar mensaje de rechazo
    await this.sendMessage({
      roomId: params.roomId,
      senderId: params.rejectedBy,
      body: `❌ **Solicitud Rechazada**\n\n**Motivo:**\n${params.reason}`,
    });

    // Notificar al solicitante
    if (this.io) {
      this.io.to(`user:${metadata.requestedBy}`).emit("request:rejected", {
        roomId: params.roomId,
      });
    }

    return { success: true };
  }

  /**
   * Cancelar solicitud (solo el solicitante)
   */
  async cancelRequest(roomId: string, userId: string) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.requestType !== "limit_increase") {
      throw new Error("Solicitud no encontrada");
    }

    if (room.requestStatus !== "pending") {
      throw new Error("Esta solicitud ya fue procesada");
    }

    const metadata = room.requestMetadata as any;

    if (metadata.requestedBy !== userId) {
      throw new Error("Solo el solicitante puede cancelar esta solicitud");
    }

    // Actualizar estado
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        requestStatus: "cancelled",
        requestMetadata: {
          ...metadata,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    // Enviar mensaje de cancelación
    await this.sendMessage({
      roomId: roomId,
      senderId: userId,
      body: `🚫 **Solicitud Cancelada**\n\nEl solicitante ha cancelado esta solicitud.`,
    });

    return { success: true };
  }
}

export const chatService = new ChatService();

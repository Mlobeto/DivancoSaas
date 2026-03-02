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
}

export const chatService = new ChatService();

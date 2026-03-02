/**
 * NOTIFICATION SERVICE
 * Persiste notificaciones en DB, las emite por Socket.io en tiempo real
 * y envía Expo Push Notifications al mobile.
 */

import prisma from "@config/database";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import type { Server as SocketServer } from "socket.io";

export interface CreateNotificationParams {
  tenantId: string;
  businessUnitId?: string;
  /** Si se omite, se notifica a todos los admins/owners de la BU */
  userId?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private io: SocketServer | null = null;
  private expo = new Expo();

  /** Llamar desde app.ts al inicializar Socket.io */
  setSocketServer(io: SocketServer) {
    this.io = io;
  }

  /**
   * Crea una (o varias) notificaciones y las emite en tiempo real.
   * Si no se especifica userId, detecta todos los admins de la BU.
   */
  async create(params: CreateNotificationParams): Promise<void> {
    const { tenantId, businessUnitId, type, title, body, data } = params;

    // Determinar destinatarios
    let userIds: string[] = [];
    if (params.userId) {
      userIds = [params.userId];
    } else if (businessUnitId) {
      // Todos los OWNER y SUPER_ADMIN con acceso a la BU
      const members = await prisma.userBusinessUnit.findMany({
        where: { businessUnitId },
        include: { user: true },
      });
      userIds = members.map((m) => m.userId);

      // También los OWNER globales del tenant
      const owners = await prisma.user.findMany({
        where: { tenantId, role: { in: ["OWNER", "SUPER_ADMIN"] } },
        select: { id: true },
      });
      const ownerIds = owners.map((o) => o.id);
      userIds = [...new Set([...userIds, ...ownerIds])];
    }

    if (userIds.length === 0) return;

    // Persistir en DB (una por usuario)
    const notifications = await prisma.$transaction(
      userIds.map((userId) =>
        prisma.notification.create({
          data: { tenantId, businessUnitId, userId, type, title, body, data },
        }),
      ),
    );

    // Emitir via Socket.io a cada usuario conectado
    if (this.io) {
      for (const notif of notifications) {
        this.io.to(`user:${notif.userId}`).emit("notification:new", notif);
      }
    }

    // Enviar Expo Push a los dispositivos móviles registrados
    await this.sendPushToUsers(userIds, { title, body, data });
  }

  /** Marcar notificación como leída */
  async markRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** Marcar todas las notificaciones del usuario como leídas */
  async markAllRead(userId: string, businessUnitId?: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        ...(businessUnitId ? { businessUnitId } : {}),
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** Obtener notificaciones paginadas de un usuario, filtradas por BU activa */
  async list(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      businessUnitId?: string;
    } = {},
  ) {
    const {
      page = 1,
      limit = 30,
      unreadOnly = false,
      businessUnitId,
    } = options;
    const skip = (page - 1) * limit;

    // Siempre scope a la BU activa cuando se provee
    const buFilter = businessUnitId ? { businessUnitId } : {};

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...buFilter,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId, ...buFilter } }),
      prisma.notification.count({
        where: { userId, ...buFilter, isRead: false },
      }),
    ]);

    return { items, total, unreadCount, page, limit };
  }

  /** Registrar/actualizar push token de un dispositivo */
  async registerPushToken(
    userId: string,
    token: string,
    platform: "ios" | "android" | "web",
  ): Promise<void> {
    await prisma.userPushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  /** Eliminar push token (logout) */
  async removePushToken(token: string): Promise<void> {
    await prisma.userPushToken.deleteMany({ where: { token } });
  }

  /** Enviar Expo push a una lista de userIds */
  private async sendPushToUsers(
    userIds: string[],
    payload: { title: string; body: string; data?: Record<string, any> },
  ): Promise<void> {
    try {
      const tokens = await prisma.userPushToken.findMany({
        where: { userId: { in: userIds } },
      });

      const messages: ExpoPushMessage[] = tokens
        .filter((t) => Expo.isExpoPushToken(t.token))
        .map((t) => ({
          to: t.token,
          sound: "default" as const,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
        }));

      if (messages.length === 0) return;

      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await this.expo.sendPushNotificationsAsync(chunk);
      }
    } catch (err) {
      console.error("[NotificationService] Push error:", err);
    }
  }
}

export const notificationService = new NotificationService();

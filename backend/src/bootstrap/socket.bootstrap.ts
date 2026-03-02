/**
 * SOCKET.IO BOOTSTRAP
 * Inicializa el servidor WebSocket y conecta los servicios de notificaciones y chat.
 */

import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { config } from "@config/index";
import { notificationService } from "@core/services/notification.service";
import { chatService } from "@core/services/chat.service";
import prisma from "@config/database";
import jwt from "jsonwebtoken";

export function initializeSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
  });

  // Middleware de autenticación JWT para WebSocket
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, tenantId: true, role: true },
      });
      if (!user) return next(new Error("User not found"));

      (socket as any).userId = user.id;
      (socket as any).tenantId = user.tenantId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // Conectar servicios al servidor socket
  notificationService.setSocketServer(io);
  chatService.setSocketServer(io);

  io.on("connection", (socket) => {
    const userId = (socket as any).userId as string;
    const tenantId = (socket as any).tenantId as string;

    // Unir al usuario a su sala personal para notificaciones
    socket.join(`user:${userId}`);
    socket.join(`tenant:${tenantId}`);

    console.log(`[Socket] User ${userId} connected (${socket.id})`);

    // Registrar handlers de chat
    chatService.registerSocketHandlers(socket, userId);

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  return io;
}

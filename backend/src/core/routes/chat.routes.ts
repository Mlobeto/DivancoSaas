/**
 * CHAT ROUTES
 * GET  /api/v1/chat/rooms               → lista de salas del usuario
 * POST /api/v1/chat/rooms               → crear sala grupal
 * POST /api/v1/chat/rooms/dm            → obtener o crear DM con otro usuario
 * GET  /api/v1/chat/rooms/:id/messages  → mensajes paginados
 * POST /api/v1/chat/rooms/:id/messages  → enviar mensaje (fallback HTTP)
 * DELETE /api/v1/chat/messages/:id      → eliminar mensaje (soft delete)
 */

import { Router, Request, Response } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { chatService } from "@core/services/chat.service";

const router = Router();
router.use(authenticate);

// Listar salas del usuario actual
router.get("/rooms", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const tenantId = (req as any).user.tenantId;
  const rooms = await chatService.listRooms(userId, tenantId);
  res.json({ success: true, data: rooms });
});

// Crear sala grupal
router.post("/rooms", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const tenantId = (req as any).user.tenantId;
  const { name, memberIds } = req.body;
  if (!name || !Array.isArray(memberIds)) {
    res
      .status(400)
      .json({ success: false, error: "name y memberIds son requeridos" });
    return;
  }
  const allMembers = Array.from(new Set([userId, ...memberIds]));
  const room = await chatService.createRoom(tenantId, name, allMembers);
  res.status(201).json({ success: true, data: room });
});

// Obtener o crear DM con otro usuario
router.post("/rooms/dm", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const tenantId = (req as any).user.tenantId;
  const { targetUserId } = req.body;
  if (!targetUserId) {
    res
      .status(400)
      .json({ success: false, error: "targetUserId es requerido" });
    return;
  }
  const room = await chatService.getOrCreateDM(tenantId, userId, targetUserId);
  res.json({ success: true, data: room });
});

// Mensajes de una sala
router.get("/rooms/:id/messages", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const limit = Number(req.query.limit) || 50;
  const messages = await chatService.getMessages(id, userId, { cursor, limit });
  res.json({ success: true, data: messages });
});

// Enviar mensaje vía HTTP (fallback si socket no está disponible)
router.post("/rooms/:id/messages", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;
  const { content, type } = req.body;
  if (!content) {
    res.status(400).json({ success: false, error: "content es requerido" });
    return;
  }
  const message = await chatService.sendMessage(
    id,
    userId,
    content,
    type || "text",
  );
  res.status(201).json({ success: true, data: message });
});

// Eliminar mensaje
router.delete("/messages/:id", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  await chatService.deleteMessage(req.params.id, userId);
  res.json({ success: true });
});

export default router;

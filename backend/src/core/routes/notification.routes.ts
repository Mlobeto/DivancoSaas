/**
 * NOTIFICATION ROUTES
 * GET  /api/v1/notifications           → lista paginada
 * PATCH /api/v1/notifications/:id/read → marcar leída
 * PATCH /api/v1/notifications/read-all → marcar todas leídas
 * POST  /api/v1/notifications/push-token → registrar device token
 * DELETE /api/v1/notifications/push-token → eliminar device token (logout)
 */

import { Router, Request, Response } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { notificationService } from "@core/services/notification.service";

const router = Router();
router.use(authenticate);

// Listar notificaciones del usuario — filtradas por BU activa
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const businessUnitId = req.context?.businessUnitId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const unreadOnly = req.query.unreadOnly === "true";

  const result = await notificationService.list(userId, {
    page,
    limit,
    unreadOnly,
    businessUnitId,
  });
  res.json({ success: true, data: result });
});

// Marcar una notificación como leída
router.patch("/:id/read", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  await notificationService.markRead(req.params.id, userId);
  res.json({ success: true });
});

// Marcar todas como leídas
router.patch("/read-all", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const businessUnitId = req.context?.businessUnitId;
  await notificationService.markAllRead(userId, businessUnitId);
  res.json({ success: true });
});

// Registrar push token (mobile)
router.post("/push-token", async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { token, platform } = req.body;
  if (!token || !platform) {
    res
      .status(400)
      .json({ success: false, error: "token y platform son requeridos" });
    return;
  }
  await notificationService.registerPushToken(userId, token, platform);
  res.json({ success: true });
});

// Eliminar push token (logout del dispositivo)
router.delete("/push-token", async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ success: false, error: "token es requerido" });
    return;
  }
  await notificationService.removePushToken(token);
  res.json({ success: true });
});

export default router;

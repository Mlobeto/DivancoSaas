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
import prisma from "@config/database";
import { z } from "zod";

const router = Router();
router.use(authenticate);

type NotificationUseCase =
  | "GENERAL_ANNOUNCEMENT"
  | "SITE_UPDATE"
  | "QUOTATION_CREATED"
  | "CLIENT_PICKUP_APPROVED"
  | "CLIENT_PICKUP_ARRIVED";

type DeliveryMode = "notification" | "chat";

const USE_CASE_ALLOWED_PERMISSIONS: Record<
  Exclude<NotificationUseCase, "GENERAL_ANNOUNCEMENT">,
  string[]
> = {
  SITE_UPDATE: [
    "operators:read",
    "operators:update",
    "assets:read",
    "assets:update",
    "inventory:read",
    "inventory:update",
  ],
  QUOTATION_CREATED: ["quotations:create", "rental:quotation:create"],
  CLIENT_PICKUP_APPROVED: [
    "quotations:approve",
    "contracts:update",
    "rental:quotation:update",
  ],
  CLIENT_PICKUP_ARRIVED: ["operators:read", "operators:update", "assets:read"],
};

const USE_CASE_ALLOWED_TARGET_GROUPS: Record<
  NotificationUseCase,
  string[] | "ALL"
> = {
  GENERAL_ANNOUNCEMENT: "ALL",
  SITE_UPDATE: ["OWNER", "ADMIN", "COMMERCIAL", "ACCOUNTING"],
  QUOTATION_CREATED: ["OWNER", "COMMERCIAL", "ACCOUNTING", "MAINTENANCE"],
  CLIENT_PICKUP_APPROVED: ["OWNER", "COMMERCIAL", "MAINTENANCE"],
  CLIENT_PICKUP_ARRIVED: ["OWNER", "COMMERCIAL"],
};

const ROLE_GROUP_ALIASES: Record<string, string[]> = {
  OWNER: ["OWNER", "PROPIETARIO", "DUEÑO"],
  ADMIN: ["ADMIN", "ADMINISTRADOR", "MANAGER", "GERENTE"],
  COMMERCIAL: ["COMMERCIAL", "COMERCIAL", "VENTAS", "VENDEDOR", "SALES"],
  ACCOUNTING: ["ACCOUNTING", "CONTABILIDAD", "FINANCE", "FINANZAS"],
  MAINTENANCE: [
    "MAINTENANCE",
    "MANTENIMIENTO",
    "OPERARIO",
    "OPERATOR",
    "TECHNICIAN",
    "TECNICO",
    "TÉCNICO",
  ],
};

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function isOwnerActor(req: Request): boolean {
  const buRole = normalizeText(req.context?.role || "");
  const globalRole = normalizeText((req as any).user?.role || "");
  return buRole === "OWNER" || globalRole === "SUPER_ADMIN";
}

function hasAnyPermission(
  permissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.some((permission) =>
    permissions.includes(permission),
  );
}

function roleMatchesTargetGroup(
  roleName: string,
  allowedGroups: string[] | "ALL",
): boolean {
  if (allowedGroups === "ALL") return true;

  const normalizedRole = normalizeText(roleName);

  return allowedGroups.some((group) => {
    const aliases = ROLE_GROUP_ALIASES[group] || [group];
    return aliases.some((alias) =>
      normalizedRole.includes(normalizeText(alias)),
    );
  });
}

const manualNotificationSchema = z
  .object({
    title: z.string().min(3).max(120),
    body: z.string().min(3).max(1000),
    recipientMode: z.enum(["all", "specific"]),
    recipientIds: z.array(z.string().uuid()).optional().default([]),
    type: z.string().min(2).max(50).optional().default("manual_message"),
    useCase: z
      .enum([
        "GENERAL_ANNOUNCEMENT",
        "SITE_UPDATE",
        "QUOTATION_CREATED",
        "CLIENT_PICKUP_APPROVED",
        "CLIENT_PICKUP_ARRIVED",
      ])
      .default("GENERAL_ANNOUNCEMENT"),
    deliveryMode: z.enum(["notification", "chat"]).default("notification"),
  })
  .refine(
    (data) =>
      data.recipientMode === "all" || (data.recipientIds?.length || 0) > 0,
    {
      message: "recipientIds es requerido cuando recipientMode es specific",
      path: ["recipientIds"],
    },
  );

router.get("/recipients", async (req: Request, res: Response) => {
  const tenantId = req.context?.tenantId;
  const businessUnitId = req.context?.businessUnitId;
  const requesterId = (req as any).user.userId;

  if (!tenantId || !businessUnitId) {
    res.status(400).json({
      success: false,
      error: "tenantId y businessUnitId son requeridos",
    });
    return;
  }

  const members = await prisma.userBusinessUnit.findMany({
    where: {
      businessUnitId,
      user: {
        tenantId,
        status: "ACTIVE",
      },
    },
    include: {
      role: {
        select: { name: true },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [{ role: { name: "asc" } }, { user: { firstName: "asc" } }],
  });

  const recipients = members
    .filter((member) => member.userId !== requesterId)
    .map((member) => ({
      id: member.user.id,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      email: member.user.email,
      roleName: member.role.name,
    }));

  res.json({ success: true, data: recipients });
});

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

router.post("/manual", async (req: Request, res: Response) => {
  const tenantId = req.context?.tenantId;
  const businessUnitId = req.context?.businessUnitId;
  const requesterId = (req as any).user.userId;

  if (!tenantId || !businessUnitId) {
    res.status(400).json({
      success: false,
      error: "tenantId y businessUnitId son requeridos",
    });
    return;
  }

  const payload = manualNotificationSchema.parse(req.body);
  const actorPermissions = req.context?.permissions || [];
  const ownerActor = isOwnerActor(req);

  if (payload.deliveryMode === "chat") {
    res.status(501).json({
      success: false,
      error:
        "El flujo de chat aún no está habilitado en este módulo. Usa notificación por función para la demo.",
    });
    return;
  }

  if (payload.useCase === "GENERAL_ANNOUNCEMENT" && !ownerActor) {
    if (!actorPermissions.includes("notifications:broadcast")) {
      res.status(403).json({
        success: false,
        error:
          "Solo OWNER (o usuarios con notifications:broadcast) pueden enviar mensajes generales",
      });
      return;
    }
  }

  if (payload.useCase !== "GENERAL_ANNOUNCEMENT" && !ownerActor) {
    const requiredPermissions = USE_CASE_ALLOWED_PERMISSIONS[payload.useCase];
    if (!hasAnyPermission(actorPermissions, requiredPermissions)) {
      res.status(403).json({
        success: false,
        error:
          "No tienes permisos funcionales para enviar este tipo de notificación",
      });
      return;
    }
  }

  const members = await prisma.userBusinessUnit.findMany({
    where: {
      businessUnitId,
      user: {
        tenantId,
        status: "ACTIVE",
      },
    },
    include: {
      role: {
        select: { name: true },
      },
    },
  });

  const useCaseTargets = USE_CASE_ALLOWED_TARGET_GROUPS[payload.useCase];

  const allowedMemberIds = members
    .filter((member) => member.userId !== requesterId)
    .filter((member) =>
      roleMatchesTargetGroup(member.role.name, useCaseTargets),
    )
    .map((member) => member.userId);

  let recipientIds: string[] = [];

  if (payload.recipientMode === "all") {
    if (payload.useCase === "GENERAL_ANNOUNCEMENT" && ownerActor) {
      recipientIds = members
        .map((member) => member.userId)
        .filter((userId) => userId !== requesterId);
    } else {
      recipientIds = allowedMemberIds;
    }
  } else {
    const requestedIds = payload.recipientIds.filter(
      (userId) => userId !== requesterId,
    );
    if (payload.useCase === "GENERAL_ANNOUNCEMENT" && ownerActor) {
      const validRecipients = await prisma.userBusinessUnit.findMany({
        where: {
          businessUnitId,
          userId: { in: requestedIds },
          user: {
            tenantId,
            status: "ACTIVE",
          },
        },
        select: { userId: true },
      });
      recipientIds = validRecipients.map((member) => member.userId);
    } else {
      recipientIds = requestedIds.filter((userId) =>
        allowedMemberIds.includes(userId),
      );
    }
  }

  if (recipientIds.length === 0) {
    res.status(400).json({
      success: false,
      error: "No se encontraron destinatarios válidos para esta notificación",
    });
    return;
  }

  await notificationService.create({
    tenantId,
    businessUnitId,
    userIds: recipientIds,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: {
      source: "manual",
      senderUserId: requesterId,
      recipientMode: payload.recipientMode,
      useCase: payload.useCase,
      deliveryMode: payload.deliveryMode,
    },
  });

  res.json({
    success: true,
    data: {
      sent: recipientIds.length,
    },
  });
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

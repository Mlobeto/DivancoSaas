import { Router, Request, Response } from "express";
import { userChannelIdentityService } from "../services/user-channel-identity.service";
import { authenticate } from "../middlewares/auth.middleware";
import { ChannelType } from "@prisma/client";

const router = Router();

/**
 * @swagger
 * /api/v1/user-identities/link:
 *   post:
 *     summary: Vincular usuario con identidad en canal externo
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessUnitId
 *               - channel
 *               - externalId
 *             properties:
 *               userId:
 *                 type: string
 *               businessUnitId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [WHATSAPP, WEB, MOBILE, API]
 *               externalId:
 *                 type: string
 *                 description: ID del usuario en el canal externo (ej. número de teléfono)
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Identidad vinculada exitosamente
 */
router.post("/link", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, businessUnitId, channel, externalId, metadata } = req.body;

    if (!userId || !businessUnitId || !channel || !externalId) {
      return res.status(400).json({
        error: "userId, businessUnitId, channel y externalId son requeridos",
      });
    }

    if (!Object.values(ChannelType).includes(channel)) {
      return res.status(400).json({
        error: `Canal inválido. Debe ser uno de: ${Object.values(ChannelType).join(", ")}`,
      });
    }

    const identity = await userChannelIdentityService.linkUser(
      userId,
      businessUnitId,
      channel as ChannelType,
      externalId,
      metadata,
    );

    res.json(identity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/user-identities/unlink:
 *   delete:
 *     summary: Desvincular usuario de un canal
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessUnitId
 *               - channel
 *             properties:
 *               userId:
 *                 type: string
 *               businessUnitId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [WHATSAPP, WEB, MOBILE, API]
 *     responses:
 *       200:
 *         description: Identidad desvinculada
 */
router.delete("/unlink", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, businessUnitId, channel } = req.body;

    if (!userId || !businessUnitId || !channel) {
      return res.status(400).json({
        error: "userId, businessUnitId y channel son requeridos",
      });
    }

    const result = await userChannelIdentityService.unlinkUser(
      userId,
      businessUnitId,
      channel as ChannelType,
    );

    res.json({ message: "Identidad desvinculada exitosamente", result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/user-identities/verify:
 *   post:
 *     summary: Verificar identidad de usuario en un canal
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessUnitId
 *               - channel
 *             properties:
 *               userId:
 *                 type: string
 *               businessUnitId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [WHATSAPP, WEB, MOBILE, API]
 *     responses:
 *       200:
 *         description: Identidad verificada
 */
router.post("/verify", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, businessUnitId, channel } = req.body;

    if (!userId || !businessUnitId || !channel) {
      return res.status(400).json({
        error: "userId, businessUnitId y channel son requeridos",
      });
    }

    const identity = await userChannelIdentityService.verifyIdentity(
      userId,
      businessUnitId,
      channel as ChannelType,
    );

    res.json(identity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/user-identities/find:
 *   get:
 *     summary: Buscar usuario por su ID externo en un canal
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [WHATSAPP, WEB, MOBILE, API]
 *       - in: query
 *         name: externalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
router.get("/find", authenticate, async (req: Request, res: Response) => {
  try {
    const { channel, externalId, businessUnitId } = req.query;

    if (!channel || !externalId || !businessUnitId) {
      return res.status(400).json({
        error: "channel, externalId y businessUnitId son requeridos",
      });
    }

    const identity = await userChannelIdentityService.getUserByExternalId(
      channel as ChannelType,
      externalId as string,
      businessUnitId as string,
    );

    if (!identity) {
      return res.status(404).json({
        error: "Usuario no encontrado para este canal y externalId",
      });
    }

    res.json(identity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/user-identities/user/{userId}:
 *   get:
 *     summary: Obtener todas las identidades de un usuario
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de identidades del usuario
 */
router.get(
  "/user/:userId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (typeof userId !== "string") {
        return res
          .status(400)
          .json({ error: "userId debe ser una cadena válida" });
      }

      const identities =
        await userChannelIdentityService.getAllUserIdentities(userId);
      res.json(identities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/user-identities/unverified:
 *   get:
 *     summary: Obtener identidades no verificadas
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de identidades no verificadas
 */
router.get("/unverified", authenticate, async (req: Request, res: Response) => {
  try {
    const { businessUnitId } = req.query;

    const identities = await userChannelIdentityService.getUnverifiedIdentities(
      businessUnitId as string | undefined,
    );

    res.json(identities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/user-identities/channel/{channel}/{businessUnitId}:
 *   get:
 *     summary: Obtener identidades por canal y unidad de negocio
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [WHATSAPP, WEB, MOBILE, API]
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de identidades del canal
 */
router.get(
  "/channel/:channel/:businessUnitId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { channel, businessUnitId } = req.params;

      if (typeof channel !== "string" || typeof businessUnitId !== "string") {
        return res.status(400).json({ error: "Parámetros inválidos" });
      }

      if (!Object.values(ChannelType).includes(channel as ChannelType)) {
        return res.status(400).json({
          error: `Canal inválido. Debe ser uno de: ${Object.values(ChannelType).join(", ")}`,
        });
      }

      const identities =
        await userChannelIdentityService.getIdentitiesByChannel(
          channel as ChannelType,
          businessUnitId,
        );

      res.json(identities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/user-identities/metadata:
 *   patch:
 *     summary: Actualizar metadata de una identidad
 *     tags: [User Channel Identity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessUnitId
 *               - channel
 *               - metadata
 *             properties:
 *               userId:
 *                 type: string
 *               businessUnitId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [WHATSAPP, WEB, MOBILE, API]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Metadata actualizada
 */
router.patch("/metadata", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, businessUnitId, channel, metadata } = req.body;

    if (!userId || !businessUnitId || !channel || !metadata) {
      return res.status(400).json({
        error: "userId, businessUnitId, channel y metadata son requeridos",
      });
    }

    const identity = await userChannelIdentityService.updateMetadata(
      userId,
      businessUnitId,
      channel as ChannelType,
      metadata,
    );

    res.json(identity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

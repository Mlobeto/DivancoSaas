import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import * as shippingService from "@core/services/shipping.service";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Envíos y logística (Manual, FedEx, DHL, etc.)
 */

/**
 * @swagger
 * /api/v1/shipping/create:
 *   post:
 *     summary: Crear un envío
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *               - origin
 *               - destination
 *               - packages
 *             properties:
 *               businessUnitId:
 *                 type: string
 *               origin:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   street:
 *                     type: string
 *                   number:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   phone:
 *                     type: string
 *               destination:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   street:
 *                     type: string
 *                   number:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   phone:
 *                     type: string
 *               packages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     weight:
 *                       type: number
 *                       description: Peso en kg
 *                     length:
 *                       type: number
 *                       description: Largo en cm
 *                     width:
 *                       type: number
 *                       description: Ancho en cm
 *                     height:
 *                       type: number
 *                       description: Alto en cm
 *                     description:
 *                       type: string
 *                     value:
 *                       type: number
 *               serviceType:
 *                 type: string
 *                 enum: [express, standard, economy]
 *               requiresSignature:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Envío creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post("/create", authenticate, async (req, res) => {
  const { businessUnitId, ...shipmentData } = req.body;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  const result = await shippingService.createShipment(
    businessUnitId,
    shipmentData,
  );

  if (!result.success) {
    return res
      .status(400)
      .json({ error: result.errors?.[0] || "Error creating shipment" });
  }

  res.json(result);
});

/**
 * @swagger
 * /api/v1/shipping/rates:
 *   post:
 *     summary: Obtener cotizaciones de envío
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *               - origin
 *               - destination
 *               - packages
 *             properties:
 *               businessUnitId:
 *                 type: string
 *               origin:
 *                 type: object
 *               destination:
 *                 type: object
 *               packages:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Cotizaciones disponibles
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post("/rates", authenticate, async (req, res) => {
  const { businessUnitId, origin, destination, packages } = req.body;

  if (!businessUnitId || !origin || !destination || !packages) {
    return res.status(400).json({
      error: "businessUnitId, origin, destination, and packages are required",
    });
  }

  try {
    const rates = await shippingService.getShippingRates(
      businessUnitId,
      origin,
      destination,
      packages,
    );
    res.json({ rates });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Error getting rates",
    });
  }
});

/**
 * @swagger
 * /api/v1/shipping/track/{trackingNumber}:
 *   get:
 *     summary: Rastrear un envío
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingNumber
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
 *         description: Información de rastreo
 *       404:
 *         description: Envío no encontrado
 *       401:
 *         description: No autenticado
 */
router.get("/track/:trackingNumber", authenticate, async (req, res) => {
  const { trackingNumber } = req.params;
  const { businessUnitId } = req.query;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const tracking = await shippingService.trackShipment(
      businessUnitId as string,
      trackingNumber as string,
    );
    res.json(tracking);
  } catch (error) {
    res.status(404).json({ error: "Tracking not found" });
  }
});

/**
 * @swagger
 * /api/v1/shipping/{shipmentId}:
 *   get:
 *     summary: Obtener información de un envío
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
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
 *         description: Información del envío
 *       404:
 *         description: Envío no encontrado
 *       401:
 *         description: No autenticado
 */
router.get("/:shipmentId", authenticate, async (req, res) => {
  const { shipmentId } = req.params;
  const { businessUnitId } = req.query;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const shipment = await shippingService.getShipment(
      businessUnitId as string,
      shipmentId as string,
    );
    res.json(shipment);
  } catch (error) {
    res.status(404).json({ error: "Shipment not found" });
  }
});

/**
 * @swagger
 * /api/v1/shipping/{shipmentId}/cancel:
 *   post:
 *     summary: Cancelar un envío
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *             properties:
 *               businessUnitId:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Envío cancelado exitosamente
 *       400:
 *         description: Error al cancelar
 *       401:
 *         description: No autenticado
 */
router.post("/:shipmentId/cancel", authenticate, async (req, res) => {
  const { shipmentId } = req.params;
  const { businessUnitId, trackingNumber, reason } = req.body;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  const result = await shippingService.cancelShipment(businessUnitId, {
    shipmentId: shipmentId as string,
    trackingNumber,
    reason,
  });

  if (!result.success) {
    return res
      .status(400)
      .json({ error: result.errors?.[0] || "Error cancelling shipment" });
  }

  res.json(result);
});

/**
 * @swagger
 * /api/v1/shipping/{shipmentId}/label:
 *   get:
 *     summary: Descargar etiqueta de envío
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, png, zpl]
 *           default: pdf
 *     responses:
 *       200:
 *         description: Archivo de etiqueta
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Etiqueta no disponible
 *       401:
 *         description: No autenticado
 */
router.get("/:shipmentId/label", authenticate, async (req, res) => {
  const { shipmentId } = req.params;
  const { businessUnitId, format = "pdf" } = req.query;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const labelBuffer = await shippingService.downloadShipmentLabel(
      businessUnitId as string,
      shipmentId as string,
      format as "pdf" | "png" | "zpl",
    );

    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      zpl: "text/plain",
    };

    res.setHeader(
      "Content-Type",
      contentTypes[format as string] || "application/pdf",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="label-${shipmentId}.${format}"`,
    );
    res.send(labelBuffer);
  } catch (error) {
    res.status(404).json({ error: "Label not available" });
  }
});

/**
 * @swagger
 * /api/v1/shipping/schedule-pickup:
 *   post:
 *     summary: Programar recolección de paquetes
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *               - address
 *               - date
 *               - timeWindow
 *               - packages
 *             properties:
 *               businessUnitId:
 *                 type: string
 *               address:
 *                 type: object
 *               date:
 *                 type: string
 *                 format: date-time
 *               timeWindow:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     example: "09:00"
 *                   end:
 *                     type: string
 *                     example: "18:00"
 *               packages:
 *                 type: array
 *                 items:
 *                   type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recolección programada exitosamente
 *       400:
 *         description: Error al programar recolección
 *       401:
 *         description: No autenticado
 */
router.post("/schedule-pickup", authenticate, async (req, res) => {
  const { businessUnitId, ...pickupData } = req.body;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const result = await shippingService.schedulePickup(
      businessUnitId,
      pickupData,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Error scheduling pickup",
    });
  }
});

/**
 * @swagger
 * /api/v1/shipping/validate-address:
 *   post:
 *     summary: Validar una dirección
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *               - address
 *             properties:
 *               businessUnitId:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   number:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Resultado de validación
 *       400:
 *         description: Error al validar
 *       401:
 *         description: No autenticado
 */
router.post("/validate-address", authenticate, async (req, res) => {
  const { businessUnitId, address } = req.body;

  if (!businessUnitId || !address) {
    return res
      .status(400)
      .json({ error: "businessUnitId and address are required" });
  }

  try {
    const result = await shippingService.validateAddress(
      businessUnitId,
      address,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error validating address",
    });
  }
});

/**
 * @swagger
 * /api/v1/shipping/validate-config:
 *   post:
 *     summary: Validar configuración de envíos
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *             properties:
 *               businessUnitId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración válida
 *       400:
 *         description: Configuración inválida
 *       401:
 *         description: No autenticado
 */
router.post("/validate-config", authenticate, async (req, res) => {
  const { businessUnitId } = req.body;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const isValid =
      await shippingService.validateShippingConfig(businessUnitId);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(400).json({
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    });
  }
});

export default router;

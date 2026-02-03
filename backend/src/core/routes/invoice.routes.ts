import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import * as invoiceService from "@core/services/invoice.service";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Facturación electrónica (Taxxa, Divanco, etc.)
 */

/**
 * @swagger
 * /api/v1/invoices/create:
 *   post:
 *     summary: Crear una factura
 *     tags: [Invoices]
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
 *               - issuer
 *               - receiver
 *               - items
 *               - subtotal
 *               - total
 *             properties:
 *               businessUnitId:
 *                 type: string
 *                 description: ID del Business Unit
 *               issuer:
 *                 type: object
 *                 properties:
 *                   rfc:
 *                     type: string
 *                   name:
 *                     type: string
 *                   taxRegime:
 *                     type: string
 *               receiver:
 *                 type: object
 *                 properties:
 *                   rfc:
 *                     type: string
 *                   name:
 *                     type: string
 *                   cfdiUse:
 *                     type: string
 *                   email:
 *                     type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     productCode:
 *                       type: string
 *                     description:
 *                       type: string
 *                     unitPrice:
 *                       type: number
 *                     total:
 *                       type: number
 *               subtotal:
 *                 type: number
 *               taxes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     rate:
 *                       type: number
 *                     amount:
 *                       type: number
 *               total:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: MXN
 *               paymentForm:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Factura creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post("/create", authenticate, async (req, res) => {
  const { businessUnitId, ...invoiceData } = req.body;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  const result = await invoiceService.createInvoice(
    businessUnitId,
    invoiceData,
  );

  if (!result.success) {
    return res
      .status(400)
      .json({ error: result.errors?.[0] || "Error creating invoice" });
  }

  res.json(result);
});

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}/stamp:
 *   post:
 *     summary: Timbrar una factura
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
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
 *         description: Factura timbrada exitosamente
 *       400:
 *         description: Error al timbrar
 *       401:
 *         description: No autenticado
 */
router.post("/:invoiceId/stamp", authenticate, async (req, res) => {
  const { invoiceId } = req.params;
  const { businessUnitId } = req.query;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  const result = await invoiceService.stampInvoice(
    businessUnitId as string,
    invoiceId as string,
  );

  if (!result.success) {
    return res
      .status(400)
      .json({ error: result.errors?.[0] || "Error stamping invoice" });
  }

  res.json(result);
});

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}/cancel:
 *   post:
 *     summary: Cancelar una factura
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
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
 *               uuid:
 *                 type: string
 *               reason:
 *                 type: string
 *               replacementUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Factura cancelada exitosamente
 *       400:
 *         description: Error al cancelar
 *       401:
 *         description: No autenticado
 */
router.post("/:invoiceId/cancel", authenticate, async (req, res) => {
  const { invoiceId } = req.params;
  const { businessUnitId, uuid, reason, replacementUuid } = req.body;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  const result = await invoiceService.cancelInvoice(businessUnitId, {
    invoiceId: invoiceId as string,
    uuid,
    reason,
    replacementUuid,
  });

  if (!result.success) {
    return res
      .status(400)
      .json({ error: result.errors?.[0] || "Error cancelling invoice" });
  }

  res.json(result);
});

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}:
 *   get:
 *     summary: Obtener información de una factura
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
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
 *         description: Información de la factura
 *       404:
 *         description: Factura no encontrada
 *       401:
 *         description: No autenticado
 */
router.get("/:invoiceId", authenticate, async (req, res) => {
  const { invoiceId } = req.params;
  const { businessUnitId } = req.query;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const invoice = await invoiceService.getInvoice(
      businessUnitId as string,
      invoiceId as string,
    );
    res.json(invoice);
  } catch (error) {
    res.status(404).json({ error: "Invoice not found" });
  }
});

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}/download/xml:
 *   get:
 *     summary: Descargar XML de una factura
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
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
 *         description: Archivo XML
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: XML no disponible
 *       401:
 *         description: No autenticado
 */
router.get("/:invoiceId/download/xml", authenticate, async (req, res) => {
  const { invoiceId } = req.params;
  const { businessUnitId } = req.query;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const xmlBuffer = await invoiceService.downloadInvoiceXml(
      businessUnitId as string,
      invoiceId as string,
    );
    res.setHeader("Content-Type", "application/xml");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoiceId}.xml"`,
    );
    res.send(xmlBuffer);
  } catch (error) {
    res.status(404).json({ error: "XML not available" });
  }
});

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}/download/pdf:
 *   get:
 *     summary: Descargar PDF de una factura
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
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
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF no disponible
 *       401:
 *         description: No autenticado
 */
router.get("/:invoiceId/download/pdf", authenticate, async (req, res) => {
  const { invoiceId } = req.params;
  const { businessUnitId } = req.query;

  if (!businessUnitId) {
    return res.status(400).json({ error: "businessUnitId is required" });
  }

  try {
    const pdfBuffer = await invoiceService.downloadInvoicePdf(
      businessUnitId as string,
      invoiceId as string,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoiceId}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    res.status(404).json({ error: "PDF not available" });
  }
});

/**
 * @swagger
 * /api/v1/invoices/validate-config:
 *   post:
 *     summary: Validar configuración de facturación
 *     tags: [Invoices]
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
    const isValid = await invoiceService.validateInvoiceConfig(businessUnitId);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(400).json({
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    });
  }
});

export default router;

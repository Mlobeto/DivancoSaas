/**
 * ASSET TEMPLATE ROUTES
 * Gestión de plantillas de activos
 */

import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import {
  AssetTemplateService,
  AssetCategory,
  AssetManagementType,
  FieldType,
} from "@modules/assets/services/asset-template.service";
import { z } from "zod";

const router = Router();
const templateService = new AssetTemplateService();

router.use(authenticate);

// ============================================
// SCHEMAS
// ============================================

const customFieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z_][a-z0-9_]*$/, "Invalid key format"),
  label: z.string().min(1),
  type: z.nativeEnum(FieldType),
  section: z.string().min(1),
  order: z.number().int().min(0),
  required: z.boolean(),
  validations: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.string()).optional(),
    })
    .optional(),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.nativeEnum(AssetCategory),
  managementType: z.nativeEnum(AssetManagementType),
  description: z.string().max(500).nullish(),
  icon: z.string().max(50).nullish(),
  requiresPreventiveMaintenance: z.boolean().optional().default(false),
  requiresDocumentation: z.boolean().optional().default(false),
  requiresWeight: z.boolean().optional().default(false),
  hasExpiryDate: z.boolean().optional().default(false),
  requiresLotTracking: z.boolean().optional().default(false),
  isDangerous: z.boolean().optional().default(false),
  hazardClass: z.string().nullish(),
  minStockLevel: z.number().nullish(),
  customFields: z.array(customFieldSchema).default([]),
  technicalSpecs: z.record(z.string(), z.any()).nullish(),
  machineParts: z.array(z.any()).nullish(),
  maintenanceSchedule: z.array(z.any()).nullish(),
  presentation: z.any().nullish(),
  compatibleWith: z.any().nullish(),
  businessRules: z.any().nullish(),
  rentalRules: z.any().nullish(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  managementType: z.nativeEnum(AssetManagementType).optional(),
  description: z.string().max(500).nullish(),
  icon: z.string().max(50).nullish(),
  requiresPreventiveMaintenance: z.boolean().optional(),
  requiresDocumentation: z.boolean().optional(),
  requiresWeight: z.boolean().optional(),
  hasExpiryDate: z.boolean().optional(),
  requiresLotTracking: z.boolean().optional(),
  isDangerous: z.boolean().optional(),
  hazardClass: z.string().nullish(),
  minStockLevel: z.number().nullish(),
  customFields: z.array(customFieldSchema).optional(),
  technicalSpecs: z.record(z.string(), z.any()).nullish(),
  machineParts: z.array(z.any()).nullish(),
  maintenanceSchedule: z.array(z.any()).nullish(),
  presentation: z.any().nullish(),
  compatibleWith: z.any().nullish(),
  businessRules: z.any().nullish(),
  rentalRules: z.any().nullish(),
});

const listQuerySchema = z.object({
  category: z.nativeEnum(AssetCategory).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * @openapi
 * /asset-templates:
 *   get:
 *     tags: [Asset Templates]
 *     summary: Listar plantillas de activos
 *     description: Devuelve todas las plantillas de la Business Unit con filtros opcionales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MACHINERY, IMPLEMENT, VEHICLE, TOOL]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en nombre o descripción
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de plantillas
 */
router.get("/", async (req, res, next) => {
  try {
    const businessUnitId = (req as any).context.businessUnitId;
    const options = listQuerySchema.parse(req.query);

    const result = await templateService.listTemplates(businessUnitId, options);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /asset-templates/stats:
 *   get:
 *     tags: [Asset Templates]
 *     summary: Estadísticas de plantillas
 *     description: Devuelve estadísticas de uso de plantillas en la Business Unit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de plantillas
 */
router.get("/stats", async (req, res, next) => {
  try {
    const businessUnitId = (req as any).context.businessUnitId;
    const stats = await templateService.getTemplateStats(businessUnitId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /asset-templates/{id}:
 *   get:
 *     tags: [Asset Templates]
 *     summary: Obtener plantilla por ID
 *     description: Devuelve los detalles completos de una plantilla
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle de la plantilla
 *       404:
 *         description: Plantilla no encontrada
 */
router.get("/:id", async (req, res, next) => {
  try {
    const businessUnitId = (req as any).context.businessUnitId;
    const { id } = req.params;

    const template = await templateService.getTemplateById(id, businessUnitId);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /asset-templates:
 *   post:
 *     tags: [Asset Templates]
 *     summary: Crear nueva plantilla
 *     description: Crea una plantilla de activo con campos personalizados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, requiresPreventiveMaintenance, customFields]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Retroexcavadora"
 *               category:
 *                 type: string
 *                 enum: [MACHINERY, IMPLEMENT, VEHICLE, TOOL]
 *               description:
 *                 type: string
 *                 example: "Maquinaria pesada para excavación"
 *               icon:
 *                 type: string
 *                 example: "🚜"
 *               requiresPreventiveMaintenance:
 *                 type: boolean
 *               customFields:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Plantilla creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe una plantilla con ese nombre
 */
router.post("/", async (req, res, next) => {
  try {
    const businessUnitId = (req as any).context.businessUnitId;
    const data = createTemplateSchema.parse(req.body);

    const template = await templateService.createTemplate(data, businessUnitId);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /asset-templates/{id}:
 *   put:
 *     tags: [Asset Templates]
 *     summary: Actualizar plantilla
 *     description: Actualiza una plantilla existente. Los activos ya creados mantienen sus datos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Plantilla actualizada
 *       404:
 *         description: Plantilla no encontrada
 */
router.put("/:id", async (req, res, next) => {
  try {
    const businessUnitId = (req as any).context.businessUnitId;
    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    const template = await templateService.updateTemplate(
      id,
      data,
      businessUnitId,
    );
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /asset-templates/{id}/duplicate:
 *   post:
 *     tags: [Asset Templates]
 *     summary: Duplicar plantilla
 *     description: Crea una copia de una plantilla existente con un nuevo nombre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Retroexcavadora Grande"
 *     responses:
 *       201:
 *         description: Plantilla duplicada
 */
router.post("/:id/duplicate", async (req, res, next) => {
  try {
    const businessUnitId = (req as any).context.businessUnitId;
    const { id } = req.params;
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body);

    const template = await templateService.duplicateTemplate(
      id,
      name,
      businessUnitId,
    );
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /asset-templates/{id}:
 *   delete:
 *     tags: [Asset Templates]
 *     summary: Eliminar plantilla
 *     description: Elimina una plantilla. Solo se puede eliminar si no tiene activos asociados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plantilla eliminada
 *       400:
 *         description: La plantilla tiene activos asociados
 *       404:
 *         description: Plantilla no encontrada
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const businessUnitId = (req as any).context.businessUnitId;
    const { id } = req.params;

    const result = await templateService.deleteTemplate(id, businessUnitId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;

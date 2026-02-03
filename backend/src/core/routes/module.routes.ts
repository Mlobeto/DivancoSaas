import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { ModuleService } from "@core/services/module.service";
import { z } from "zod";

const router = Router();
const moduleService = new ModuleService();

router.use(authenticate);

const listModulesQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const listBuModulesQuerySchema = z.object({
  search: z.string().optional(),
  enabled: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * @openapi
 * /modules:
 *   get:
 *     tags: [Modules]
 *     summary: Listar módulos disponibles en la plataforma
 *     description: Devuelve todos los módulos que ofrece DivancoSaas (ej. projects, clients, invoicing). Los módulos se activan por Business Unit.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de módulos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string, example: "projects" }
 *                       displayName: { type: string, example: "Gestión de Proyectos" }
 *                       description: { type: string, example: "Administra tus proyectos y tareas" }
 *                       icon: { type: string, example: "📁" }
 *                       category: { type: string, example: "core" }
 *                       isAvailable: { type: boolean, example: true }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", async (req, res) => {
  const options = listModulesQuerySchema.parse(req.query);
  const result = await moduleService.listModules(options);
  res.json({ success: true, ...result });
});

/**
 * @openapi
 * /modules/{businessUnitId}:
 *   get:
 *     tags: [Modules]
 *     summary: Módulos activos en una Business Unit
 *     description: Devuelve los módulos que están activados/habilitados en una Business Unit específica.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Módulos activos en la Business Unit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       moduleId: { type: string, format: uuid }
 *                       moduleName: { type: string, example: "projects" }
 *                       displayName: { type: string, example: "Gestión de Proyectos" }
 *                       activatedAt: { type: string, format: date-time }
 *                       configuration: { type: object, description: "Configuración específica del módulo" }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Business Unit no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:businessUnitId", async (req, res) => {
  const { businessUnitId } = req.params;
  const options = listBuModulesQuerySchema.parse(req.query);
  const result = await moduleService.listBusinessUnitModules(
    businessUnitId,
    options,
  );
  res.json({ success: true, ...result });
});

/**
 * @openapi
 * /modules/{businessUnitId}/{moduleId}/enable:
 *   post:
 *     tags: [Modules]
 *     summary: Activar módulo en una Business Unit
 *     description: Habilita un módulo para su uso en una Business Unit. Una vez activado, el módulo estará disponible para los usuarios de esa BU.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               configuration:
 *                 type: object
 *                 description: Configuración inicial del módulo (opcional)
 *     responses:
 *       200:
 *         description: Módulo activado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Module enabled successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     moduleId: { type: string, format: uuid }
 *                     businessUnitId: { type: string, format: uuid }
 *                     activatedAt: { type: string, format: date-time }
 *       400:
 *         description: Módulo ya está activado o no disponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Business Unit o módulo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const enableModuleSchema = z.object({
  configuration: z.any().optional(),
});

router.post("/:businessUnitId/:moduleId/enable", async (req, res, next) => {
  try {
    const { businessUnitId, moduleId } = req.params;
    const { configuration } = enableModuleSchema.parse(req.body);

    const result = await moduleService.enableModule(
      businessUnitId,
      moduleId,
      configuration,
    );

    res.json({
      success: true,
      message: "Module enabled successfully",
      data: {
        moduleId: result.moduleId,
        businessUnitId: result.businessUnitId,
        activatedAt: result.createdAt,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      });
    }
    if (error.message?.includes("already enabled")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MODULE_ALREADY_ENABLED",
          message: "Module is already enabled for this Business Unit",
        },
      });
    }
    next(error);
  }
});

/**
 * @openapi
 * /modules/{businessUnitId}/{moduleId}/disable:
 *   post:
 *     tags: [Modules]
 *     summary: Desactivar módulo en una Business Unit
 *     description: Deshabilita un módulo en una Business Unit. CUIDADO - Los datos del módulo se mantienen pero la funcionalidad no estará disponible.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Módulo desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Module disabled successfully" }
 *       400:
 *         description: Módulo no está activado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Business Unit o módulo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:businessUnitId/:moduleId/disable", async (req, res, next) => {
  try {
    const { businessUnitId, moduleId } = req.params;

    await moduleService.disableModule(businessUnitId, moduleId);

    res.json({
      success: true,
      message: "Module disabled successfully",
    });
  } catch (error: any) {
    if (error.message?.includes("not enabled")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MODULE_NOT_ENABLED",
          message: "Module is not enabled in this Business Unit",
        },
      });
    }
    if (error.message?.includes("already disabled")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MODULE_ALREADY_DISABLED",
          message: "Module is already disabled",
        },
      });
    }
    next(error);
  }
});

export default router;

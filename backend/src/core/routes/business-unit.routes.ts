import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { BusinessUnitService } from "@core/services/business-unit.service";
import { prisma } from "@config/database";
import { z } from "zod";

const router = Router();
const businessUnitService = new BusinessUnitService();

router.use(authenticate);

const listQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * @openapi
 * /business-units:
 *   get:
 *     tags: [Business Units]
 *     summary: Listar Business Units del tenant
 *     description: Devuelve todas las Business Units (unidades de negocio) del tenant actual. Cada BU representa un rubro/negocio independiente con datos aislados.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de Business Units
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
 *                       name: { type: string, example: "Obras Civiles" }
 *                       slug: { type: string, example: "obras-civiles" }
 *                       description: { type: string }
 *                       tenantId: { type: string, format: uuid }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   post:
 *     tags: [Business Units]
 *     summary: Crear nueva Business Unit
 *     description: Crea una nueva Business Unit en el tenant. Cada BU es independiente y puede tener módulos diferentes activados.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Desarrollos Inmobiliarios"
 *                 description: Nombre descriptivo de la Business Unit
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 example: "desarrollos-inmobiliarios"
 *                 description: Identificador único (solo minúsculas, números y guiones)
 *               description:
 *                 type: string
 *                 example: "Gestión de proyectos inmobiliarios y ventas"
 *     responses:
 *       201:
 *         description: Business Unit creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     description: { type: string }
 *                     tenantId: { type: string, format: uuid }
 *       400:
 *         description: Datos inválidos o slug ya existe
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
 */
router.get("/", async (req, res) => {
  const tenantId = req.context!.tenantId;
  const options = listQuerySchema.parse(req.query);

  const result = await businessUnitService.listBusinessUnits(tenantId, options);
  res.json({ success: true, ...result });
});

/**
 * @openapi
 * /business-units/my:
 *   get:
 *     tags: [Business Units]
 *     summary: Obtener Business Units del usuario actual
 *     description: Devuelve todas las Business Units a las que el usuario autenticado tiene acceso, incluyendo su rol en cada una.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de Business Units del usuario
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
 *                       name: { type: string, example: "Obras Civiles" }
 *                       slug: { type: string, example: "obras-civiles" }
 *                       description: { type: string }
 *                       role:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           name: { type: string, example: "admin" }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/my", async (req, res, next) => {
  try {
    const userId = req.context!.userId;

    const userBusinessUnits = await prisma.userBusinessUnit.findMany({
      where: { userId },
      include: {
        businessUnit: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const businessUnits = userBusinessUnits.map((ubu) => ({
      id: ubu.businessUnit.id,
      name: ubu.businessUnit.name,
      slug: ubu.businessUnit.slug,
      description: ubu.businessUnit.description,
      role: ubu.role,
    }));

    res.json({ success: true, data: businessUnits });
  } catch (error) {
    next(error);
  }
});

const createBusinessUnitSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const data = createBusinessUnitSchema.parse(req.body);

    const businessUnit = await businessUnitService.createBusinessUnit(
      tenantId,
      data,
    );

    res.status(201).json({ success: true, data: businessUnit });
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BUSINESS_UNIT_ALREADY_EXISTS",
          message: "Business Unit with this slug already exists",
        },
      });
    }
    next(error);
  }
});

/**
 * @openapi
 * /business-units/{id}:
 *   get:
 *     tags: [Business Units]
 *     summary: Obtener detalle de Business Unit
 *     description: Devuelve información completa de una Business Unit incluyendo módulos activados y estadísticas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Detalle de la Business Unit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     description: { type: string }
 *                     tenantId: { type: string, format: uuid }
 *                     activeModules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           moduleId: { type: string, format: uuid }
 *                           moduleName: { type: string }
 *                     usersCount: { type: integer, example: 5 }
 *                     createdAt: { type: string, format: date-time }
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
 *
 *   put:
 *     tags: [Business Units]
 *     summary: Actualizar Business Unit
 *     description: Actualiza información de una Business Unit existente. El slug no puede modificarse.
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Obras Civiles y Construcción"
 *               description:
 *                 type: string
 *                 example: "Gestión completa de proyectos de construcción"
 *     responses:
 *       200:
 *         description: Business Unit actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     description: { type: string }
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
 *
 *   delete:
 *     tags: [Business Units]
 *     summary: Eliminar Business Unit
 *     description: Elimina una Business Unit. CUIDADO - Esto eliminará todos los datos asociados (usuarios, módulos, workflows).
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
 *         description: Business Unit eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Business Unit deleted successfully" }
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
router.get("/:id", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const { id } = req.params;

    const businessUnit = await businessUnitService.getBusinessUnitById(
      tenantId,
      id,
    );

    if (!businessUnit) {
      return res.status(404).json({
        success: false,
        error: {
          code: "BUSINESS_UNIT_NOT_FOUND",
          message: "Business Unit not found",
        },
      });
    }

    res.json({ success: true, data: businessUnit });
  } catch (error) {
    next(error);
  }
});

const updateBusinessUnitSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const { id } = req.params;
    const data = updateBusinessUnitSchema.parse(req.body);

    const businessUnit = await businessUnitService.updateBusinessUnit(
      tenantId,
      id,
      data,
    );

    res.json({ success: true, data: businessUnit });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const { id } = req.params;

    await businessUnitService.deleteBusinessUnit(tenantId, id);

    res.json({
      success: true,
      message: "Business Unit deleted successfully",
    });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: {
          code: "BUSINESS_UNIT_NOT_FOUND",
          message: "Business Unit not found",
        },
      });
    }
    next(error);
  }
});

/**
 * @openapi
 * /business-units/{id}/modules:
 *   get:
 *     tags: [Business Units]
 *     summary: Listar módulos de una Business Unit
 *     description: Devuelve los módulos activos en una Business Unit específica. Los módulos determinan qué funcionalidad está disponible.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Lista de módulos activos
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
 *                       description: { type: string }
 *                       isActive: { type: boolean, example: true }
 *                       activatedAt: { type: string, format: date-time }
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
router.get("/:id/modules", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: [] });
});

export default router;

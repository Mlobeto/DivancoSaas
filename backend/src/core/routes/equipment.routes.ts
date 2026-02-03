import { Router } from "express";
import { z } from "zod";
import { EquipmentCondition, EquipmentStatus } from "@prisma/client";
import {
  authenticate,
  requireBusinessUnit,
} from "@core/middlewares/auth.middleware";
import { EquipmentService } from "@core/services/equipment.service";

const router = Router();
const equipmentService = new EquipmentService();

router.use(authenticate);
router.use(requireBusinessUnit);

/**
 * @openapi
 * /equipment:
 *   get:
 *     tags: [Equipment]
 *     summary: Listar equipos/implementos (paginado + filtrado)
 *     description: Devuelve el inventario de equipos de la Business Unit actual.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Búsqueda por código/nombre/descripcion
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, RENTED, MAINTENANCE, OUT_OF_SERVICE, RESERVED]
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *           enum: [EXCELLENT, GOOD, FAIR, POOR]
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lista paginada de equipos
 */

const listEquipmentQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus).optional(),
  condition: z.nativeEnum(EquipmentCondition).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

router.get("/", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const businessUnitId = req.context!.businessUnitId!;
    const options = listEquipmentQuerySchema.parse(req.query);

    const result = await equipmentService.listEquipment(
      tenantId,
      businessUnitId,
      options,
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /equipment:
 *   post:
 *     tags: [Equipment]
 *     summary: Crear nuevo equipo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, category]
 *             properties:
 *               code: { type: string, example: "EXC-001" }
 *               name: { type: string, example: "Excavadora Caterpillar 320D" }
 *               category: { type: string, example: "Excavadoras" }
 *               description: { type: string }
 *               specifications: { type: object }
 *               dailyRate: { type: number }
 *               weeklyRate: { type: number }
 *               monthlyRate: { type: number }
 *               status: { type: string, enum: [AVAILABLE, RENTED, MAINTENANCE, OUT_OF_SERVICE, RESERVED] }
 *               condition: { type: string, enum: [EXCELLENT, GOOD, FAIR, POOR] }
 *     responses:
 *       201:
 *         description: Equipo creado
 */
const createEquipmentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  specifications: z.any().optional(),
  dailyRate: z.number().min(0).optional(),
  weeklyRate: z.number().min(0).optional(),
  monthlyRate: z.number().min(0).optional(),
  status: z.nativeEnum(EquipmentStatus).optional(),
  condition: z.nativeEnum(EquipmentCondition).optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const businessUnitId = req.context!.businessUnitId!;
    const data = createEquipmentSchema.parse(req.body);

    const equipment = await equipmentService.createEquipment(
      tenantId,
      businessUnitId,
      data,
    );

    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /equipment/{id}:
 *   get:
 *     tags: [Equipment]
 *     summary: Obtener equipo por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detalle del equipo
 *       404:
 *         description: Equipo no encontrado
 */
router.get("/:id", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const businessUnitId = req.context!.businessUnitId!;
    const { id } = req.params;

    const equipment = await equipmentService.getEquipmentById(
      tenantId,
      businessUnitId,
      id,
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: { code: "EQUIPMENT_NOT_FOUND", message: "Equipment not found" },
      });
    }

    res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /equipment/{id}:
 *   put:
 *     tags: [Equipment]
 *     summary: Actualizar equipo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               specifications: { type: object }
 *               dailyRate: { type: number }
 *               weeklyRate: { type: number }
 *               monthlyRate: { type: number }
 *               status: { type: string }
 *               condition: { type: string }
 *     responses:
 *       200:
 *         description: Equipo actualizado
 */
const updateEquipmentSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  specifications: z.any().optional(),
  dailyRate: z.number().min(0).optional(),
  weeklyRate: z.number().min(0).optional(),
  monthlyRate: z.number().min(0).optional(),
  status: z.nativeEnum(EquipmentStatus).optional(),
  condition: z.nativeEnum(EquipmentCondition).optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const businessUnitId = req.context!.businessUnitId!;
    const { id } = req.params;
    const data = updateEquipmentSchema.parse(req.body);

    const equipment = await equipmentService.updateEquipment(
      tenantId,
      businessUnitId,
      id,
      data,
    );

    res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /equipment/{id}:
 *   delete:
 *     tags: [Equipment]
 *     summary: Eliminar equipo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Equipo eliminado
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = req.context!.tenantId;
    const businessUnitId = req.context!.businessUnitId!;
    const { id } = req.params;

    await equipmentService.deleteEquipment(tenantId, businessUnitId, id);

    res.json({ success: true, message: "Equipment deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router } from "express";
import {
  authenticate,
  requireBusinessUnit,
} from "@core/middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.use(requireBusinessUnit);

/**
 * @openapi
 * /workflows:
 *   get:
 *     tags: [Workflows]
 *     summary: Listar workflows configurados
 *     description: Devuelve los workflows configurados en la Business Unit actual. Los workflows son configurables y NO están hardcodeados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por módulo específico
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por workflows activos/inactivos
 *     responses:
 *       200:
 *         description: Lista de workflows
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
 *                       name: { type: string, example: "Aprobación de Presupuestos" }
 *                       description: { type: string }
 *                       moduleId: { type: string, format: uuid }
 *                       moduleName: { type: string, example: "projects" }
 *                       states:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id: { type: string, format: uuid }
 *                             name: { type: string, example: "En Revisión" }
 *                             order: { type: integer, example: 1 }
 *                             color: { type: string, example: "#FFA500" }
 *                       isActive: { type: boolean, example: true }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   post:
 *     tags: [Workflows]
 *     summary: Crear nuevo workflow
 *     description: Crea un workflow personalizado con estados configurables. Los estados NO están hardcodeados.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, moduleId, states]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Aprobación de Facturas"
 *               description:
 *                 type: string
 *                 example: "Workflow para aprobar facturas de proveedores"
 *               moduleId:
 *                 type: string
 *                 format: uuid
 *                 description: Módulo al que pertenece el workflow
 *               states:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   required: [name, order]
 *                   properties:
 *                     name: { type: string, example: "Pendiente" }
 *                     order: { type: integer, example: 1 }
 *                     color: { type: string, example: "#808080" }
 *                     description: { type: string }
 *     responses:
 *       201:
 *         description: Workflow creado exitosamente
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
 *                     description: { type: string }
 *                     moduleId: { type: string, format: uuid }
 *                     states:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           name: { type: string }
 *                           order: { type: integer }
 *                           color: { type: string }
 *       400:
 *         description: Datos inválidos
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
  // TODO: Implementar
  res.json({ success: true, data: [] });
});

router.post("/", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: "Not implemented yet" } });
});

/**
 * @openapi
 * /workflows/{id}:
 *   get:
 *     tags: [Workflows]
 *     summary: Obtener detalle de workflow
 *     description: Devuelve información completa de un workflow incluyendo todos sus estados y transiciones.
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
 *         description: Detalle del workflow
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
 *                     description: { type: string }
 *                     moduleId: { type: string, format: uuid }
 *                     moduleName: { type: string }
 *                     states:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           name: { type: string }
 *                           order: { type: integer }
 *                           color: { type: string }
 *                           description: { type: string }
 *                     isActive: { type: boolean }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workflow no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   put:
 *     tags: [Workflows]
 *     summary: Actualizar workflow
 *     description: Actualiza la configuración de un workflow. Permite modificar estados existentes o agregar nuevos.
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
 *               name: { type: string }
 *               description: { type: string }
 *               states:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid, description: "ID para actualizar estado existente" }
 *                     name: { type: string }
 *                     order: { type: integer }
 *                     color: { type: string }
 *                     description: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Workflow actualizado
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
 *                     states:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           name: { type: string }
 *                           order: { type: integer }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workflow no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   delete:
 *     tags: [Workflows]
 *     summary: Eliminar workflow
 *     description: Elimina un workflow. CUIDADO - Esto afectará las entidades que usan este workflow.
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
 *         description: Workflow eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Workflow deleted successfully" }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workflow no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: "Not implemented yet" } });
});

router.put("/:id", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: "Not implemented yet" } });
});

router.delete("/:id", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, message: "Not implemented yet" });
});

export default router;

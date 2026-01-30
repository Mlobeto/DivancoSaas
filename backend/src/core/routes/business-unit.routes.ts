import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

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
  // TODO: Implementar
  res.json({ success: true, data: [] });
});

router.post("/", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: "Not implemented yet" } });
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

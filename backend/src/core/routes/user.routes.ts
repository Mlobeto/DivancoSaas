import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Listar usuarios del tenant
 *     description: Devuelve todos los usuarios del tenant actual. Filtra automáticamente por el tenant del usuario autenticado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Opcional - Filtrar por Business Unit específica
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         description: Filtrar por estado del usuario
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       email: { type: string, format: email }
 *                       firstName: { type: string, example: "Juan" }
 *                       lastName: { type: string, example: "Pérez" }
 *                       status: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
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
 *     tags: [Users]
 *     summary: Crear nuevo usuario
 *     description: Crea un usuario en el tenant y lo asigna a una o más Business Units con roles específicos. Un usuario puede tener roles diferentes en cada BU.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, businessUnits]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@empresa.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "Password123!"
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 example: "María"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 example: "González"
 *               businessUnits:
 *                 type: array
 *                 description: Business Units y roles del usuario
 *                 items:
 *                   type: object
 *                   required: [businessUnitId, roleId]
 *                   properties:
 *                     businessUnitId:
 *                       type: string
 *                       format: uuid
 *                     roleId:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
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
 *                     email: { type: string, format: email }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     status: { type: string, example: "ACTIVE" }
 *                     businessUnits:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           businessUnitId: { type: string, format: uuid }
 *                           businessUnitName: { type: string }
 *                           roleName: { type: string }
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

/**
 * GET /api/v1/users
 * Listar usuarios del tenant
 */
router.get("/", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: [] });
});

/**
 * POST /api/v1/users
 * Crear nuevo usuario
 */
router.post("/", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: "Not implemented yet" } });
});
/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtener detalle de usuario
 *     description: Devuelve información completa del usuario incluyendo sus Business Units y roles asignados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Detalle del usuario
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
 *                     email: { type: string, format: email }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     status: { type: string }
 *                     businessUnits:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           businessUnitId: { type: string, format: uuid }
 *                           businessUnitName: { type: string }
 *                           roleName: { type: string }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   put:
 *     tags: [Users]
 *     summary: Actualizar usuario
 *     description: Actualiza información del usuario. Solo se pueden modificar firstName, lastName y status.
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
 *               firstName:
 *                 type: string
 *                 example: "Juan Carlos"
 *               lastName:
 *                 type: string
 *                 example: "Pérez López"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: Usuario actualizado
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
 *                     email: { type: string }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     status: { type: string }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar usuario
 *     description: Elimina un usuario del tenant. IMPORTANTE - Esto removerá todas sus asignaciones a Business Units.
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
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User deleted successfully" }
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
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
 * /users/{id}/business-units:
 *   post:
 *     tags: [Users]
 *     summary: Asignar usuario a Business Unit
 *     description: Asigna un usuario a una Business Unit con un rol específico. Un usuario puede tener roles diferentes en cada BU.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessUnitId, roleId]
 *             properties:
 *               businessUnitId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la Business Unit
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del rol a asignar
 *     responses:
 *       201:
 *         description: Usuario asignado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: string, format: uuid }
 *                     businessUnitId: { type: string, format: uuid }
 *                     businessUnitName: { type: string }
 *                     roleId: { type: string, format: uuid }
 *                     roleName: { type: string }
 *       400:
 *         description: Usuario ya asignado a esa BU o datos inválidos
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
 *         description: Usuario, Business Unit o Rol no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/business-units", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: "Not implemented yet" } });
});
export default router;

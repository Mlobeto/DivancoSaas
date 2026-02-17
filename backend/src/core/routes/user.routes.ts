import { Router, Request } from "express";
import { authenticate, authorize } from "@core/middlewares/auth.middleware";
import { UserService } from "@core/services/user.service";
import { z } from "zod";

const router = Router();
const userService = new UserService();

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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página actual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Registros por página
 *     responses:
 *       200:
 *         description: Lista de usuarios paginada
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalPages: { type: integer }
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
 *     description: Crea un usuario en el tenant y lo asigna a una Business Unit con un rol específico.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, firstName, lastName, businessUnitId, roleId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@empresa.com"
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 example: "María"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 example: "González"
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

const listQuerySchema = z.object({
  businessUnitId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

router.get("/", authorize("users:read"), async (req, res, next) => {
  try {
    const tenantId = (req as Request).context!.tenantId;
    const options = listQuerySchema.parse(req.query);

    const result = await userService.listUsers(tenantId, options);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  businessUnitId: z.string().uuid(),
  roleId: z.string().uuid(),
});

router.post("/", authorize("users:create"), async (req, res, next) => {
  try {
    const tenantId = (req as Request).context!.tenantId;
    const data = createUserSchema.parse(req.body);

    const user = await userService.createUser(data, tenantId);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
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

router.get("/:id", authorize("users:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).context.tenantId;
    const { id } = req.params;

    const user = await userService.getUserById(id, tenantId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

router.put("/:id", authorize("users:update"), async (req, res, next) => {
  try {
    const tenantId = (req as any).context.tenantId;
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const user = await userService.updateUser(id, data, tenantId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authorize("users:delete"), async (req, res, next) => {
  try {
    const tenantId = (req as any).context.tenantId;
    const { id } = req.params;

    await userService.deleteUser(id, tenantId);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
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

const assignRoleSchema = z.object({
  businessUnitId: z.string().uuid(),
  roleId: z.string().uuid(),
});

router.post(
  "/:id/business-units",
  authorize("users:update"),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).context.tenantId;
      const { id: userId } = req.params;
      const data = assignRoleSchema.parse(req.body);

      const result = await userService.assignRole(
        {
          userId,
          businessUnitId: data.businessUnitId,
          roleId: data.roleId,
        },
        tenantId,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /users/{id}/business-units/{businessUnitId}:
 *   delete:
 *     tags: [Users]
 *     summary: Remover usuario de Business Unit
 *     description: Remueve un usuario de una Business Unit específica. El usuario debe tener al menos una BU asignada.
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
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Usuario removido de la BU exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User removed from Business Unit" }
 *       400:
 *         description: No se puede remover la última BU del usuario
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
 *         description: Usuario o Business Unit no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id/business-units/:businessUnitId",
  authorize("users:update"),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).context.tenantId;
      const { id: userId, businessUnitId } = req.params;

      await userService.removeFromBusinessUnit(
        userId,
        businessUnitId,
        tenantId,
      );
      res.json({ success: true, message: "User removed from Business Unit" });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /users/{id}/deactivate:
 *   post:
 *     tags: [Users]
 *     summary: Desactivar usuario
 *     description: Desactiva un usuario (soft delete). El usuario no podrá acceder al sistema pero su información se conserva.
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
 *         description: Usuario desactivado exitosamente
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
 *                     status: { type: string, example: "INACTIVE" }
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
router.post(
  "/:id/deactivate",
  authorize("users:delete"),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).context.tenantId;
      const { id } = req.params;

      const user = await userService.deactivateUser(id, tenantId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

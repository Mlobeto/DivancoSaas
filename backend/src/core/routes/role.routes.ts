import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { RoleController } from "@core/controllers/role.controller";

const router = Router();

/**
 * Roles & Permissions Routes
 *
 * Endpoints para gestionar roles y permisos del sistema RBAC
 * Todos los endpoints requieren autenticación
 */

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles y permisos (RBAC)
 */

/**
 * GET /api/v1/roles
 * Lista roles disponibles (system + custom del tenant)
 */
router.get("/roles", authenticate, RoleController.list);

/**
 * GET /api/v1/roles/:id
 * Obtiene un rol específico con sus permisos
 */
router.get("/roles/:id", authenticate, RoleController.getById);

/**
 * GET /api/v1/roles/:id/permissions
 * Obtiene solo los permisos de un rol
 */
router.get(
  "/roles/:id/permissions",
  authenticate,
  RoleController.getPermissions,
);

/**
 * GET /api/v1/permissions
 * Lista todos los permisos disponibles en el sistema
 */
router.get("/permissions", authenticate, RoleController.listPermissions);

export default router;

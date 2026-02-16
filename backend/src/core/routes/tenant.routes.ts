import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { tenantController } from "@core/controllers/tenant.controller";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @openapi
 * /tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: List all tenants (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenants
 *       403:
 *         description: Access denied
 */
router.get("/", (req, res) => tenantController.getAllTenants(req, res));

/**
 * @openapi
 * /tenants/me:
 *   get:
 *     tags: [Tenants]
 *     summary: Get current user's tenant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current tenant information
 */
router.get("/me", (req, res) => tenantController.getCurrentTenant(req, res));

/**
 * @openapi
 * /tenants/{id}:
 *   get:
 *     tags: [Tenants]
 *     summary: Get tenant by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant information
 *       404:
 *         description: Tenant not found
 */
router.get("/:id", (req, res) => tenantController.getTenantById(req, res));

/**
 * @openapi
 * /tenants:
 *   post:
 *     tags: [Tenants]
 *     summary: Create new tenant (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               plan:
 *                 type: string
 *               billingEmail:
 *                 type: string
 *               country:
 *                 type: string
 *               enabledModules:
 *                 type: array
 *                 items:
 *                   type: string
 *               vertical:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tenant created
 *       403:
 *         description: Access denied
 */
router.post("/", (req, res) => tenantController.createTenant(req, res));

/**
 * @openapi
 * /tenants/{id}:
 *   put:
 *     tags: [Tenants]
 *     summary: Update tenant (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant updated
 *       403:
 *         description: Access denied
 */
router.put("/:id", (req, res) => tenantController.updateTenant(req, res));

/**
 * @openapi
 * /tenants/{id}:
 *   delete:
 *     tags: [Tenants]
 *     summary: Delete tenant (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant deleted
 *       403:
 *         description: Access denied
 */
router.delete("/:id", (req, res) => tenantController.deleteTenant(req, res));

export default router;

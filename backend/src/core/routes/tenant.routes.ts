import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @openapi
 * /tenants/me:
 *   get:
 *     tags: [Tenants]
 *     summary: Obtener información del tenant actual
 *     description: Devuelve la información completa del tenant autenticado (empresa cliente del SaaS).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del tenant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                   example: "Constructora ABC"
 *                 slug:
 *                   type: string
 *                   example: "constructora-abc"
 *                 plan:
 *                   type: string
 *                   example: "pro"
 *                   description: Plan de suscripción actual
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, SUSPENDED, CANCELLED]
 *                   example: "ACTIVE"
 *                 country:
 *                   type: string
 *                   example: "CO"
 *                   description: Código país ISO 3166-1 alpha-2
 *                 billingEmail:
 *                   type: string
 *                   format: email
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: No autenticado
 */
router.get("/me", async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: "Not implemented yet" } });
});

export default router;

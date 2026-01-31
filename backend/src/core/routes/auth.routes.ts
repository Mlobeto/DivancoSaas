import { Router } from "express";
import { z } from "zod";
import { authService } from "@core/services/auth.service";
import { authenticate } from "@core/middlewares/auth.middleware";

const router = Router();

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const registerSchema = z.object({
  tenantName: z.string().min(2, "Tenant name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number",
    ),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
  businessUnitName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  tenantSlug: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string().optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number",
    ),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number",
    ),
});

// ============================================
// ENDPOINTS
// ============================================

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo tenant con usuario admin
 *     description: Crea un nuevo tenant en la plataforma, primera Business Unit y usuario administrador. Este es el primer paso para usar el SaaS.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantName, email, password, firstName, lastName]
 *             properties:
 *               tenantName:
 *                 type: string
 *                 minLength: 2
 *                 example: "Constructora ABC"
 *                 description: Nombre de la empresa/tenant
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@constructora-abc.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *                 description: Debe contener mayúsculas, minúsculas y números
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 example: "Juan"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 example: "Pérez"
 *               country:
 *                 type: string
 *                 example: "CO"
 *                 description: "Código ISO del país (CO=Colombia, AR=Argentina, etc.) - Determina el payment provider"
 *               businessUnitName:
 *                 type: string
 *                 example: "Obras Civiles"
 *                 description: "Nombre de la primera Business Unit (opcional, default: 'Principal')"
 *     responses:
 *       201:
 *         description: Tenant y usuario creados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     email: { type: string }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     tenantId: { type: string, format: uuid }
 *                 tenant:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     plan: { type: string, example: "free" }
 *                 businessUnits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       slug: { type: string }
 *       400:
 *         description: Datos inválidos o email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);

  res.status(201).json({
    success: true,
    data: result,
  });
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login de usuario existente
 *     description: Autenticación de usuario con email y password. Devuelve JWT para usar en requests posteriores. Si el usuario pertenece a múltiples tenants, debe especificar tenantSlug.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@constructora-abc.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *               tenantSlug:
 *                 type: string
 *                 example: "constructora-abc"
 *                 description: Opcional - slug del tenant si el usuario pertenece a múltiples tenants
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT Bearer token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     email: { type: string }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     tenantId: { type: string, format: uuid }
 *                 tenant:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     plan: { type: string }
 *                 businessUnits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       slug: { type: string }
 *       400:
 *         description: Múltiples tenants encontrados - debe especificar tenantSlug
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *                 details:
 *                   type: object
 *                   properties:
 *                     tenants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tenantId: { type: string }
 *                           tenantName: { type: string }
 *                           tenantSlug: { type: string }
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un email con un link para resetear la contraseña. El link expira en 1 hora.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@constructora-abc.com"
 *               tenantSlug:
 *                 type: string
 *                 example: "constructora-abc"
 *                 description: Opcional - si el usuario existe en múltiples tenants
 *     responses:
 *       200:
 *         description: Email enviado (siempre retorna 200 aunque el usuario no exista por seguridad)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "If the email exists, a password reset link has been sent" }
 *       400:
 *         description: Múltiples cuentas - debe especificar tenantSlug
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/forgot-password", async (req, res) => {
  const data = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(data.email, data.tenantSlug);

  // Siempre retornar éxito por seguridad
  res.json({
    success: true,
    message: "If the email exists, a password reset link has been sent",
  });
});

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Resetear contraseña con token
 *     description: Cambia la contraseña usando el token recibido por email. El token expira en 1 hora.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "a1b2c3d4e5f6..."
 *                 description: Token recibido en el email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "NewSecurePass123!"
 *                 description: Nueva contraseña (debe contener mayúsculas, minúsculas y números)
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Password reset successfully" }
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/reset-password", async (req, res) => {
  const data = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(data.token, data.newPassword);

  res.json({
    success: true,
    message: "Password reset successfully",
  });
});

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Cambiar contraseña del usuario autenticado
 *     description: Permite al usuario cambiar su contraseña proporcionando la actual y la nueva.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "OldPass123!"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "NewSecurePass456!"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Password changed successfully" }
 *       401:
 *         description: Contraseña actual incorrecta o no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/change-password", authenticate, async (req, res) => {
  const data = changePasswordSchema.parse(req.body);
  const userId = (req as any).context.userId;

  await authService.changePassword(
    userId,
    data.currentPassword,
    data.newPassword,
  );

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

export default router;

import { Router } from 'express';
import { authenticate } from '@core/middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/v1/tenants/me
 * Obtener información del tenant actual
 */
router.get('/me', async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: 'Not implemented yet' } });
});

export default router;

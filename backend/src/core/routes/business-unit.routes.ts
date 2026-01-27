import { Router } from 'express';
import { authenticate } from '@core/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/business-units
 * Listar business units del tenant
 */
router.get('/', async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: [] });
});

/**
 * POST /api/v1/business-units
 * Crear nueva business unit
 */
router.post('/', async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: 'Not implemented yet' } });
});

export default router;

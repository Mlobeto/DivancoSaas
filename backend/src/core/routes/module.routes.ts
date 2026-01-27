import { Router } from 'express';
import { authenticate } from '@core/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/modules
 * Listar módulos disponibles
 */
router.get('/', async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: [] });
});

/**
 * POST /api/v1/modules/:moduleId/enable
 * Activar módulo en una business unit
 */
router.post('/:moduleId/enable', async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: 'Not implemented yet' } });
});

export default router;

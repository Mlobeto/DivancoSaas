import { Router } from 'express';
import { authenticate, requireBusinessUnit } from '@core/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireBusinessUnit);

/**
 * GET /api/v1/workflows
 * Listar workflows de la business unit actual
 */
router.get('/', async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: [] });
});

/**
 * POST /api/v1/workflows
 * Crear nuevo workflow
 */
router.post('/', async (req, res) => {
  // TODO: Implementar
  res.json({ success: true, data: { message: 'Not implemented yet' } });
});

export default router;

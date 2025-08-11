import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getAdminMetrics } from '../controllers/adminController';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', requireAuth, requireAdmin, getAdminMetrics);

export default router;

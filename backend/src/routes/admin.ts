import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getAdminMetrics, getAdmin7dStats } from '../controllers/adminController';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', requireAuth, requireAdmin, getAdminMetrics);

// GET /api/admin/stats-7d
router.get('/stats-7d', requireAuth, requireAdmin, getAdmin7dStats);

export default router;

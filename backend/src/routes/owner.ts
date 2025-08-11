import { Router } from 'express';
import { requireAuth, requireFacilityOwner } from '../middleware/auth';
import { getOwnerVenueMetrics, getOwnerVenue7dStats } from '../controllers/ownerController';

const router = Router();

// GET /api/owner/metrics?venueId=...
router.get('/metrics', requireAuth, requireFacilityOwner, getOwnerVenueMetrics);

// GET /api/owner/stats-7d?venueId=...
router.get('/stats-7d', requireAuth, requireFacilityOwner, getOwnerVenue7dStats);

export default router;

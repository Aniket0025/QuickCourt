import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getAdminMetrics, getAdmin7dStats } from '../controllers/adminController';
import { VenueModel } from '../models/Venue';
import { isValidObjectId } from 'mongoose';

const router = Router();

// GET /api/admin/metrics
router.get('/metrics', requireAuth, requireAdmin, getAdminMetrics);

// GET /api/admin/stats-7d
router.get('/stats-7d', requireAuth, requireAdmin, getAdmin7dStats);

// List pending facilities awaiting approval
router.get('/pending-venues', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const data = await VenueModel.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch pending venues' });
  }
});

// Approve a facility
router.patch('/venues/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await VenueModel.findByIdAndUpdate(
      id,
      { $set: { status: 'approved', approvedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Venue not found' });
    res.json({ data: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to approve venue' });
  }
});

// Reject a facility
router.patch('/venues/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await VenueModel.findByIdAndUpdate(
      id,
      { $set: { status: 'rejected' } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Venue not found' });
    res.json({ data: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject venue' });
  }
});

export default router;

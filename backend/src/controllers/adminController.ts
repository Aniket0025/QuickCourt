import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { VenueModel } from '../models/Venue';
import { BookingModel } from '../models/Booking';

export async function getAdminMetrics(_req: Request, res: Response) {
  try {
    const [totalUsers, facilityOwners, totalVenues, totalBookings] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: 'facility_owner' }),
      VenueModel.countDocuments({}),
      BookingModel.countDocuments({}),
    ]);

    // Sum of all courts across venues
    const courtsAgg = await VenueModel.aggregate([
      { $project: { courtCount: { $size: { $ifNull: ['$courts', []] } } } },
      { $group: { _id: null, total: { $sum: '$courtCount' } } }
    ]);
    const activeCourts = courtsAgg?.[0]?.total || 0;

    return res.json({
      totalUsers,
      facilityOwners,
      totalVenues,
      totalBookings,
      activeCourts,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load admin metrics' });
  }
}

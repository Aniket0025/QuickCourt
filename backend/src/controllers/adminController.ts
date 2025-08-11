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

export async function getAdmin7dStats(_req: Request, res: Response) {
  try {
    // last 7 calendar days including today, using UTC boundaries
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0));

    const dateFormat = { format: '%Y-%m-%d', date: '$createdAt' } as any;

    const [bookingsAgg, usersAgg] = await Promise.all([
      BookingModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: dateFormat }, count: { $sum: 1 } } },
      ]),
      UserModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: dateFormat }, count: { $sum: 1 } } },
      ]),
    ]);

    // map to full 7-day range, fill missing with 0
    const dayLabels: string[] = [];
    const bookingsPerDay: number[] = [];
    const registrationsPerDay: number[] = [];

    const byDate = (arr: { _id: string; count: number }[]) => {
      const m = new Map<string, number>();
      for (const it of arr) m.set(it._id, it.count);
      return m;
    };
    const bMap = byDate(bookingsAgg as any);
    const uMap = byDate(usersAgg as any);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayLabels.push(key);
      bookingsPerDay.push(bMap.get(key) || 0);
      registrationsPerDay.push(uMap.get(key) || 0);
    }

    return res.json({ dayLabels, bookingsPerDay, registrationsPerDay });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load 7d stats' });
  }
}
